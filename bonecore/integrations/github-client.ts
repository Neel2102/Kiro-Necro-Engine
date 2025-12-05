// bonecore/integrations/github-client.ts
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { Issue } from '../common/types';

export class GitHubClient {
  private octokit: Octokit;
  
  constructor(authToken?: string) {
    this.octokit = new Octokit({
      auth: authToken || process.env.GITHUB_TOKEN,
      userAgent: 'KiroNecroEngine/1.0.0'
    });
  }

  async getRepository(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return data;
    } catch (error) {
      console.error('Error fetching repository:', error);
      throw error;
    }
  }

  async createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base?: string;
    body?: string;
  }) {
    try {
      const { data } = await this.octokit.pulls.create(params);
      return data;
    } catch (error) {
      console.error('Error creating PR:', error);
      throw error;
    }
  }

  async createIssue(owner: string, repo: string, issue: Omit<Issue, 'id'>) {
    try {
      const { data } = await this.octokit.issues.create({
        owner,
        repo,
        title: issue.title,
        body: issue.description,
        labels: [issue.type, `severity:${issue.severity}`]
      });
      return data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }
}