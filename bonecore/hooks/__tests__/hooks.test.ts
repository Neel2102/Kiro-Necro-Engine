import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import { executeHooks, loadAndExecuteStage, loadHooks } from '../src/hooks.js';

const tmpRepo = () => {
  const dir = join(os.tmpdir(), `hooks-${Date.now()}`);
  mkdirSync(join(dir, '.kiro', 'hooks'), { recursive: true });
  return dir;
};

describe('Property 20: Pre-scan hook execution', () => {
  it('loads and executes pre-scan hooks', async () => {
    const repo = tmpRepo();
    writeFileSync(
      join(repo, '.kiro', 'hooks', 'pre-scan.js'),
      `export default async (ctx) => { ctx.data = { scanned: true }; };`
    );

    const hooks = await loadHooks(repo);
    const result = await executeHooks(hooks, 'pre-scan', repo, {});
    expect(result.data.scanned).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Property 21: Post-scan hook execution', () => {
  it('runs post-scan and preserves context repoPath', async () => {
    const repo = tmpRepo();
    writeFileSync(
      join(repo, '.kiro', 'hooks', 'post-scan.js'),
      `export default async (ctx) => { return { repo: ctx.repoPath }; };`
    );

    const result = await loadAndExecuteStage(repo, 'post-scan');
    expect(result.data.repo).toBe(repo);
  });
});

describe('Property 22: Hook data modification', () => {
  it('applies returned data from multiple hooks in order', async () => {
    const repo = tmpRepo();
    writeFileSync(
      join(repo, '.kiro', 'hooks', 'pre-plan.js'),
      `export default async () => ({ first: 1 });`
    );
    writeFileSync(
      join(repo, '.kiro', 'hooks', 'post-plan.js'),
      `export default async (ctx) => ({ second: ctx.data.first + 1 });`
    );

    const hooks = await loadHooks(repo);
    const pre = await executeHooks(hooks, 'pre-plan', repo, {});
    const post = await executeHooks(hooks, 'post-plan', repo, pre.data);
    expect(pre.data.first).toBe(1);
    expect(post.data.second).toBe(2);
  });
});

