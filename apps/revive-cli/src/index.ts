#!/usr/bin/env node
// Revive-CLI Application
// Command-line interface for the Necro-Engine

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import cliProgress from 'cli-progress';
import { scanRepository, RepositoryScanner } from '@necro/scanner';
import { planModernization } from '@necro/planner';
import { applyTransformations } from '@necro/transformer';
import { createReportBundle } from '@necro/reporter';
import { generateUnifiedDiff, GitClient, GitHubMcpClient } from '@necro/integrations';
import { modernizeCommand } from './commands/modernize.js';
import { rulesCommand } from './commands/rules.js';
import { initCommand } from './commands/init.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, pathToFileURL as toFileUrl } from 'node:url';
import YAML from 'yaml';

const spectral = (text: string) => chalk.greenBright(text);
const skull = chalk.green('☠');

type HookFn = (payload: any) => Promise<any> | any;

const maybeLoadHook = async (name: string): Promise<HookFn | null> => {
  try {
    const hookPath = path.join(process.cwd(), '.kiro', 'hooks', `${name}.js`);
    const url = toFileUrl(hookPath).href;
    // Dynamic import so hooks stay optional
    const mod: any = await import(url);
    const fn = typeof mod === 'function' ? mod : mod?.default;
    return typeof fn === 'function' ? fn : null;
  } catch {
    return null;
  }
};

const formatReportSummary = (report: Awaited<ReturnType<typeof scanRepository>>): string => {
  const sev = report.summary?.bySeverity;
  return [
    `${skull} Repository: ${chalk.cyan(report.repository)}`,
    `Issues found: ${report.summary?.total ?? report.issues.length}`,
    sev
      ? `Severity - info:${sev.info} low:${sev.low} medium:${sev.medium} high:${sev.high} critical:${sev.critical}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};

const formatPlanSummary = (
  plan: Awaited<ReturnType<typeof planModernization>>
): string => `${skull} Tasks generated: ${plan.tasks.length}`;

const runSkeletonCheck = async () => {
  const root = process.cwd();
  const specPath = path.join(root, '.kiro', 'specs', 'skeleton-spec.yaml');
  const checkResults: string[] = [];

  let spec: any | null = null;
  try {
    const raw = await fs.readFile(specPath, 'utf-8');
    spec = YAML.parse(raw) as any;
  } catch (error) {
    checkResults.push(
      `skeleton-spec: failed to read or parse ${specPath}: ${(error as Error).message}`
    );
  }

  const apps: Record<string, { pkg: string; src: string }> = {
    'revive-web': { pkg: path.join(root, 'apps', 'revive-web', 'package.json'), src: path.join(root, 'apps', 'revive-web', 'src') },
    'revive-cli': { pkg: path.join(root, 'apps', 'revive-cli', 'package.json'), src: path.join(root, 'apps', 'revive-cli', 'src') },
  };

  const appSpecs: Record<string, { 'must-import'?: string[] }> =
    spec?.apps ?? {};

  // Verify actual source imports for must-import modules
  for (const [appName, { pkg, src }] of Object.entries(apps)) {
    try {
      const pkgJson = JSON.parse(await fs.readFile(pkg, 'utf-8')) as any;
      const deps = pkgJson.dependencies ?? {};
      const mustImport = (appSpecs[appName]?.['must-import'] ?? []) as string[];
      const requiredDeps = mustImport.map((m) => `@necro/${m}`);
      const missing = requiredDeps.filter((d) => !deps[d]);
      if (missing.length) {
        checkResults.push(`${appName} missing BoneCore deps: ${missing.join(', ')}`);
        continue; // skip import check if deps are missing
      }

      // Scan source files for import presence
      const foundImports = new Set<string>();
      try {
        await fs.access(src);
        const files = await fs.readdir(src, { withFileTypes: true });
        for (const ent of files) {
          if (ent.isFile() && /\.(ts|tsx|js|jsx)$/.test(ent.name)) {
            const filePath = path.join(src, ent.name);
            const content = await fs.readFile(filePath, 'utf-8');
            // Simple regex-based import detection for speed
            for (const mod of mustImport) {
              if (new RegExp(`from\s+['"]@necro/${mod}['"]`).test(content) ||
                  new RegExp(`import\s+.*@necro/${mod}`).test(content)) {
                foundImports.add(mod);
              }
            }
          }
        }
      } catch {
        // src directory does not exist or cannot be accessed; ignore
      }
      const notImported = mustImport.filter(m => !foundImports.has(m));
      if (notImported.length) {
        checkResults.push(`${appName} missing imports of BoneCore modules: ${notImported.join(', ')}`);
      } else {
        checkResults.push(`${appName}: BoneCore dependencies and imports OK`);
      }
    } catch (error) {
      checkResults.push(
        `${appName}: failed to verify imports: ${(error as Error).message}`
      );
    }
  }

  console.log(spectral('Skeleton check results:'));
  for (const line of checkResults) {
    console.log(' -', line);
  }
};

