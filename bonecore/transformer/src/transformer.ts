import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { HookRunner } from '@necro/hooks';
import {
  Language,
  ModernizationPlan,
  ModernizationSpec,
  ModernizationTask,
  TaskType,
  TransformResult,
  loadModernizationSpec,
  loadKiroConfigSync,
  KiroModernizationConfig,
} from '@necro/common';

interface TransformOutcome {
  code: string;
  changed: boolean;
}

const inferLanguage = (filePath: string): Language => {
  const ext = path.extname(filePath).toLowerCase();
  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return Language.JavaScript;
  if (ext === '.py') return Language.Python;
  return Language.Unknown;
};

const shouldTransformLanguage = (
  language: Language,
  spec?: ModernizationSpec
): boolean => {
  if (!spec) return true;
  return !spec.rules.some((rule) => {
    if (rule.enabled === false && rule.languages?.includes(language)) {
      return true;
    }
    return false;
  });
};

export const transformReactClassComponent = (source: string): TransformOutcome => {
  const classRegex =
    /class\s+(\w+)\s+extends\s+(?:React\.)?Component\s*\{([\s\S]*)\}/m;
  const match = source.match(classRegex);
  if (!match) return { code: source, changed: false };

  const [, className, body] = match;

  const renderMatch = body.match(
    /render\s*\(\s*\)\s*\{\s*return\s*([\s\S]*?)\s*;\s*\}/m
  );
  if (!renderMatch) return { code: source, changed: false };

  const renderReturn = renderMatch[1].trim();

  const mountMatch = body.match(
    /componentDidMount\s*\(\s*\)\s*\{\s*([\s\S]*?)\s*\}/m
  );
  const unmountMatch = body.match(
    /componentWillUnmount\s*\(\s*\)\s*\{\s*([\s\S]*?)\s*\}/m
  );

  const cleanedRender = renderReturn
    .replace(/this\.props/g, 'props')
    .replace(/this\.state/g, 'state');
  const effectBody = mountMatch
    ? mountMatch[1].replace(/this\.props/g, 'props').trim()
    : '';
  const cleanupBody = unmountMatch
    ? unmountMatch[1].replace(/this\.props/g, 'props').trim()
    : '';

  let functionBody = '';

  if (effectBody || cleanupBody) {
    functionBody += `  useEffect(() => {\n`;
    if (effectBody) {
      functionBody += `    ${effectBody}\n`;
    }
    if (cleanupBody) {
      functionBody += `    return () => {\n      ${cleanupBody}\n    };\n`;
    }
    functionBody += `  }, []);\n\n`;
  }

  functionBody += `  return ${cleanedRender};`;

  const functionComponent = `function ${className}(props) {\n${functionBody}\n}`;

  let updated = source.replace(classRegex, functionComponent);

  if (!/useEffect/.test(updated)) {
    // no lifecycle hooks used; no import required
  } else if (!/useEffect/.test(source)) {
    updated = `import { useEffect } from 'react';\n${updated}`;
  }

  return { code: updated, changed: true };
};

export const modernizePythonAsync = (source: string): TransformOutcome => {
  let changed = false;
  let updated = source;

  updated = updated.replace(
    /@asyncio\.coroutine\s*\n\s*def\s+(\w+)/g,
    (_match, name) => {
      changed = true;
      return `async def ${name}`;
    }
  );

  if (/yield from/.test(updated)) {
    changed = true;
    updated = updated.replace(/yield from/g, 'await');
  }

  return { code: updated, changed };
};

export interface ReadmeMetadata {
  name: string;
  description?: string;
  dependencies?: string[];
  commands?: string[];
}

export const generateReadme = (meta: ReadmeMetadata): string => {
  const depsSection =
    meta.dependencies?.length &&
    meta.dependencies.map((dep) => `- ${dep}`).join('\n');
  const commandsSection =
    meta.commands?.length && meta.commands.map((cmd) => `- ${cmd}`).join('\n');

  return [
    `# ${meta.name}`,
    '',
    meta.description ?? 'Modernized by Necro Engine.',
    '',
    '## Installation',
    '```',
    'npm install',
    '```',
    '',
    '## Usage',
    '```',
    commandsSection || 'npm run start',
    '```',
    '',
    '## Dependencies',
    depsSection || '- None',
    '',
    '## Contributing',
    'Pull requests are welcome. Please open an issue for major changes.',
    '',
  ].join('\n');
};

export const populateMetadata = (
  pkg: Record<string, unknown>
): { pkg: Record<string, unknown>; added: string[] } => {
  const updated = { ...pkg };
  const added: string[] = [];

  if (!updated['license']) {
    updated['license'] = 'MIT';
    added.push('license');
  }

  if (!updated['badges']) {
    updated['badges'] = {
      build: 'status:passing',
      version: 'v1',
      license: 'MIT',
    };
    added.push('badges');
  }

  if (!updated['scripts'] || typeof updated['scripts'] !== 'object') {
    updated['scripts'] = { start: 'node index.js' };
    added.push('scripts');
  }

  return { pkg: updated, added };
};

