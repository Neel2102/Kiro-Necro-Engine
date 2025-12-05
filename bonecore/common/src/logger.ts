import { LogLevel } from './types.js';

const levelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

export class Logger {
  constructor(private level: LogLevel = 'info') {}

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel) {
    return levelPriority[level] <= levelPriority[this.level];
  }

  error(message: string, meta?: unknown) {
    if (this.shouldLog('error')) {
      console.error(`[error] ${message}`, meta ?? '');
    }
  }

  warn(message: string, meta?: unknown) {
    if (this.shouldLog('warn')) {
      console.warn(`[warn] ${message}`, meta ?? '');
    }
  }

  info(message: string, meta?: unknown) {
    if (this.shouldLog('info')) {
      console.info(`[info] ${message}`, meta ?? '');
    }
  }

  debug(message: string, meta?: unknown) {
    if (this.shouldLog('debug')) {
      console.debug(`[debug] ${message}`, meta ?? '');
    }
  }
}

export const createLogger = (level: LogLevel = 'info') => new Logger(level);

