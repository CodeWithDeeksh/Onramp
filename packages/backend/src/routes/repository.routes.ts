/**
 * Repository Routes
 * Handles repository analysis endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { RepositoryService } from '../services/repository-service.js';
import { GitHubClient } from '../clients/github-client.js';
import { LLMClient } from '../clients/llm-client.js';
import { CacheStore } from '../clients/cache-store.js';
import { z } from 'zod';
import { ValidationError } from '../types/errors.js';

const analyzeRequestSchema = z.object({
  url: z.string().url().regex(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/),
});

export function createRepositoryRouter(): Router {
  const router = Router();

  // Initialize services (in production, use dependency injection)
  const githubClient = new GitHubClient(process.env.GITHUB_TOKEN);
  const llmClient = new LLMClient({
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
  });
  const cacheStore = new CacheStore({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });
  const repositoryService = new RepositoryService(githubClient, llmClient, cacheStore);

  /**
   * POST /api/repositories/analyze
   * Analyzes a GitHub repository and returns comprehensive overview
   */
  router.post(
    '/analyze',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Validate request body
        const result = analyzeRequestSchema.safeParse(req.body);
        if (!result.success) {
          throw new ValidationError('Invalid request body', {
            errors: result.error.errors,
          });
        }

        const { url } = result.data;

        // Analyze repository
        const analysis = await repositoryService.analyzeRepository(url);

        res.status(200).json(analysis);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/repositories/:owner/:repo
   * Retrieves cached repository analysis
   */
  router.get(
    '/:owner/:repo',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { owner, repo } = req.params;

        // Get cached analysis
        const analysis = await repositoryService.getCachedAnalysis(owner, repo);

        if (!analysis) {
          res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Repository analysis not found in cache',
              timestamp: new Date(),
            },
          });
          return;
        }

        res.status(200).json(analysis);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
