import apiClient from './api';
import type { ClassifiedIssue, Difficulty } from '../types';

export const issueService = {
  /**
   * Get classified issues for a repository
   */
  getIssues: async (
    owner: string,
    repo: string,
    difficulty?: Difficulty
  ): Promise<ClassifiedIssue[]> => {
    const params = difficulty ? { difficulty } : {};
    const response = await apiClient.get<ClassifiedIssue[]>(
      `/issues/${owner}/${repo}`,
      { params }
    );
    return response.data;
  },
};
