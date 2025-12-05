import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CorruptionReport,
  Issue,
  Language,
  Severity,
} from '@necro/common';

const readIfExists = async (filePath: string): Promise<string | undefined> => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return undefined;
  }
};

const walkFiles = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files;
};

export const scanDependencies = async (repoPath: string): Promise<Issue[]> => {
  const issues: Issue[] = [];
  const pkgPath = path.join(repoPath, 'package.json');
  const pkgRaw = await readIfExists(pkgPath);
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      Object.keys(deps).forEach((name) => {
        issues.push({
          id: `dep:${name}`,
          type: 'dependency',
          title: `Dependency detected: ${name}`,
          severity: Severity.Low,
          language: Language.JavaScript,
          details: { version: deps[name], source: 'package.json' },
        });
      });
    } catch {
      issues.push({
        id: 'dep:package-parse',
        type: 'dependency',
        title: 'Unable to parse package.json',
        severity: Severity.Medium,
        language: Language.JavaScript,
      });
    }
  }

  const reqPath = path.join(repoPath, 'requirements.txt');
  const reqRaw = await readIfExists(reqPath);
  if (reqRaw) {
    reqRaw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const [name, version] = line.split(/==|>=|<=|>/);
        if (name) {
          issues.push({
            id: `dep:${name}`,
            type: 'dependency',
            title: `Dependency detected: ${name}`,
            severity: Severity.Low,
            language: Language.Python,
            details: { version: version ?? 'unspecified', source: 'requirements.txt' },
          });
        }
      });
  }

  return issues;
};

const jsApiPatterns: { id: string; title: string; regex: RegExp }[] = [
  { id: 'react-create-class', title: 'Uses React.createClass', regex: /React\.createClass/ },
  { id: 'component-will-mount', title: 'Uses componentWillMount', regex: /componentWillMount/ },
];

const pyApiPatterns: { id: string; title: string; regex: RegExp }[] = [
  { id: 'asyncio-get-loop', title: 'Uses asyncio.get_event_loop', regex: /asyncio\.get_event_loop/ },
  { id: 'yield-from', title: 'Uses legacy yield from', regex: /yield\s+from/ },
];

export const scanDeprecatedApis = async (repoPath: string): Promise<Issue[]> => {
  const issues: Issue[] = [];
  const files = await walkFiles(repoPath);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.js', '.jsx', '.ts', '.tsx', '.py'].includes(ext)) continue;
    const content = await readIfExists(file);
    if (!content) continue;

    if (ext === '.py') {
      pyApiPatterns.forEach((pattern) => {
        if (pattern.regex.test(content)) {
          issues.push({
            id: `api:${pattern.id}:${file}`,
            type: 'api',
            title: pattern.title,
            severity: Severity.Medium,
            language: Language.Python,
            filePath: file,
          });
        }
      });
    } else {
      jsApiPatterns.forEach((pattern) => {
        if (pattern.regex.test(content)) {
          issues.push({
            id: `api:${pattern.id}:${file}`,
            type: 'api',
            title: pattern.title,
            severity: Severity.Medium,
            language: Language.TypeScript,
            filePath: file,
          });
        }
      });
    }
  }
  return issues;
};

export const scanStructuralIssues = async (repoPath: string): Promise<Issue[]> => {
  const issues: Issue[] = [];
  const readmePath = path.join(repoPath, 'README.md');
  const hasReadme = !!(await readIfExists(readmePath));
  if (!hasReadme) {
    issues.push({
      id: 'structure:missing-readme',
      type: 'documentation',
      title: 'Missing README.md',
      severity: Severity.Low,
      language: Language.Unknown,
    });
  }

  const testResultsPath = path.join(repoPath, 'test-results.txt');
  const testResults = await readIfExists(testResultsPath);
  if (testResults && testResults.includes('FAIL')) {
    issues.push({
      id: 'structure:failing-tests',
      type: 'documentation',
      title: 'Detected failing tests',
      severity: Severity.High,
      language: Language.Unknown,
    });
  }

  const obsoleteConfigPath = path.join(repoPath, 'obsolete.config');
  const hasObsoleteConfig = !!(await readIfExists(obsoleteConfigPath));
  if (hasObsoleteConfig) {
    issues.push({
      id: 'structure:obsolete-config',
      type: 'documentation',
      title: 'Obsolete configuration detected',
      severity: Severity.Medium,
      language: Language.Unknown,
      filePath: obsoleteConfigPath,
    });
  }

  return issues;
};

export const scanRepository = async (repoPath: string): Promise<CorruptionReport> => {
  const [deps, apis, structural] = await Promise.all([
    scanDependencies(repoPath),
    scanDeprecatedApis(repoPath),
    scanStructuralIssues(repoPath),
  ]);

  const issues = [...deps, ...apis, ...structural];
  const bySeverity: Record<Severity, number> = {
    [Severity.Info]: 0,
    [Severity.Low]: 0,
    [Severity.Medium]: 0,
    [Severity.High]: 0,
    [Severity.Critical]: 0,
  };

  issues.forEach((issue) => {
    bySeverity[issue.severity] = (bySeverity[issue.severity] ?? 0) + 1;
  });

  return {
    repository: repoPath,
    scannedAt: new Date().toISOString(),
    issues,
    summary: {
      total: issues.length,
      bySeverity,
    },
  };
};

