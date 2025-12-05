import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanRepository } from '../src/scanner.js';
import { Severity } from '@necro/common';

const tempRepo = () => mkdtempSync(path.join(os.tmpdir(), 'scanner-report-'));

describe('Property 4: Report completeness', () => {
  it('summarizes issues by severity and total', async () => {
    const repo = tempRepo();
    writeFileSync(path.join(repo, 'package.json'), JSON.stringify({ dependencies: { a: '1.0.0' } }));
    writeFileSync(path.join(repo, 'test-results.txt'), 'FAIL');

    const report = await scanRepository(repo);
    expect(report.issues.length).toBeGreaterThanOrEqual(2);
    expect(report.summary?.total).toBe(report.issues.length);
    expect(report.summary?.bySeverity[Severity.Low]).toBeGreaterThanOrEqual(1);
    expect(report.summary?.bySeverity[Severity.High]).toBeGreaterThanOrEqual(1);

    rmSync(repo, { recursive: true, force: true });
  });
});

