import { describe, it, expect } from 'vitest';
import { generateTasks } from '../src/planner.js';
import { CorruptionReport, Severity, Language } from '@necro/common';

describe('Property 6: API replacement mapping', () => {
  it('maps API issues to api-replacement tasks', () => {
    const report: CorruptionReport = {
      repository: 'repo',
      scannedAt: new Date().toISOString(),
      issues: [
        {
          id: 'api:react-create-class',
          title: 'Uses React.createClass',
          severity: Severity.Medium,
          language: Language.TypeScript,
        },
      ],
    };

    const tasks = generateTasks(report);
    expect(tasks[0].type).toBe('api-replacement');
  });
});

