import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanDependencies } from '../src/scanner.js';

const tempRepo = () => mkdtempSync(path.join(os.tmpdir(), 'scanner-deps-'));

describe('Property 1: Complete dependency detection', () => {
  it('detects all deps in package.json and requirements.txt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.stringOf(fc.constantFrom('a', 'b', 'c', 'd'), { minLength: 1, maxLength: 6 }), { maxLength: 3 }),
        fc.array(fc.stringOf(fc.constantFrom('x', 'y', 'z'), { minLength: 1, maxLength: 5 }), { maxLength: 3 }),
        async (nodeDeps, pyDeps) => {
          const repo = tempRepo();
          const uniqueNode = Array.from(new Set(nodeDeps));
          const uniquePy = Array.from(new Set(pyDeps));

          if (uniqueNode.length) {
            writeFileSync(
              path.join(repo, 'package.json'),
              JSON.stringify({
                dependencies: Object.fromEntries(uniqueNode.map((n) => [n, '1.0.0'])),
              })
            );
          }

          if (uniquePy.length) {
            writeFileSync(
              path.join(repo, 'requirements.txt'),
              uniquePy.map((n) => `${n}==1.0.0`).join('\n')
            );
          }

          const issues = await scanDependencies(repo);
          const expectedCount = uniqueNode.length + uniquePy.length;
          expect(issues.length).toBeGreaterThanOrEqual(expectedCount);

          rmSync(repo, { recursive: true, force: true });
        }
      ),
      { numRuns: 25 }
    );
  });
});

