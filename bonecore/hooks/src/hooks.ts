import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HookContext } from '@necro/common';

const hookStages: HookContext['stage'][] = [
  'pre-scan',
  'post-scan',
  'pre-plan',
  'post-plan',
  'pre-transform',
  'post-transform',
  'pre-report',
  'post-report',
];

export type HookHandler = (ctx: HookContext) => Promise<Record<string, unknown> | void>;

export interface LoadedHook {
  stage: HookContext['stage'];
  handler: HookHandler;
  filePath: string;
}

export interface HookExecutionResult {
  data: Record<string, unknown>;
  errors: string[];
}

const hookFileNameForStage = (stage: HookContext['stage']): string =>
  `${stage}.js`.replace(/\//g, '');

export const loadHooks = async (repoPath: string): Promise<LoadedHook[]> => {
  const hooksDir = path.join(repoPath, '.kiro', 'hooks');
  const loaded: LoadedHook[] = [];

  try {
    await access(hooksDir);
  } catch {
    return loaded;
  }

  const files = await readdir(hooksDir);

  for (const stage of hookStages) {
    const expected = hookFileNameForStage(stage);
    if (!files.includes(expected)) continue;
    const filePath = path.join(hooksDir, expected);
    const mod = await import(pathToFileURL(filePath).href);
    const handler: HookHandler | undefined = mod.default;
    if (typeof handler === 'function') {
      loaded.push({ stage, handler, filePath });
    }
  }

  return loaded;
};

export const executeHooks = async (
  hooks: LoadedHook[],
  stage: HookContext['stage'],
  repoPath: string,
  data: Record<string, unknown> = {}
): Promise<HookExecutionResult> => {
  const errors: string[] = [];
  const ctx: HookContext = { repoPath, stage, data };
  const stageHooks = hooks.filter((h) => h.stage === stage);

  for (const hook of stageHooks) {
    try {
      const result = await hook.handler(ctx);
      if (result && typeof result === 'object') {
        ctx.data = { ...ctx.data, ...result };
      }
    } catch (error) {
      errors.push(
        `Hook ${hook.filePath} failed: ${(error as Error).message ?? 'unknown error'}`
      );
    }
  }

  return { data: ctx.data ?? {}, errors };
};

export const loadAndExecuteStage = async (
  repoPath: string,
  stage: HookContext['stage'],
  data?: Record<string, unknown>
): Promise<HookExecutionResult> => {
  const hooks = await loadHooks(repoPath);
  return executeHooks(hooks, stage, repoPath, data);
};

