import fs from 'node:fs/promises';
import { Logger, createLogger } from '@necro/common';
import { retryWithBackoff, RetryOptions } from './retry';

export interface FilesystemMcpOptions extends RetryOptions {
  logger?: Logger;
}

export class FilesystemMcpClient {
  private readonly logger: Logger;
  private readonly retries: number;
  private readonly baseDelayMs: number;

  constructor(options: FilesystemMcpOptions = {}) {
    this.logger = options.logger ?? createLogger('info');
    this.retries = options.retries ?? 2;
    this.baseDelayMs = options.baseDelayMs ?? 50;
  }

  async readFile(path: string): Promise<string> {
    return retryWithBackoff(
      () => fs.readFile(path, 'utf-8'),
      { retries: this.retries, baseDelayMs: this.baseDelayMs, logger: this.logger }
    );
  }

  async writeFile(path: string, contents: string): Promise<void> {
    return retryWithBackoff(
      () => fs.writeFile(path, contents, 'utf-8'),
      { retries: this.retries, baseDelayMs: this.baseDelayMs, logger: this.logger }
    );
  }

  async listDir(path: string): Promise<string[]> {
    return retryWithBackoff(
      async () => {
        const entries = await fs.readdir(path);
        return entries;
      },
      { retries: this.retries, baseDelayMs: this.baseDelayMs, logger: this.logger }
    );
  }
}