export const runScan = async (repoPath: string, verbose = false): Promise<{ output: string }> => {
  try {
    await fs.access(repoPath);
  } catch {
    throw new Error(`Repository path not found: ${repoPath}`);
  }
  
  if (verbose) {
    console.log(`Starting scan of repository: ${repoPath}`);
    console.log('Verbose mode enabled. Generating detailed report...');
  }
  
  const preScan = await maybeLoadHook('pre-scan');
  if (preScan) {
    const res = await preScan({ repoPath });
    if (res && res.continue === false) {
      return { output: 'Scan cancelled by pre-scan hook.' };
    }
  }

  let report = await scanRepository(repoPath);

  const postScan = await maybeLoadHook('post-scan');
  if (postScan) {
    report = (await postScan({ scanResult: report })) ?? report;
  }
  let output = formatReportSummary(report);
  
  if (verbose) {
    if (report.issues.length > 0) {
      output += '\n\n=== Detailed Issues ===\n';
      report.issues.forEach((issue, index) => {
        output += `\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}`;
        
        if (issue.filePath) {
          output += `\n   File: ${path.relative(process.cwd(), issue.filePath)}`;
          if (issue.line) {
            output += `:${issue.line}`;
          }
        }
        
        if (issue.language) {
          output += `\n   Language: ${issue.language}`;
        }
        
        if (issue.description) {
          output += `\n   Description: ${issue.description}`;
        }
        
        if (issue.details) {
          output += `\n   Details:`;
          const details = typeof issue.details === 'string' 
            ? issue.details 
            : JSON.stringify(issue.details, null, 2);
          output += `\n${details.split('\n').map(line => `     ${line}`).join('\n')}`;
        }
      });

program
  .command('skeleton-check')
  .description('Verify BoneCore skeleton compliance for web and CLI apps')
  .action(async () => {
    const spinner = ora('Checking BoneCore skeleton...').start();
    try {
      await runSkeletonCheck();
      spinner.succeed('Skeleton check complete');
    } catch (error) {
      spinner.fail('Skeleton check failed');
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });
    } else {
      output += '\n\nNo issues found during the scan.';
    }
  }
  
  return { output };
};


export const runPlan = async (repoPath: string) => {
  const report = await scanRepository(repoPath);
  const plan = planModernization(report);
  return { plan, output: `${formatReportSummary(report)}\n${formatPlanSummary(plan)}` };
};

export const runApply = async (repoPath: string) => {
  const { plan } = await runPlan(repoPath);
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(plan.tasks.length || 1, 0);
  const preTransform = await maybeLoadHook('pre-transform');
  let effectivePlan = plan;
  if (preTransform) {
    const res = await preTransform({ plan });
    if (res && res.plan) {
      effectivePlan = res.plan;
    }
  }

  const result = await applyTransformations(repoPath, effectivePlan);
  bar.update(plan.tasks.length || 1);
  bar.stop();
  const output = [
    spectral('Transformation complete!'),
    `Files modified: ${result.modifiedFiles.length}`,
  ].join('\n');
  return { plan, result, output };
};

const collectDiffs = async (
  repoPath: string,
  files: string[],
  beforeMap: Map<string, string>
) => {
  const diffs = [];
  for (const file of files) {
    const full = path.join(repoPath, file);
    const before = beforeMap.get(full) ?? '';
    const after = await fs.readFile(full, 'utf-8').catch(() => '');
    diffs.push(generateUnifiedDiff(file, before, after));
  }
  return diffs;
};

const parseGitHubSlug = (input: string): { owner: string; repo: string } | null => {
  // support https://github.com/owner/repo(.git), git@github.com:owner/repo.git, or owner/repo
  const urlMatch = input.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }
  const slugMatch = input.match(/^([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (slugMatch) {
    return { owner: slugMatch[1], repo: slugMatch[2] };
  }
  return null;
};

export const runPr = async (repoPath: string) => {
  const isRemote = /github\.com/.test(repoPath) || /^https?:\/\//.test(repoPath);
  let basePath = repoPath;
  let report;

  if (isRemote) {
    const preScan = await maybeLoadHook('pre-scan');
    if (preScan) {
      const res = await preScan({ repoPath });
      if (res && res.continue === false) {
        return {
          plan: { repository: repoPath, generatedAt: new Date().toISOString(), tasks: [] },
          transform: { repository: repoPath, appliedAt: new Date().toISOString(), modifiedFiles: [] },
          bundle: { prDescription: 'Scan cancelled by pre-scan hook.', roadmap: '', diffs: [] },
          output: 'Scan cancelled by pre-scan hook.',
          prUrl: undefined,
        } as any;
      }
    }

    const scanner = new RepositoryScanner(repoPath);
    report = await scanner.scan();
    basePath = (scanner as any).repoPath ?? basePath;
  } else {
    report = await scanRepository(repoPath);
  }

  const plan = planModernization(report as any);

  // capture before contents
  const before = new Map<string, string>();
  if (plan.tasks.length) {
    for (const task of plan.tasks) {
      for (const file of task.files ?? []) {
        const full = path.join(basePath, file);
        try {
          before.set(full, await fs.readFile(full, 'utf-8'));
        } catch {
          before.set(full, '');
        }
      }
    }
  }

  const preTransform = await maybeLoadHook('pre-transform');
  let effectivePlan = plan;
  if (preTransform) {
    const res = await preTransform({ plan });
    if (res && res.plan) {
      effectivePlan = res.plan;
    }
  }

  const transform = await applyTransformations(basePath, effectivePlan);
  const diffs = await collectDiffs(basePath, transform.modifiedFiles, before);

  const diffInputs = [];
  for (const d of diffs) {
    const full = path.join(basePath, d.filePath);
    const after = await fs.readFile(full, 'utf-8').catch(() => '');
    diffInputs.push({
      filePath: d.filePath,
      before: before.get(full) ?? '',
      after,
    });
  }

  const bundle = createReportBundle(effectivePlan, transform, diffInputs);

  // Regression ghost: derive top author from git log
  let ghostLine = '';
  try {
    const git = new GitClient({ repoPath: basePath });
    const topAuthor = await git.getTopAuthor();
    if (topAuthor) {
      ghostLine = `\n\n_Regression ghost: ${topAuthor.name} <${topAuthor.email}>_`;
    }
  } catch {/* ignore ghost failures */}

  let prUrl: string | undefined;
  if (isRemote) {
    const slug = parseGitHubSlug(repoPath);
    if (slug) {
      const branchName = `necro/revive-${Date.now()}`;
      const git = new GitClient({ repoPath: basePath });
      await git.createBranch(branchName);
      await git.stageAll();
      await git.commit('Necro-Engine automated modernization');
      await git.push(branchName);

      const gh = new GitHubMcpClient();
      const pr = await gh.request<any>({
        path: `/repos/${slug.owner}/${slug.repo}/pulls`,
        init: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Necro-Engine modernization',
            head: branchName,
            body: bundle.prDescription + ghostLine,
          }),
        },
      });
      prUrl = pr.html_url as string | undefined;
    }
  }

  const postReport = await maybeLoadHook('post-report');

  let finalBundle = bundle;
  if (postReport) {
    const res = await postReport({ report: { plan: effectivePlan, transform, bundle } });
    if (res && res.bundle) {
      finalBundle = res.bundle;
    }
  }

  const outputParts = [spectral('PR ready!')];
  if (prUrl) {
    outputParts.push(`GitHub PR: ${prUrl}`);
  }
  outputParts.push(finalBundle.prDescription + ghostLine);

  const output = outputParts.join('\n');

  return { plan, transform, bundle: finalBundle, output, prUrl };
};

