import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanStructuralIssues } from '../src/scanner.js';

const tempRepo = () => mkdtempSync(path.join(os.tmpdir(), 'scanner-struct-'));

describe('Property 3: Structural issue detection', () => {
  it('flags missing README, failing tests, and obsolete config', async () => {
    const repo = tempRepo();
    writeFileSync(path.join(repo, 'test-results.txt'), 'FAIL: sample test');
    writeFileSync(path.join(repo, 'obsolete.config'), 'legacy=true');

    const issues = await scanStructuralIssues(repo);

    expect(issues.some((i) => i.id === 'structure:missing-readme')).toBe(true);
    expect(issues.some((i) => i.id === 'structure:failing-tests')).toBe(true);
    expect(issues.some((i) => i.id === 'structure:obsolete-config')).toBe(true);

    rmSync(repo, { recursive: true, force: true });
  });
});

