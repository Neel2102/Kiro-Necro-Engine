import { Logger, createLogger } from '@necro/common';
import { retryWithBackoff, RetryOptions } from './retry';

export interface GitHubRequest {
  path: string;
  init?: RequestInit;
}

export interface GitHubMcpOptions extends RetryOptions {
  token?: string;
  baseUrl?: string;
}

export class GitHubMcpClient {
  private readonly token?: string;
  private readonly baseUrl: string;
  private readonly logger: Logger;
  private readonly retries: number;
  private readonly baseDelayMs: number;

  constructor(options: GitHubMcpOptions = {}) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? 'https://api.github.com';
    this.logger = options.logger ?? createLogger('info');
    this.retries = options.retries ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 200;
  }

  async request<T = unknown>({ path, init }: GitHubRequest): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      ...(init?.headers as Record<string, string> ?? {})
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return retryWithBackoff(
      async () => {
        const res = await fetch(url, { ...init, headers });
        if (!res.ok) {
          const message = await res.text();
          throw new Error(`GitHub request failed: ${res.status} ${message}`);
        }
        return (await res.json()) as T;
      },
      {
        retries: this.retries,
        baseDelayMs: this.baseDelayMs,
        logger: this.logger,
      }
    );
  }

  async getRepository(owner: string, repo: string) {
    return this.request<{ full_name: string; default_branch: string }>({
      path: `/repos/${owner}/${repo}`,
    });
  }

  async listPullRequests(owner: string, repo: string) {
    return this.request<Array<{ number: number; title: string }>>({
      path: `/repos/${owner}/${repo}/pulls`,
    });
  }

  async createPullRequest(
    owner: string,
    repo: string,
    options: {
      title: string;
      head: string;
      base?: string;
      body?: string;
      draft?: boolean;
    }
  ) {
    return this.request<{
      number: number;
      html_url: string;
      title: string;
      state: string;
    }>({
      path: `/repos/${owner}/${repo}/pulls`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: options.title,
          head: options.head,
          base: options.base || 'main',
          body: options.body || '',
          draft: options.draft || false,
        }),
      },
    });
  }

  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromRef: string = 'main'
  ) {
    // Get the SHA of the reference branch
    const ref = await this.request<{ object: { sha: string } }>({
      path: `/repos/${owner}/${repo}/git/ref/heads/${fromRef}`,
    });

    // Create new branch
    return this.request<{ ref: string; object: { sha: string } }>({
      path: `/repos/${owner}/${repo}/git/refs`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: ref.object.sha,
        }),
      },
    });
  }

  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string,
    sha?: string
  ) {
    const body: any = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    return this.request<{ content: { sha: string; html_url: string } }>({
      path: `/repos/${owner}/${repo}/contents/${path}`,
      init: {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    });
  }

  async getFileContent(owner: string, repo: string, path: string, ref?: string) {
    const queryParams = ref ? `?ref=${ref}` : '';
    return this.request<{ content: string; sha: string; encoding: string }>({
      path: `/repos/${owner}/${repo}/contents/${path}${queryParams}`,
    });
  }
}

