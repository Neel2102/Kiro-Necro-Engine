import { NextRequest, NextResponse } from 'next/server';
import { scanRepository, RepositoryScanner } from '@necro/scanner';
import { planModernization } from '@necro/planner';
import path from 'node:path';

type HookFn = (payload: any) => Promise<any> | any;

async function maybeLoadHook(name: string): Promise<HookFn | null> {
  try {
    const hookPath = path.resolve(process.cwd(), '.kiro', 'hooks', `${name}.js`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(hookPath) as HookFn | { default: HookFn };
    const fn = typeof mod === 'function' ? mod : (mod as any).default;
    return typeof fn === 'function' ? fn : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repoPath: string | undefined = body?.repoPath;

    if (!repoPath || typeof repoPath !== 'string') {
      return NextResponse.json({ error: 'repoPath is required' }, { status: 400 });
    }

    const preScan = await maybeLoadHook('pre-scan');
    if (preScan) {
      const res = await preScan({ repoPath });
      if (res && res.continue === false) {
        return NextResponse.json({ error: 'Scan cancelled by pre-scan hook' }, { status: 400 });
      }
    }

    const isRemoteRepo = /^https?:\/\//.test(repoPath);

    let report;
    if (isRemoteRepo) {
      const remoteScanner = new RepositoryScanner(repoPath);
      report = await remoteScanner.scan();
    } else {
      report = await scanRepository(repoPath);
    }

    const postScan = await maybeLoadHook('post-scan');
    if (postScan) {
      report = await postScan({ scanResult: report });
    }

    const preTransform = await maybeLoadHook('pre-transform');
    let plan = planModernization(report);
    if (preTransform) {
      const res = await preTransform({ plan });
      if (res && res.plan) {
        plan = res.plan;
      }
    }

    const postReport = await maybeLoadHook('post-report');
    let responsePayload: any = {
      report,
      plan,
      metadata: {
        repoPath,
        isRemote: isRemoteRepo,
        scannedAt: new Date().toISOString(),
      },
    };
    if (postReport) {
      responsePayload = await postReport({ report: responsePayload });
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Error in /api/scan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
