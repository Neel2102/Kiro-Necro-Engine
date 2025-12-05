import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scanDeprecatedApis } from '../src/scanner.js';

const tempRepo = () => mkdtempSync(path.join(os.tmpdir(), 'scanner-apis-'));

describe('Property 2: Multi-language API detection', () => {
  it('detects deprecated React and Python async patterns', async () => {
    const repo = tempRepo();
    writeFileSync(path.join(repo, 'legacy.tsx'), 'const x = React.createClass({}); componentWillMount();');
    writeFileSync(path.join(repo, 'async.py'), 'import asyncio\nasyncio.get_event_loop()\nyield from []');

    const issues = await scanDeprecatedApis(repo);
    expect(issues.some((i) => i.title.includes('React.createClass'))).toBe(true);
    expect(issues.some((i) => i.title.includes('componentWillMount'))).toBe(true);
    expect(issues.some((i) => i.title.includes('asyncio.get_event_loop'))).toBe(true);
    expect(issues.some((i) => i.title.includes('yield from'))).toBe(true);

    rmSync(repo, { recursive: true, force: true });
  });
});

