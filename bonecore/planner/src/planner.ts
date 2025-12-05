import {
  CorruptionReport,
  ModernizationPlan,
  ModernizationTask,
  Severity,
  TaskType,
  ModernizationSpec,
  Language,
  loadKiroConfigSync,
  KiroModernizationConfig,
} from '@necro/common';
import path from 'node:path';
import { loadModernizationSpec } from '@necro/common';

const severityBaseScore: Record<Severity, number> = {
  [Severity.Info]: 25,
  [Severity.Low]: 40,
  [Severity.Medium]: 60,
  [Severity.High]: 80,
  [Severity.Critical]: 90,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const scoreTask = (severity: Severity, weight = 1): number => {
  return clamp(Math.round(severityBaseScore[severity] * weight), 0, 100);
};

const taskTypeFromIssue = (issue: { id: string }): TaskType => {
  if (issue.id.startsWith('dep:')) return TaskType.Dependency;
  if (issue.id.startsWith('api:')) return TaskType.ApiReplacement;
  if (issue.id.startsWith('structure:')) {
    if (issue.id.includes('readme')) return TaskType.Documentation;
    return TaskType.Refactor;
  }
  return TaskType.Refactor;
};

const applySpecRules = (
  task: ModernizationTask,
  spec?: ModernizationSpec,
  kiroCfg?: KiroModernizationConfig | null
): ModernizationTask | null => {
  if (kiroCfg?.documentation?.regenerateReadme === false && task.type === TaskType.Documentation) {
    return null;
  }

  if (!spec) return task;
  let current = task;
  for (const rule of spec.rules) {
    const targetType = rule.options?.['taskType'];
    const matchesType = !targetType || targetType === current.type;
    const matchesLanguage =
      !rule.languages || rule.languages.length === 0 || rule.languages.includes((current.metadata?.language as Language) ?? Language.Unknown);
    if (!matchesType || !matchesLanguage) continue;
    if (rule.enabled === false) {
      return null;
    }
    if (rule.options?.['confidenceMultiplier']) {
      const multiplier = Number(rule.options['confidenceMultiplier']);
      if (!Number.isNaN(multiplier)) {
        current = {
          ...current,
          confidence: clamp(Math.round(current.confidence * multiplier), 0, 100),
        };
      }
    }
  }
  return current;
};

export const generateTasks = (
  report: CorruptionReport,
  spec?: ModernizationSpec,
  kiroCfg?: KiroModernizationConfig | null
): ModernizationTask[] => {
  const tasks: ModernizationTask[] = [];

  for (const issue of report.issues) {
    const type = taskTypeFromIssue(issue);
    const confidence = scoreTask(issue.severity);
    const baseTask: ModernizationTask = {
      id: `task:${issue.id}`,
      type,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      confidence,
      files: issue.filePath ? [issue.filePath] : undefined,
      metadata: { language: issue.language, details: issue.details },
    };
    const adjusted = applySpecRules(baseTask, spec, kiroCfg);
    if (adjusted) {
      tasks.push(adjusted);
    }
  }

  return tasks;
};

export const planModernization = (
  report: CorruptionReport,
  spec?: ModernizationSpec
): ModernizationPlan => {
  let effectiveSpec = spec;
  if (!effectiveSpec) {
    try {
      const specPath = path.resolve(process.cwd(), '.kiro', 'specs', 'modernization-spec.yaml');
      // fire-and-forget load; if it fails, we fall back to default behavior
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      loadModernizationSpec(specPath).then(({ spec: loaded }) => {
        effectiveSpec = loaded;
      }).catch(() => {});
    } catch {
      // ignore spec load errors for now
    }
  }

  const kiroCfg: KiroModernizationConfig | null = loadKiroConfigSync();

  const tasks = generateTasks(report, effectiveSpec, kiroCfg);
  return {
    repository: report.repository,
    generatedAt: new Date().toISOString(),
    tasks,
  };
};

