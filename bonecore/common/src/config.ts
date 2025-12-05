import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { ModernizationSpec, LogLevel, CommonConfig, KiroModernizationConfig } from './types';
import { ConfigError, ValidationError } from './errors';
import { Logger, createLogger } from './logger';

export interface LoadSpecOptions {
  watch?: boolean;
  onChange?: (spec: ModernizationSpec) => void;
  logger?: Logger;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const validateSpec = (spec: unknown): ModernizationSpec => {
  if (!spec || typeof spec !== 'object') {
    throw new ValidationError('Spec must be an object');
  }
  const typed = spec as ModernizationSpec;
  if (!isNonEmptyString(typed.version)) {
    throw new ValidationError('Spec version is required');
  }
  if (!Array.isArray(typed.rules)) {
    throw new ValidationError('Spec rules must be an array');
  }
  typed.rules.forEach((rule, idx) => {
    if (!isNonEmptyString(rule.name)) {
      throw new ValidationError(`Rule at index ${idx} is missing a name`);
    }
  });
  return typed;
};

export const loadModernizationSpec = async (
  specPath: string,
  options: LoadSpecOptions = {}
): Promise<{ spec: ModernizationSpec; dispose: () => void }> => {
  const logger = options.logger ?? createLogger();
  const resolvedPath = path.resolve(specPath);

  const load = async (): Promise<ModernizationSpec> => {
    try {
      const raw = await readFile(resolvedPath, 'utf-8');
      const parsed = YAML.parse(raw);
      const validated = validateSpec(parsed);
      logger.debug('Loaded modernization spec', { path: resolvedPath });
      return validated;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ConfigError(
        `Failed to load modernization spec at ${resolvedPath}: ${
          (error as Error).message
        }`
      );
    }
  };

  let currentSpec = await load();
  let watcher: fs.FSWatcher | undefined;

  let debounceTimer: NodeJS.Timeout | undefined;

  if (options.watch) {
    watcher = fs.watch(resolvedPath, (eventType) => {
      if (eventType !== 'change') return;

      // Coalesce rapid successive change events (common on Windows) to avoid
      // invoking onChange more than once per write.
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          currentSpec = await load();
          options.onChange?.(currentSpec);
        } catch (error) {
          logger.warn('Failed to reload spec after change', error);
        }
      }, 25);
    });
  }

  const dispose = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
    watcher?.close();
  };

  return { spec: currentSpec, dispose };
};

export const createCommonConfig = (override?: Partial<CommonConfig>): CommonConfig => {
  const logLevel = (override?.logLevel ??
    (process.env.LOG_LEVEL as LogLevel | undefined) ??
    'info') as LogLevel;
  const specPath =
    override?.specPath ??
    process.env.MODERNIZATION_SPEC_PATH ??
    path.resolve(process.cwd(), 'modernization-spec.yaml');

  return { logLevel, specPath };
};

export const loadKiroConfigSync = (
  specPath: string = path.resolve(process.cwd(), '.kiro', 'specs', 'modernization-spec.yaml')
): KiroModernizationConfig | null => {
  try {
    const raw = fs.readFileSync(specPath, 'utf-8');
    const parsed = YAML.parse(raw) as any;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const rules = (parsed as any).rules ?? {};
    const cfg: KiroModernizationConfig = {
      dependencyUpgrades: rules['dependency-upgrades'] ?? undefined,
      javascript: rules.javascript ?? undefined,
      python: rules.python ?? undefined,
      documentation: rules.documentation ?? undefined,
    };
    return cfg;
  } catch {
    // If the file is missing or malformed, fall back to default behavior
    return null;
  }
};

