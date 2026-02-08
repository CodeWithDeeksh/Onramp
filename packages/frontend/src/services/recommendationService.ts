import apiClient from './api';
import type {
  ProjectRecommendation,
  RecommendationRequest,
} from '../types';

export const recommendationService = {
  /**
   * Get project recommendations for a user
   */
  getRecommendations: async (
    userId: string,
    limit?: number
  ): Promise<ProjectRecommendation[]> => {
    const response = await apiClient.post<ProjectRecommendation[]>(
      '/recommendations',
      { userId, limit } as RecommendationRequest
    );
    return response.data;
  },
};
