import { describe, it, expect } from 'vitest';
import {
  createReportBundle,
  generateDiffs,
  generateRoadmap,
  formatPrDescription,
} from '../src/reporter.js';
import { Severity, TaskType } from '@necro/common';

const samplePlan = {
  repository: 'demo',
  generatedAt: '2024-01-01T00:00:00Z',
  tasks: [
    {
      id: 'dep-1',
      type: TaskType.Dependency,
      title: 'Upgrade lodash',
      severity: Severity.Low,
      confidence: 80,
      files: ['package.json'],
    },
    {
      id: 'api-1',
      type: TaskType.ApiReplacement,
      title: 'Replace legacy API',
      severity: Severity.Medium,
      confidence: 70,
      files: ['src/api.js'],
    },
  ],
};

const sampleTransform = {
  repository: 'demo',
  appliedAt: '2024-01-01T01:00:00Z',
  modifiedFiles: ['package.json', 'src/api.js'],
};

describe('Property 15: Roadmap generation', () => {
  it('includes sections per task type and modified files', () => {
    const roadmap = generateRoadmap(samplePlan, sampleTransform);
    expect(roadmap).toMatch(/Roadmap/);
    expect(roadmap).toMatch(/Dependencies/);
    expect(roadmap).toMatch(/APIs/);
    expect(roadmap).toMatch(/package\.json/);
    expect(roadmap).toMatch(/src\/api\.js/);
  });
});

describe('Property 14: Diff completeness', () => {
  it('counts additions and deletions per file', () => {
    const diffs = generateDiffs([
      { filePath: 'file.txt', before: 'old\nline', after: 'new\nline' },
    ]);
    expect(diffs[0].additions).toBeGreaterThan(0);
    expect(diffs[0].deletions).toBeGreaterThan(0);
    expect(diffs[0].diff).toContain('--- a/file.txt');
    expect(diffs[0].diff).toContain('+++ b/file.txt');
  });
});

describe('Property 16: PR description formatting', () => {
  it('includes necromantic theme and file list', () => {
    const pr = formatPrDescription(samplePlan, sampleTransform, [
      { filePath: 'file.txt', diff: '', additions: 2, deletions: 1 },
    ]);
    expect(pr).toMatch(/Necromantic/);
    expect(pr).toMatch(/Files stirred/);
    expect(pr).toMatch(/package\.json/);
  });
});

describe('Property 15: Roadmap generation completeness (bundle)', () => {
  it('orchestrates roadmap, PR, and diffs together', () => {
    const bundle = createReportBundle(samplePlan, sampleTransform, [
      { filePath: 'file.txt', before: 'a', after: 'b' },
    ]);

    expect(bundle.roadmap).toMatch(/Roadmap/);
    expect(bundle.prDescription).toMatch(/Necromantic/);
    expect(bundle.diffs.length).toBe(1);
    expect(bundle.summary.totalAdditions).toBeGreaterThan(0);
  });
});

