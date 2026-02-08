/**
 * Issue Routes
 * Handles issue classification endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IssueAnalyzerService } from '../services/issue-analyzer-service.js';
import { RepositoryService } from '../services/repository-service.js';
import { GitHubClient } from '../clients/github-client.js';
import { LLMClient } from '../clients/llm-client.js';
import { CacheStore } from '../clients/cache-store.js';
import { z } from 'zod';
import { ValidationError } from '../types/errors.js';

const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']).optional();

export function createIssueRouter(): Router {
  const router = Router();

  // Initialize services
  const githubClient = new GitHubClient(process.env.GITHUB_TOKEN);
  const llmClient = new LLMClient({
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
    apiKey: process.env.LLM_API_KEY || '',
  });
  const cacheStore = new CacheStore({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });

  const repositoryService = new RepositoryService(githubClient, llmClient, cacheStore);
  const issueAnalyzerService = new IssueAnalyzerService(
    githubClient,
    llmClient,
    repositoryService
  );

  /**
   * GET /api/issues/:owner/:repo
   * Fetches and classifies repository issues
   * Query params: difficulty (optional) - filter by difficulty level
   */
  router.get(
    '/:owner/:repo',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { owner, repo } = req.params;
        const { difficulty } = req.query;

        // Validate difficulty parameter
        const difficultyResult = difficultySchema.safeParse(difficulty);
        if (difficulty && !difficultyResult.success) {
          throw new ValidationError('Invalid difficulty parameter', {
            errors: difficultyResult.error.errors,
          });
        }

        // Fetch and classify issues
        let issues = await issueAnalyzerService.fetchAndClassifyIssues(owner, repo);

        // Filter by difficulty if specified
        if (difficultyResult.success && difficultyResult.data) {
          issues = issueAnalyzerService.filterIssuesByDifficulty(
            issues,
            difficultyResult.data
          );
        }

        res.status(200).json(issues);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
