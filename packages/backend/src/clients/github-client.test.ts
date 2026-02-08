/**
 * Unit tests for GitHub Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubClient } from './github-client.js';
import { ErrorCode } from '../types/errors.js';

// Mock Octokit
vi.mock('@octokit/rest', () => {
  return {
    Octokit: vi.fn().mockImplementation(() => ({
      repos: {
        get: vi.fn(),
        getReadme: vi.fn(),
      },
      git: {
        getTree: vi.fn(),
      },
      issues: {
        listForRepo: vi.fn(),
      },
      log: {
        warn: vi.fn(),
        info: vi.fn(),
      },
    })),
  };
});

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    client = new GitHubClient('test-token');
  });

  describe('getRepository', () => {
    it('should fetch repository data successfully', async () => {
      const mockRepo = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        owner: { login: 'owner' },
        html_url: 'https://github.com/owner/test-repo',
        description: 'Test repository',
        stargazers_count: 100,
        forks_count: 20,
        open_issues_count: 5,
        language: 'TypeScript',
        topics: ['test'],
        updated_at: '2024-01-01T00:00:00Z',
        license: { name: 'MIT' },
      };

      const mockOctokit = (client as any).octokit;
      mockOctokit.repos.get.mockResolvedValue({ data: mockRepo });

      const result = await client.getRepository('owner', 'test-repo');

      expect(result).toEqual(mockRepo);
      expect(mockOctokit.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
      });
    });

    it('should throw REPOSITORY_NOT_FOUND error for 404', async () => {
      const mockOctokit = (client as any).octokit;
      mockOctokit.repos.get.mockRejectedValue({ status: 404 });

      await expect(client.getRepository('owner', 'nonexistent')).rejects.toThrow();
      await expect(client.getRepository('owner', 'nonexistent')).rejects.toMatchObject({
        code: ErrorCode.REPOSITORY_NOT_FOUND,
      });
    });

    it('should throw RATE_LIMIT_EXCEEDED error for 403', async () => {
      const mockOctokit = (client as any).octokit;
      mockOctokit.repos.get.mockRejectedValue({ status: 403 });

      await expect(client.getRepository('owner', 'test-repo')).rejects.toMatchObject({
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
      });
    });
  });

  describe('getReadme', () => {
    it('should fetch and decode README content', async () => {
      const readmeContent = 'Test README content';
      const base64Content = Buffer.from(readmeContent).toString('base64');

      const mockOctokit = (client as any).octokit;
      mockOctokit.repos.getReadme.mockResolvedValue({
        data: { content: base64Content },
      });

      const result = await client.getReadme('owner', 'test-repo');

      expect(result).toBe(readmeContent);
    });

    it('should return empty string if README not found', async () => {
      const mockOctokit = (client as any).octokit;
      mockOctokit.repos.getReadme.mockRejectedValue({ status: 404 });

      const result = await client.getReadme('owner', 'test-repo');

      expect(result).toBe('');
    });
  });

  describe('getIssues', () => {
    it('should fetch and transform issues', async () => {
      const mockIssues = [
        {
          id: 1,
          number: 100,
          title: 'Test Issue',
          body: 'Issue description',
          state: 'open',
          labels: [{ name: 'bug' }, { name: 'help wanted' }],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          comments: 5,
          html_url: 'https://github.com/owner/repo/issues/100',
        },
      ];

      const mockOctokit = (client as any).octokit;
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues });

      const result = await client.getIssues('owner', 'test-repo', 'open');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        number: 100,
        title: 'Test Issue',
        state: 'open',
        labels: ['bug', 'help wanted'],
      });
    });
  });

  describe('retry logic', () => {
    it('should retry on retryable errors', async () => {
      const mockOctokit = (client as any).octokit;

      // Fail twice, then succeed
      mockOctokit.repos.get
        .mockRejectedValueOnce({ status: 500 })
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValueOnce({
          data: { id: 123, name: 'test-repo', owner: { login: 'owner' } },
        });

      const result = await client.getRepository('owner', 'test-repo');

      expect(result).toBeDefined();
      expect(mockOctokit.repos.get).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOctokit = (client as any).octokit;
      mockOctokit.repos.get.mockRejectedValue({ status: 404 });

      await expect(client.getRepository('owner', 'test-repo')).rejects.toThrow();
      expect(mockOctokit.repos.get).toHaveBeenCalledTimes(1);
    });
  });
});
