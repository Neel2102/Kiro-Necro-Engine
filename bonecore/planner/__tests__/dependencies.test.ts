import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateTasks } from '../src/planner.js';
import { CorruptionReport, Severity, Language } from '@necro/common';

describe('Property 5: Dependency task generation', () => {
  it('creates tasks for each dependency issue', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 8 }), { maxLength: 5 }),
        async (deps) => {
          const unique = Array.from(new Set(deps));
          const report: CorruptionReport = {
            repository: 'repo',
            scannedAt: new Date().toISOString(),
            issues: unique.map((d) => ({
              id: `dep:${d}`,
              title: `Dependency detected: ${d}`,
              severity: Severity.Low,
              language: Language.JavaScript,
            })),
          };

          const tasks = generateTasks(report);
          const dependencyTasks = tasks.filter((t) => t.type === 'dependency');
          expect(dependencyTasks.length).toBe(unique.length);
        }
      ),
      { numRuns: 25 }
    );
  });
});

