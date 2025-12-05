import { describe, it, expect } from 'vitest';
import { planModernization } from '../src/planner.js';
import { CorruptionReport, Severity, Language, ModernizationSpec } from '@necro/common';

describe('Property 8: Spec-driven planning', () => {
  it('disables tasks when spec rule is disabled', () => {
    const spec: ModernizationSpec = {
      version: '1.0',
      rules: [
        {
          name: 'disable-deps',
          enabled: false,
          options: { taskType: 'dependency' },
        },
      ],
    };

    const report: CorruptionReport = {
      repository: 'repo',
      scannedAt: new Date().toISOString(),
      issues: [
        { id: 'dep:a', title: 'a', severity: Severity.Low, language: Language.JavaScript },
        { id: 'api:x', title: 'x', severity: Severity.Medium, language: Language.TypeScript },
      ],
    };

    const plan = planModernization(report, spec);
    expect(plan.tasks.some((t) => t.type === 'dependency')).toBe(false);
    expect(plan.tasks.some((t) => t.type === 'api-replacement')).toBe(true);
  });
});

