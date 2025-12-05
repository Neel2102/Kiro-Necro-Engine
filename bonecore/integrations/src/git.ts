import simpleGit, { SimpleGit } from 'simple-git';
import { Logger, createLogger } from '@necro/common';

export interface GitOptions {
  repoPath: string;
  logger?: Logger;
}

export class GitClient {
  private readonly git: SimpleGit;
  private readonly logger: Logger;

  constructor(options: GitOptions) {
    this.git = simpleGit(options.repoPath);
    this.logger = options.logger ?? createLogger('info');
  }

  async createBranch(name: string) {
    await this.git.checkoutLocalBranch(name);
    this.logger.info(`Created branch ${name}`);
  }

  async stageAll() {
    await this.git.add('.');
    this.logger.debug('Staged all changes');
  }

  async commit(message: string) {
    await this.git.commit(message);
    this.logger.info(`Committed changes: ${message}`);
  }

  async diff(): Promise<string> {
    return this.git.diff();
  }

  async push(branch: string, remote = 'origin') {
    await this.git.push(remote, branch);
    this.logger.info(`Pushed branch ${branch} to ${remote}`);
  }

  async getTopAuthor(): Promise<{ name: string; email: string } | null> {
    try {
      const log: any = await (this.git as any).log();
      if (!log?.all?.length) return null;

      const counts = new Map<string, { name: string; email: string; count: number }>();
      for (const entry of log.all as Array<{ author_name?: string; author_email?: string }>) {
        const name = entry.author_name || 'unknown';
        const email = entry.author_email || '';
        const key = `${name} <${email}>`;
        const prev = counts.get(key) ?? { name, email, count: 0 };
        prev.count += 1;
        counts.set(key, prev);
      }

      let top: { name: string; email: string; count: number } | null = null;
      for (const v of counts.values()) {
        if (!top || v.count > top.count) top = v;
      }
      if (!top) return null;
      return { name: top.name, email: top.email };
    } catch {
      return null;
    }
  }
}

