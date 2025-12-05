// Post-report hook - runs after report generation
import { HookContext, ModernizationPlan, TransformResult } from '@necro/common';

interface ReportBundle {
  roadmap: string;
  prDescription: string;
  diffs: any[];
  summary: {
    totalAdditions: number;
    totalDeletions: number;
  };
}

export default async function postReportHook(ctx: HookContext): Promise<Record<string, unknown> | void> {
  const { data, repoPath } = ctx;
  const report = data.report as { plan: ModernizationPlan; transform: TransformResult; bundle: ReportBundle } | undefined;
  
  if (!report) {
    console.log('[Post-Report Hook] No report available');
    return data;
  }
  
  console.log(`[Post-Report Hook] Report generated for: ${report.plan.repository}`);
  console.log(`[Post-Report Hook] Modified ${report.transform.modifiedFiles.length} files`);
  
  // Enhance PR description with necromantic flair
  const enhancedDescription = [
    '# 🔮 Necromantic Revival Complete',
    '',
    report.bundle.prDescription,
    '',
    '## 📊 Resurrection Statistics',
    '',
    `- **Tasks Completed:** ${report.plan.tasks.length}`,
    `- **Files Revived:** ${report.transform.modifiedFiles.length}`,
    `- **Lines Added:** +${report.bundle.summary.totalAdditions}`,
    `- **Lines Removed:** -${report.bundle.summary.totalDeletions}`,
    '',
    '## 🎯 Modernization Highlights',
    '',
    ...report.plan.tasks.slice(0, 5).map(task => 
      `- **${task.title}** (${task.type}) - Confidence: ${task.confidence}%`
    ),
    '',
    '---',
    '',
    '*Automated modernization powered by [Necro-Engine](https://github.com/necro-engine)*',
    '',
    '> "From the ashes of legacy code, we raise a modern phoenix." 🔥',
  ].join('\n');
  
  return {
    ...data,
    report: {
      ...report,
      bundle: {
        ...report.bundle,
        prDescription: enhancedDescription
      }
    }
  };
}
