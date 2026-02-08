/**
 * Recommendation Routes
 * Handles project recommendation endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MatchmakingService } from '../services/matchmaking-service.js';
import { LLMClient } from '../clients/llm-client.js';
import { prisma } from '../utils/prisma.js';
import { z } from 'zod';
import { ValidationError } from '../types/errors.js';

const recommendationRequestSchema = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().positive().max(50).optional().default(10),
});

export function createRecommendationRouter(): Router {
  const router = Router();

  // Initialize services
  const llmClient = new LLMClient({
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
    apiKey: process.env.LLM_API_KEY || '',
  });
  const matchmakingService = new MatchmakingService(llmClient, prisma);

  /**
   * POST /api/recommendations
   * Generates project recommendations for a user
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Validate request body
        const result = recommendationRequestSchema.safeParse(req.body);
        if (!result.success) {
          throw new ValidationError('Invalid recommendation request', {
            errors: result.error.errors,
          });
        }

        const { userId, limit } = result.data;

        // Generate recommendations
        const recommendations = await matchmakingService.generateRecommendations(
          userId,
          limit
        );

        res.status(200).json(recommendations);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
