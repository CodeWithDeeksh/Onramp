import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context';
import { recommendationService } from '../services';
import { ProjectRecommendationsList } from '../components/recommendations';
import type { ProjectRecommendation } from '../types';

const RecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useUser();
  const [recommendations, setRecommendations] = useState<ProjectRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchRecommendations();
    }
  }, [userProfile]);

  const fetchRecommendations = async () => {
    if (!userProfile) return;
    await fetchRecommendationsWithProfile(userProfile);
  };

  const fetchRecommendationsWithProfile = async (profile: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const recs = await recommendationService.getRecommendations(
        profile.userId,
        10
      );
      setRecommendations(recs);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch recommendations. Please try again.';
      setError(errorMessage);
      console.error('Recommendations error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepository = (repoUrl: string) => {
    // Navigate to guidance page with repository URL
    navigate(`/guidance?repo=${encodeURIComponent(repoUrl)}`);
  };

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Get Personalized Recommendations
          </h1>
          <p className="text-gray-600 mb-6">
            Create a profile to get recommendations tailored to your skills and interests.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Create Profile
            </button>
            <button
              onClick={() => {
                // Create a guest profile
                const guestProfile = {
                  userId: 'guest',
                  languages: ['JavaScript', 'TypeScript'],
                  frameworks: ['React'],
                  experienceLevel: 'intermediate' as const,
                  interests: ['web development'],
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                // Temporarily set guest profile to trigger recommendations
                setRecommendations([]);
                fetchRecommendationsWithProfile(guestProfile);
              }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-5xl mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Project Recommendations
        </h1>
        <p className="text-gray-600">
          Based on your profile, here are projects that match your skills and
          interests.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-5xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Failed to Load Recommendations
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="w-full max-w-5xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg
              className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-gray-600">Finding the best projects for you...</p>
          </div>
        </div>
      ) : recommendations.length > 0 ? (
        <ProjectRecommendationsList
          recommendations={recommendations}
          onSelect={handleSelectRepository}
        />
      ) : (
        !error && (
          <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">
              No recommendations available yet. Try updating your profile or
              check back later.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default RecommendationsPage;
