/**
 * User Profile Routes
 * Handles user profile management endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MatchmakingService } from '../services/matchmaking-service.js';
import { LLMClient } from '../clients/llm-client.js';
import { prisma } from '../utils/prisma.js';
import { userProfileSchema } from '../validation/schemas.js';
import { ValidationError } from '../types/errors.js';
import { randomUUID } from 'crypto';

export function createUserRouter(): Router {
  const router = Router();

  // Initialize services
  const llmClient = new LLMClient({
    provider: (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
    apiKey: process.env.LLM_API_KEY || '',
  });
  const matchmakingService = new MatchmakingService(llmClient, prisma);

  /**
   * POST /api/users/profile
   * Creates or updates a user profile
   */
  router.post(
    '/profile',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Validate request body
        const result = userProfileSchema.safeParse(req.body);
        if (!result.success) {
          throw new ValidationError('Invalid user profile data', {
            errors: result.error.errors,
          });
        }

        const profile = result.data;

        // Generate userId if not provided
        const userId = profile.userId || randomUUID();

        // Save profile
        await matchmakingService.saveUserProfile(userId, {
          ...profile,
          userId,
        });

        res.status(201).json({
          id: userId,
          profile: {
            ...profile,
            userId,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/users/:userId/profile
   * Retrieves a user profile
   */
  router.get(
    '/:userId/profile',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { userId } = req.params;

        // Get profile
        const profile = await matchmakingService.getUserProfile(userId);

        if (!profile) {
          res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'User profile not found',
              timestamp: new Date(),
            },
          });
          return;
        }

        res.status(200).json(profile);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
