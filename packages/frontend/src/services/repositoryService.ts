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
    return response.data;
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
    return response.data;
  },
};