const transformFileByLanguage = (
  language: Language,
  contents: string,
  spec?: ModernizationSpec
): TransformOutcome => {
  // Prefer the Kiro config from .kiro/specs/modernization-spec.yaml when present,
  // but fall back to any provided ModernizationSpec.rules object for backward
  // compatibility. This ensures existing callers are not broken.
  const kiroCfg: KiroModernizationConfig | null = loadKiroConfigSync();
  const rules: any =
    kiroCfg ?? (spec && (spec as any).rules && !(spec as any).rules.length ? (spec as any).rules : {});

  if (language === Language.JavaScript) {
    const jsRules = rules.javascript ?? {};
    if (jsRules['convert-class-components'] === false) {
      return { code: contents, changed: false };
    }
    return transformReactClassComponent(contents);
  }

  if (language === Language.Python) {
    const pyRules = rules.python ?? {};
    if (pyRules['fix-legacy-async'] === false) {
      return { code: contents, changed: false };
    }
    return modernizePythonAsync(contents);
  }

  return { code: contents, changed: false };
};

const applyTaskToFile = async (
  repoPath: string,
  task: ModernizationTask,
  spec?: ModernizationSpec
): Promise<string[]> => {
  if (!task.files?.length) return [];
  const modified: string[] = [];

  for (const relative of task.files) {
    const filePath = path.join(repoPath, relative);
    const language = inferLanguage(filePath);
    if (!shouldTransformLanguage(language, spec)) continue;

    try {
      const original = await readFile(filePath, 'utf-8');
      const { code, changed } = transformFileByLanguage(language, original, spec);
      if (changed && code !== original) {
        await writeFile(filePath, code, 'utf-8');
        modified.push(relative);
      }
    } catch (error) {
      // Skip missing files silently for now
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return modified;
};

export const applyTransformations = async (
  repoPath: string,
  plan: ModernizationPlan,
  spec?: ModernizationSpec
): Promise<TransformResult> => {
  let effectiveSpec = spec;
  // Load the high-level Kiro config if available. If it's missing, we fall back
  // to the more strict ModernizationSpec loader (for advanced setups).
  const kiroCfg: KiroModernizationConfig | null = loadKiroConfigSync();
  if (!effectiveSpec && !kiroCfg) {
    try {
      const specPath = path.resolve(process.cwd(), '.kiro', 'specs', 'modernization-spec.yaml');
      const { spec: loaded } = await loadModernizationSpec(specPath);
      effectiveSpec = loaded;
    } catch {
      // ignore spec load errors; fall back to defaults
    }
  }

  const modifiedFiles: string[] = [];
  const warnings: string[] = [];

  for (const task of plan.tasks) {
    try {
      if (task.type === TaskType.Documentation) {
        const docsRules: any =
          (kiroCfg && kiroCfg.documentation) ||
          (effectiveSpec && (effectiveSpec as any).rules
            ? (effectiveSpec as any).rules.documentation
            : {});
        if (docsRules && docsRules['regenerate-readme'] === false) {
          continue;
        }
        const readmePath = path.join(repoPath, 'README.md');
        const content = generateReadme({
          name: task.title,
          description: task.description,
          commands: task.metadata?.commands as string[] | undefined,
          dependencies: task.metadata?.dependencies as string[] | undefined,
        });
        await writeFile(readmePath, content, 'utf-8');
        modifiedFiles.push('README.md');
        continue;
      }

      if (task.type === TaskType.Refactor || task.type === TaskType.ApiReplacement) {
        const files = await applyTaskToFile(repoPath, task, effectiveSpec);
        modifiedFiles.push(...files);
        continue;
      }

      if (task.type === TaskType.Dependency) {
        const pkgPath = path.join(repoPath, 'package.json');
        try {
          const raw = await readFile(pkgPath, 'utf-8');
          const pkg = JSON.parse(raw);
          const { pkg: populated, added } = populateMetadata(pkg);
          if (added.length) {
            await writeFile(pkgPath, JSON.stringify(populated, null, 2), 'utf-8');
            modifiedFiles.push('package.json');
          }
        } catch {
          warnings.push(`Skipped dependency task for missing package.json`);
        }
      }
    } catch (error) {
      warnings.push(
        `Failed to apply task ${task.id || task.title}: ${(error as Error).message}`
      );
    }
  }

  return {
    repository: plan.repository,
    appliedAt: new Date().toISOString(),
    modifiedFiles,
    warnings: warnings.length ? warnings : undefined,
  };
};

