import apiClient from './api';
import type { ContributionPath, GuidanceRequest } from '../types';

export const guidanceService = {
  /**
   * Get personalized contribution guidance
   */
  getGuidance: async (
    userId: string,
    repositoryUrl: string
  ): Promise<ContributionPath> => {
    const response = await apiClient.post<ContributionPath>(
      '/guidance',
      { userId, repositoryUrl } as GuidanceRequest
    );
    return response.data;
  },
};
