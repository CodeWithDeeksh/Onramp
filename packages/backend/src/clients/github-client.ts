/**
 * GitHub API Client using Octokit
 * Handles all interactions with the GitHub REST API
 */

import { Octokit } from '@octokit/rest';
import type { IGitHubClient } from '../types/interfaces.js';
import type { FileNode, GitHubIssue, GitHubRepository } from '../types/models.js';
import { RepositoryError, ErrorCode } from '../types/errors.js';

export class GitHubClient implements IGitHubClient {
  private octokit: Octokit;
  private maxRetries: number;
  private retryDelay: number;

  constructor(token?: string, maxRetries = 3, retryDelay = 1000) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
      userAgent: 'Onramp/1.0.0',
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
          if (retryCount < this.maxRetries) {
            octokit.log.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          octokit.log.warn(`Secondary rate limit hit for ${options.method} ${options.url}`);
          return false;
        },
      },
    });
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Get repository information from GitHub
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.octokit.repos.get({ owner, repo });
      });

      return response.data as GitHubRepository;
    } catch (error: any) {
      if (error.status === 404) {
        throw new RepositoryError(
          ErrorCode.REPOSITORY_NOT_FOUND,
          `Repository ${owner}/${repo} not found`,
          { owner, repo }
        );
      }
      if (error.status === 403) {
        throw new RepositoryError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          'GitHub API rate limit exceeded',
          { owner, repo }
        );
      }
      throw new RepositoryError(
        ErrorCode.REPOSITORY_NOT_FOUND,
        `Failed to fetch repository: ${error.message}`,
        { owner, repo, error: error.message }
      );
    }
  }

  /**
   * Get file structure of a repository
   */
  async getFileStructure(owner: string, repo: string): Promise<FileNode[]> {
    try {
      const tree = await this.retryRequest(async () => {
        return await this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: 'HEAD',
          recursive: 'true',
        });
      });

      return this.buildFileTree(tree.data.tree);
    } catch (error: any) {
      if (error.status === 404) {
        throw new RepositoryError(
          ErrorCode.REPOSITORY_NOT_FOUND,
          `Repository ${owner}/${repo} not found`,
          { owner, repo }
        );
      }
      throw new RepositoryError(
        ErrorCode.REPOSITORY_NOT_FOUND,
        `Failed to fetch file structure: ${error.message}`,
        { owner, repo, error: error.message }
      );
    }
  }

  /**
   * Get README content from a repository
   */
  async getReadme(owner: string, repo: string): Promise<string> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.octokit.repos.getReadme({ owner, repo });
      });

      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      return content;
    } catch (error: any) {
      if (error.status === 404) {
        // README not found is not critical, return empty string
        return '';
      }
      throw new RepositoryError(
        ErrorCode.REPOSITORY_NOT_FOUND,
        `Failed to fetch README: ${error.message}`,
        { owner, repo, error: error.message }
      );
    }
  }

  /**
   * Get issues from a repository
   */
  async getIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<GitHubIssue[]> {
    try {
      const response = await this.retryRequest(async () => {
        return await this.octokit.issues.listForRepo({
          owner,
          repo,
          state,
          per_page: 100,
        });
      });

      return response.data.map((issue) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map((label) =>
          typeof label === 'string' ? label : label.name || ''
        ),
        createdAt: new Date(issue.created_at),
        updatedAt: new Date(issue.updated_at),
        comments: issue.comments,
        url: issue.html_url,
      }));
    } catch (error: any) {
      if (error.status === 404) {
        throw new RepositoryError(
          ErrorCode.REPOSITORY_NOT_FOUND,
          `Repository ${owner}/${repo} not found`,
          { owner, repo }
        );
      }
      throw new RepositoryError(
        ErrorCode.REPOSITORY_NOT_FOUND,
        `Failed to fetch issues: ${error.message}`,
        { owner, repo, error: error.message }
      );
    }
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest<T>(
    request: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await request();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.retryDelay);
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx errors
    return (
      error.status >= 500 ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND'
    );
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Build a hierarchical file tree from GitHub tree API response
   */
  private buildFileTree(items: any[]): FileNode[] {
    const root: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    // Sort items by path depth to ensure parents are created first
    const sortedItems = items.sort((a, b) => {
      const depthA = a.path.split('/').length;
      const depthB = b.path.split('/').length;
      return depthA - depthB;
    });

    for (const item of sortedItems) {
      const pathParts = item.path.split('/');
      const name = pathParts[pathParts.length - 1];
      const extension = name.includes('.') ? name.split('.').pop() : undefined;

      const node: FileNode = {
        path: item.path,
        name,
        type: item.type === 'tree' ? 'directory' : 'file',
        size: item.size,
        extension,
      };

      if (item.type === 'tree') {
        node.children = [];
      }

      pathMap.set(item.path, node);

      // Find parent and add to its children
      if (pathParts.length === 1) {
        root.push(node);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = pathMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    }

    return root;
  }
}
