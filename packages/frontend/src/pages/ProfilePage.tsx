import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context';
import { userService } from '../services';
import { UserProfileForm } from '../components/profile';
import type { UserProfile } from '../types';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, setUserProfile, isLoading, setIsLoading, error, setError } = useUser();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (
    profileData: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Generate a temporary userId if none exists
      const userId = userProfile?.userId || `user-${Date.now()}`;
      
      const fullProfile: UserProfile = {
        ...profileData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await userService.saveProfile(fullProfile);
      
      // Update context with the saved profile
      setUserProfile({
        ...fullProfile,
        userId: response.id,
      });

      setSuccessMessage('Profile saved successfully!');
      
      // Redirect to recommendations after 2 seconds
      setTimeout(() => {
        navigate('/recommendations');
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to save profile. Please try again.';
      setError(errorMessage);
      console.error('Profile save error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-2xl mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userProfile ? 'Update Your Profile' : 'Create Your Profile'}
        </h1>
        <p className="text-gray-600">
          Tell us about your skills and interests to get personalized project
          recommendations.
        </p>
      </div>

      {successMessage && (
        <div className="w-full max-w-2xl mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-slide-down">
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Success!</h3>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="w-full max-w-2xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <UserProfileForm
        onSubmit={handleSubmit}
        initialProfile={userProfile || undefined}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProfilePage;
