import apiClient from './api';
import type { UserProfile, CreateProfileResponse } from '../types';

export const userService = {
  /**
   * Create or update user profile
   */
  saveProfile: async (profile: UserProfile): Promise<CreateProfileResponse> => {
    const response = await apiClient.post<CreateProfileResponse>(
      '/users/profile',
      profile
    );
    return response.data;
  },

  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(
      `/users/${userId}/profile`
    );
    return response.data;
  },
};
