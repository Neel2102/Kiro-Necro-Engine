import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import os from 'node:os';
import {
  applyTransformations,
  generateReadme,
  modernizePythonAsync,
  transformReactClassComponent,
} from '../src/transformer.js';
import { Language, Severity, TaskType } from '@necro/common';

const tmpDir = () => mkdtempSync(join(os.tmpdir(), 'transform-'));

describe('Property 9: Class to functional component transformation', () => {
  it('converts React class components into functional components with useEffect', () => {
    const source = `
import React, { Component } from 'react';

class Hero extends Component {
  componentDidMount() { this.props.onLoad(); }
  componentWillUnmount() { this.props.onCleanup(); }
  render() {
    return <section>{this.props.title}</section>;
  }
}
`;

    const result = transformReactClassComponent(source);
    expect(result.changed).toBe(true);
    expect(result.code).toContain('function Hero');
    expect(result.code).toContain('useEffect');
    expect(result.code).toContain('props.title');
    expect(result.code).toContain('return <section>');
  });
});

describe('Property 10: Python async modernization', () => {
  it('converts legacy coroutine syntax to async/await', () => {
    const source = `
@asyncio.coroutine
def fetch():
    yield from client.get("/status")
`;

    const result = modernizePythonAsync(source);
    expect(result.changed).toBe(true);
    expect(result.code).toContain('async def fetch');
    expect(result.code).toContain('await client.get');
  });
});

describe('Property 11: README generation completeness', () => {
  it('includes installation, usage, dependencies, and contributing sections', () => {
    const readme = generateReadme({
      name: 'Revive',
      description: 'Raise your repo from the dead.',
      dependencies: ['react', 'vitest'],
      commands: ['npm run scan', 'npm run plan'],
    });

    expect(readme).toMatch(/Installation/);
    expect(readme).toMatch(/Usage/);
    expect(readme).toMatch(/Dependencies/);
    expect(readme).toMatch(/Contributing/);
    expect(readme).toMatch(/react/);
    expect(readme).toMatch(/npm run scan/);
  });
});

describe('Property 12: File structure preservation', () => {
  it('modifies files in place without moving them', async () => {
    const dir = tmpDir();
    const appPath = join(dir, 'src', 'App.js');
    const plan = {
      repository: 'demo',
      generatedAt: new Date().toISOString(),
      tasks: [
        {
          id: 't1',
          type: TaskType.Refactor,
          title: 'Convert class',
          severity: Severity.Medium,
          confidence: 90,
          files: ['src/App.js'],
        },
      ],
    };

    await mkdir(join(dir, 'src'), { recursive: true });
    writeFileSync(
      appPath,
      `
import React, { Component } from 'react';
class App extends Component { render() { return <div>Hello</div>; } }
`
    );

    const result = await applyTransformations(dir, plan);
    expect(result.modifiedFiles).toContain('src/App.js');
    expect(statSync(appPath).isFile()).toBe(true);

    const contents = readFileSync(appPath, 'utf-8');
    expect(contents).toContain('function App');
  });
});

describe('Property 13: Spec-driven transformations', () => {
  it('skips disabled language rules and still transforms others', async () => {
    const dir = tmpDir();
    const jsPath = join(dir, 'Widget.js');
    const pyPath = join(dir, 'worker.py');

    await mkdir(dir, { recursive: true });
    writeFileSync(
      jsPath,
      `class Widget extends Component { render(){ return <div>JS</div>; } }`
    );
    writeFileSync(
      pyPath,
      `@asyncio.coroutine\ndef work():\n    yield from job()`
    );

    const plan = {
      repository: 'demo',
      generatedAt: new Date().toISOString(),
      tasks: [
        {
          id: 't-js',
          type: TaskType.Refactor,
          title: 'JS transform',
          severity: Severity.Low,
          confidence: 80,
          files: ['Widget.js'],
        },
        {
          id: 't-py',
          type: TaskType.Refactor,
          title: 'Py transform',
          severity: Severity.Low,
          confidence: 80,
          files: ['worker.py'],
        },
      ],
    };

    const spec = {
      version: '1.0',
      rules: [
        { name: 'js-transform', languages: [Language.JavaScript], enabled: false },
        { name: 'py-transform', languages: [Language.Python], enabled: true },
      ],
    };

    const result = await applyTransformations(dir, plan, spec);
    expect(result.modifiedFiles).not.toContain('Widget.js');
    expect(result.modifiedFiles).toContain('worker.py');

    const jsContents = readFileSync(jsPath, 'utf-8');
    const pyContents = readFileSync(pyPath, 'utf-8');
    expect(jsContents).toContain('class Widget');
    expect(pyContents).toContain('async def work');
  });
});

