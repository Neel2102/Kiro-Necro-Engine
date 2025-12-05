import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { runScan, runPlan, runApply, runPr } from '../src/index.js';

const tmpRepo = () => {
  const dir = mkdtempSync(join(os.tmpdir(), 'revive-cli-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: 'demo', version: '1.0.0', dependencies: { lodash: '1.0.0' } }, null, 2)
  );
  writeFileSync(join(dir, 'app.js'), 'class App extends Component { render(){ return null; } }');
  return dir;
};

describe('Property 23: CLI scan output validity', () => {
  it('prints repository and issue summary', async () => {
    const repo = tmpRepo();
    const { output } = await runScan(repo);
    expect(output).toMatch(/Repository/);
    expect(output).toMatch(/Issues/);
  });
});

describe('Property 24: CLI error messaging', () => {
  it('shows clear message when repo missing', async () => {
    await expect(runScan('/path/that/does/not/exist')).rejects.toThrow(/not found/);
  });
});

describe('CLI workflow smoke tests', () => {
  it('plans, applies, and generates PR output', async () => {
    const repo = tmpRepo();
    const plan = await runPlan(repo);
    expect(plan.plan.tasks.length).toBeGreaterThan(0);

    const apply = await runApply(repo);
    expect(apply.result.modifiedFiles.length).toBeGreaterThanOrEqual(0);

    const pr = await runPr(repo);
    expect(pr.output).toMatch(/PR ready|Necromantic/i);
  });
});

