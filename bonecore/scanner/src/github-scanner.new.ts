import { Octokit } from '@octokit/rest';
import { Repository, RepositoryContent, GitHubIssue, RateLimit } from '@necro/common';

// Type guard to check if an object has a specific property
const hasProperty = <T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> => {
  return key in obj;
};

export class GitHubScanner {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
      userAgent: 'KiroNecroEngine/1.0.0'
    });
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      
      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description || '',
        url: data.html_url,
        language: data.language || '',
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        license: data.license?.name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        defaultBranch: data.default_branch,
        private: data.private,
        archived: data.archived,
        disabled: data.disabled
      };
    } catch (error) {
      console.error(`Error fetching repository ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get repository contents at a specific path
   */
  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<RepositoryContent[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
        ref
      });

      const mapContentData = (item: any): RepositoryContent => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size || 0,
        url: item.html_url,
        downloadUrl: item.download_url || null,
        gitUrl: item.git_url,
        sha: item.sha
      });

      if (Array.isArray(data)) {
        return data.map(mapContentData);
      }

      return [mapContentData(data)];
    } catch (error) {
      console.error(`Error fetching contents for ${owner}/${repo}/${path}:`, error);
      throw error;
    }
  }

  /**
   * Get repository issues and pull requests
   */
  async getRepositoryIssues(
    owner: string, 
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      labels?: string[];
      since?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<GitHubIssue[]> {
    try {
      const { 
        state = 'all',
        labels = [],
        since,
        sort = 'created',
        direction = 'desc',
        perPage = 100,
        page = 1
      } = options;

      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state,
        labels: labels.length > 0 ? labels.join(',') : undefined,
        since,
        sort,
        direction,
        per_page: perPage,
        page,
        headers: {
          'If-None-Match': ''
        }
      });

      return data.map(issue => {
        const mappedLabels = issue.labels.map(label => {
          if (typeof label === 'string') {
            return label;
          }
          if (hasProperty(label, 'name') && typeof label.name === 'string') {
            return label.name;
          }
          return '';
        }).filter(Boolean) as string[];

        const issueData: GitHubIssue = {
          id: issue.id.toString(),
          number: issue.number,
          title: issue.title,
          body: issue.body || null,
          state: issue.state as 'open' | 'closed',
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          closedAt: issue.closed_at,
          url: issue.url,
          htmlUrl: issue.html_url,
          labels: mappedLabels,
          user: {
            login: issue.user?.login || '',
            id: issue.user?.id || 0,
            avatarUrl: issue.user?.avatar_url || '',
            htmlUrl: issue.user?.html_url || ''
          }
        };

        if (issue.pull_request) {
          issueData.pullRequest = {
            url: issue.pull_request.url || '',
            htmlUrl: issue.pull_request.html_url || '',
            diffUrl: issue.pull_request.diff_url || '',
            patchUrl: issue.pull_request.patch_url || ''
          };
        }

        return issueData;
      });
    } catch (error) {
      console.error(`Error fetching issues for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(): Promise<RateLimit> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
        used: data.rate.used,
        resource: 'core'
      };
    } catch (error) {
      console.error('Error fetching rate limit:', error);
      throw error;
    }
  }

  /**
   * Search repositories
   */
  async searchRepositories(
    query: string,
    options: {
      sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated';
      order?: 'asc' | 'desc';
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<{
    totalCount: number;
    incompleteResults: boolean;
    items: Array<Omit<Repository, 'archived' | 'disabled' | 'private'>>;
  }> {
    const { 
      sort = 'stars',
      order = 'desc',
      perPage = 30,
      page = 1
    } = options;

    try {
      const { data } = await this.octokit.search.repos({
        q: query,
        sort,
        order,
        per_page: perPage,
        page,
        headers: {
          'If-None-Match': ''
        }
      });

      return {
        totalCount: data.total_count,
        incompleteResults: data.incomplete_results,
        items: data.items.map(repo => ({
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          url: repo.html_url,
          language: repo.language || '',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          license: repo.license?.name,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          defaultBranch: repo.default_branch
        }))
      };
    } catch (error) {
      console.error('Error searching repositories:', error);
      throw error;
    }
  }

  /**
   * Check if repository exists and is accessible
   */
  async repositoryExists(owner: string, repo: string): Promise<boolean> {
    try {
      await this.octokit.repos.get({ owner, repo });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }
}

export default GitHubScanner;
