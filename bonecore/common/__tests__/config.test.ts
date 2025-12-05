import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadModernizationSpec } from '../src/config.js';

const createTempSpec = (contents: string) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'spec-'));
  const file = path.join(dir, 'modernization-spec.yaml');
  writeFileSync(file, contents);
  return { dir, file };
};

describe('config loader', () => {
  it('loads and validates a modernization spec', async () => {
    const { dir, file } = createTempSpec(
      `
version: "1.0"
rules:
  - name: test-rule
`
    );

    const { spec, dispose } = await loadModernizationSpec(file);
    expect(spec.version).toBe('1.0');
    expect(spec.rules[0].name).toBe('test-rule');
    dispose();
    rmSync(dir, { recursive: true, force: true });
  });

  it('invokes onChange when spec changes in watch mode', async () => {
    const { dir, file } = createTempSpec(
      `
version: "1.0"
rules:
  - name: first
`
    );

    const onChange = vi.fn();
    const { dispose } = await loadModernizationSpec(file, {
      watch: true,
      onChange,
    });

    writeFileSync(
      file,
      `
version: "1.1"
rules:
  - name: second
`
    );

    // give fs.watch a moment to fire
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(onChange).toHaveBeenCalledTimes(1);

    dispose();
    rmSync(dir, { recursive: true, force: true });
  });
});

