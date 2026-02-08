import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context';
import { guidanceService } from '../services';
import { ContributionPathView } from '../components/guidance';
import type { ContributionPath } from '../types';

const GuidancePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useUser();
  const [path, setPath] = useState<ContributionPath | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState('');

  const repositoryUrl = searchParams.get('repo');

  useEffect(() => {
    if (repositoryUrl && userProfile) {
      fetchGuidance(repositoryUrl);
    }
  }, [repositoryUrl, userProfile]);

  const fetchGuidance = async (url: string) => {
    if (!userProfile) {
      setError('Please create a profile first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const guidancePath = await guidanceService.getGuidance(
        userProfile.userId,
        url
      );
      setPath(guidancePath);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to generate guidance. Please try again.';
      setError(errorMessage);
      console.error('Guidance error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl) {
      fetchGuidance(repoUrl);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Create Your Profile First
          </h1>
          <p className="text-gray-600 mb-6">
            To get personalized contribution guidance, you need to create a
            profile with your skills and interests.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-5xl mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Contribution Guidance
        </h1>
        <p className="text-gray-600">
          Get a personalized step-by-step path to start contributing to a
          repository.
        </p>
      </div>

      {/* Repository Input Form */}
      {!path && !isLoading && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-2xl mb-8 animate-fade-in"
        >
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label
              htmlFor="repo-url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              GitHub Repository URL
            </label>
            <div className="flex gap-2">
              <input
                id="repo-url"
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!repoUrl}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  !repoUrl
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                } text-white`}
              >
                Get Guidance
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-5xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Failed to Generate Guidance
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
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
            <p className="text-gray-600">
              Generating your personalized contribution path...
            </p>
          </div>
        </div>
      )}

      {/* Contribution Path */}
      {!isLoading && path && <ContributionPathView path={path} />}
    </div>
  );
};

export default GuidancePage;
