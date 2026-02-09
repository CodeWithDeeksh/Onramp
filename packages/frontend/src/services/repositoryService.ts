import apiClient from './api';
import type {
  RepositoryAnalysis,
  AnalyzeRepositoryRequest,
} from '../types';

export const repositoryService = {
  /**
   * Analyze a GitHub repository
   */
  analyzeRepository: async (
    url: string
  ): Promise<RepositoryAnalysis> => {
    const response = await apiClient.post<RepositoryAnalysis>(
      '/repositories/analyze',
      { url } as AnalyzeRepositoryRequest
    );
    
    // Transform date strings to Date objects
    const data = response.data;
    return {
      ...data,
      analyzedAt: new Date(data.analyzedAt),
      metadata: {
        ...data.metadata,
        lastUpdated: new Date(data.metadata.lastUpdated),
      },
    };
  },

  /**
   * Get cached repository analysis
   */
  getRepositoryAnalysis: async (
    owner: string,
    repo: string
  ): Promise<RepositoryAnalysis> => {
    const response = await apiClient.get<RepositoryAnalysis>(
      `/repositories/${owner}/${repo}`
    );
    
    // Transform date strings to Date objects
    const data = response.data;
    return {
      ...data,
      analyzedAt: new Date(data.analyzedAt),
      metadata: {
        ...data.metadata,
        lastUpdated: new Date(data.metadata.lastUpdated),
      },
    };
  },
};
