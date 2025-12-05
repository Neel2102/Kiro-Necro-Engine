import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { scanRepository, RepositoryScanner } from '@necro/scanner';
import { planModernization } from '@necro/planner';
import { applyTransformations } from '@necro/transformer';
import { createReportBundle } from '@necro/reporter';
import { generateUnifiedDiff, GitClient, GitHubMcpClient } from '@necro/integrations';

const parseGitHubSlug = (input: string): { owner: string; repo: string } | null => {
  const urlMatch = input.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };
  const slugMatch = input.match(/^([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (slugMatch) return { owner: slugMatch[1], repo: slugMatch[2] };
  return null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repoPath: string | undefined = body?.repoPath;

    if (!repoPath || typeof repoPath !== 'string') {
      return NextResponse.json({ error: 'repoPath is required' }, { status: 400 });
    }

    const isRemote = /github\.com/.test(repoPath) || /^https?:\/\//.test(repoPath);
    let basePath = repoPath;
    let report;

    if (isRemote) {
      const scanner = new RepositoryScanner(repoPath);
      report = await scanner.scan();
      basePath = (scanner as any).repoPath ?? basePath;
    } else {
      report = await scanRepository(repoPath);
    }

    const plan = planModernization(report as any);

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

    const transform = await applyTransformations(basePath, plan);

    const diffInputs: { filePath: string; before: string; after: string }[] = [];
    for (const file of transform.modifiedFiles) {
      const full = path.join(basePath, file);
      const after = await fs.readFile(full, 'utf-8').catch(() => '');
      diffInputs.push({
        filePath: file,
        before: before.get(full) ?? '',
        after,
      });
    }

    const bundle = createReportBundle(plan, transform, diffInputs);

    // Regression ghost
    let ghostLine = '';
    try {
      const git = new GitClient({ repoPath: basePath });
      const topAuthor = await git.getTopAuthor();
      if (topAuthor) {
        ghostLine = `\n\n_Regression ghost: ${topAuthor.name} <${topAuthor.email}>_`;
      }
    } catch {/* ignore */}

    let prUrl: string | undefined;
    if (isRemote) {
      const slug = parseGitHubSlug(repoPath);
      if (!slug) {
        return NextResponse.json({ error: 'Could not parse GitHub owner/repo from URL' }, { status: 400 });
      }
      const branchName = `necro/revive-${Date.now()}`;
      const git = new GitClient({ repoPath: basePath });
      await git.createBranch(branchName);
      await git.stageAll();
      await git.commit('Necro-Engine automated modernization (web)');
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

    const unifiedDiffs = diffInputs.map((d) => generateUnifiedDiff(d.filePath, d.before, d.after));

    return NextResponse.json({
      plan,
      transform,
      bundle: {
        ...bundle,
        prDescription: bundle.prDescription + ghostLine,
      },
      unifiedDiffs,
      prUrl,
    });
  } catch (error) {
    console.error('Error in /api/github-pr:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
