import { ModernizationPlan, TaskType, TransformResult } from '@necro/common';

export interface DiffInput {
  filePath: string;
  before: string;
  after: string;
}

export interface DiffStat {
  filePath: string;
  diff: string;
  additions: number;
  deletions: number;
}

const taskTypeLabel: Record<TaskType, string> = {
  [TaskType.Dependency]: 'Dependencies',
  [TaskType.ApiReplacement]: 'APIs',
  [TaskType.Refactor]: 'Structure',
  [TaskType.Documentation]: 'Documentation',
};

export const generateRoadmap = (
  plan: ModernizationPlan,
  transform: TransformResult
): string => {
  const sections = plan.tasks.reduce<Record<string, string[]>>((acc, task) => {
    const key = taskTypeLabel[task.type] ?? 'Other';
    acc[key] = acc[key] ?? [];
    const files = task.files?.length ? ` (files: ${task.files.join(', ')})` : '';
    acc[key].push(`- ${task.title}${files} [confidence ${task.confidence}]`);
    return acc;
  }, {});

  const modified = transform.modifiedFiles?.map((f) => `- ${f}`).join('\n') ?? '';

  const lines: string[] = [
    `# Roadmap`,
    '',
    `Repository: ${plan.repository}`,
    `Generated: ${plan.generatedAt}`,
    '',
  ];

  for (const [section, items] of Object.entries(sections)) {
    lines.push(`## ${section}`, ...items, '');
  }

  if (modified) {
    lines.push('## Modified Files', modified, '');
  }

  return lines.join('\n').trimEnd();
};

const diffLines = (before: string, after: string, filePath: string): DiffStat => {
  const a = before.split('\n');
  const b = after.split('\n');
  const max = Math.max(a.length, b.length);
  const diff: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];
  let additions = 0;
  let deletions = 0;

  for (let i = 0; i < max; i++) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      if (left !== undefined) diff.push(` ${left}`);
      continue;
    }
    if (left !== undefined) {
      diff.push(`-${left}`);
      deletions++;
    }
    if (right !== undefined) {
      diff.push(`+${right}`);
      additions++;
    }
  }

  return { filePath, diff: diff.join('\n'), additions, deletions };
};

export const generateDiffs = (inputs: DiffInput[]): DiffStat[] =>
  inputs.map((input) => diffLines(input.before, input.after, input.filePath));

export const formatPrDescription = (
  plan: ModernizationPlan,
  transform: TransformResult,
  diffs: DiffStat[]
): string => {
  const fileList =
    transform.modifiedFiles?.map((f) => `- ${f}`).join('\n') ?? '- none';
  const totalAdd = diffs.reduce((sum, d) => sum + d.additions, 0);
  const totalDel = diffs.reduce((sum, d) => sum + d.deletions, 0);

  return [
    `## Necromantic Revival Plan`,
    `Repository: ${plan.repository}`,
    '',
    `Tasks revived: ${plan.tasks.length}`,
    `Files stirred: ${transform.modifiedFiles?.length ?? 0}`,
    `Changes: +${totalAdd} / -${totalDel}`,
    '',
    `### Spectral Files`,
    fileList,
    '',
    `### Incantations`,
    'The codebase has been raised with fresh dependencies and refactors.',
  ].join('\n');
};

export interface ReportBundle {
  roadmap: string;
  prDescription: string;
  diffs: DiffStat[];
  summary: {
    totalAdditions: number;
    totalDeletions: number;
  };
}

export const createReportBundle = (
  plan: ModernizationPlan,
  transform: TransformResult,
  diffInputs: DiffInput[]
): ReportBundle => {
  const diffs = generateDiffs(diffInputs);
  const roadmap = generateRoadmap(plan, transform);
  const prDescription = formatPrDescription(plan, transform, diffs);
  const summary = {
    totalAdditions: diffs.reduce((s, d) => s + d.additions, 0),
    totalDeletions: diffs.reduce((s, d) => s + d.deletions, 0),
  };

  return { roadmap, prDescription, diffs, summary };
};

