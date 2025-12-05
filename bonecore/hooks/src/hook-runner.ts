// bonecore/hooks/src/hook-runner.ts
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { HookContext } from '@necro/common';

type KiroHook = (context: HookContext) => Promise<Record<string, unknown> | void>;

export class HookRunner {
  private hooks: Map<string, KiroHook> = new Map();

  async loadHooks(hooksDir: string): Promise<void> {
    try {
      const hookFiles = await readdir(hooksDir);
      for (const file of hookFiles) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          const hookPath = path.join(hooksDir, file);
          try {
            // In a real implementation, we'd use a proper module loader
            const hookModule = await import(hookPath);
            const hook = hookModule.default || hookModule;
            if (typeof hook === 'function') {
              const hookName = path.basename(file, path.extname(file));
              this.hooks.set(hookName, hook);
            }
          } catch (error) {
            console.error(`Failed to load hook ${file}:`, error);
          }
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error loading hooks:', error);
      }
    }
  }

  async runHook(
    hookName: string,
    context: HookContext
  ): Promise<HookContext> {
    const hook = this.hooks.get(hookName);
    if (!hook) {
      return context;
    }

    try {
      const result = await hook(context);
      if (result && typeof result === 'object') {
        return { ...context, data: { ...context.data, ...result } };
      }
      return context;
    } catch (error) {
      console.error(`Error running hook ${hookName}:`, error);
      return context;
    }
  }

  async runHookPipeline(
    hookNames: string[],
    initialContext: HookContext
  ): Promise<HookContext> {
    let context = { ...initialContext };
    for (const hookName of hookNames) {
      context = await this.runHook(hookName, context);
    }
    return context;
  }
}