const program = new Command();

program
  .name('revive')
  .description('Necromancy-themed repository revival CLI')
  .version('0.1.0');

// Define the scan command
program
  .command('scan')
  .description('Scan a repository for issues')
  .argument('<repo>', 'repository path')
  .option('-v, --verbose', 'verbose logging')
  .action(async (repo, options) => {
    const verbose = options.verbose || false;
    console.log(`Verbose flag value: ${verbose}`);
    
    const spinner = ora('Scanning repository...').start();
    try {
      const { output } = await runScan(repo, verbose);
      spinner.succeed('Scan complete');
      console.log(output);
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });

// Modernization planner commands
program.addCommand(initCommand);
program.addCommand(modernizeCommand);
program.addCommand(rulesCommand);

program
  .command('plan')
  .argument('<repo>', 'repository path')
  .description('Generate modernization plan')
  .action(async (repo) => {
    const spinner = ora('Planning resurrection...').start();
    try {
      const { output } = await runPlan(repo);
      spinner.succeed('Plan ready');
      console.log(output);
    } catch (error) {
      spinner.fail('Plan failed');
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });

program
  .command('apply')
  .argument('<repo>', 'repository path')
  .description('Apply transformations')
  .action(async (repo) => {
    const spinner = ora('Applying transformations...').start();
    try {
      const { output } = await runApply(repo);
      spinner.succeed('Applied');
      console.log(output);
    } catch (error) {
      spinner.fail('Apply failed');
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });

program
  .command('pr')
  .argument('<repo>', 'repository path')
  .description('Run full workflow and format PR text')
  .action(async (repo) => {
    const spinner = ora('Raising full PR...').start();
    try {
      const { output } = await runPr(repo);
      spinner.succeed('PR crafted');
      console.log(output);
    } catch (error) {
      spinner.fail('PR generation failed');
      console.error(chalk.red((error as Error).message));
      process.exitCode = 1;
    }
  });

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  program.parseAsync(process.argv);
}

export default program;
