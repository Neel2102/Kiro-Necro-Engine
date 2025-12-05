import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { scanRepository, RepositoryScanner } from '@necro/scanner';
import { planModernization } from '@necro/planner';
import { applyTransformations } from '@necro/transformer';
import { createReportBundle } from '@necro/reporter';
import { generateUnifiedDiff } from '@necro/integrations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repoPath: string | undefined = body?.repoPath;

    if (!repoPath || typeof repoPath !== 'string') {
      return NextResponse.json({ error: 'repoPath is required' }, { status: 400 });
    }

    let report;
    let basePath = repoPath;
    if (/^https?:\/\//.test(repoPath)) {
      const remoteScanner = new RepositoryScanner(repoPath);
      report = await remoteScanner.scan();
      // TypeScript hack: access internal repoPath for diff/apply base
      basePath = (remoteScanner as any).repoPath ?? basePath;
    } else {
      report = await scanRepository(repoPath);
    }
    const plan = planModernization(report as any);

    // capture before contents for planned files
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

    // build diffs
    const diffsInputs: { filePath: string; before: string; after: string }[] = [];
    for (const file of transform.modifiedFiles) {
      const full = path.join(repoPath, file);
      const after = await fs.readFile(full, 'utf-8').catch(() => '');
      diffsInputs.push({
        filePath: file,
        before: before.get(full) ?? '',
        after,
      });
    }

    const unifiedDiffs = diffsInputs.map((d) => generateUnifiedDiff(d.filePath, d.before, d.after));
    const bundle = createReportBundle(plan, transform, diffsInputs);

    return NextResponse.json({ report, plan, transform, bundle, unifiedDiffs });
  } catch (error) {
    console.error('Error in /api/pr-preview:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
