import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateTasks } from '../src/planner.js';
import { CorruptionReport, Severity, Language } from '@necro/common';

describe('Property 7: Confidence score bounds', () => {
  it('keeps confidence between 0 and 100 inclusive', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          Severity.Info,
          Severity.Low,
          Severity.Medium,
          Severity.High,
          Severity.Critical
        ),
        async (severity) => {
          const report: CorruptionReport = {
            repository: 'repo',
            scannedAt: new Date().toISOString(),
            issues: [
              {
                id: 'dep:test',
                title: 'dep',
                severity,
                language: Language.JavaScript,
              },
            ],
          };

          const tasks = generateTasks(report);
          expect(tasks[0].confidence).toBeGreaterThanOrEqual(0);
          expect(tasks[0].confidence).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 25 }
    );
  });
});

