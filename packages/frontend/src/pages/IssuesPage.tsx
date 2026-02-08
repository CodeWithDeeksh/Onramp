import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { issueService } from '../services';
import { IssueExplorer } from '../components/issues';
import type { ClassifiedIssue, Difficulty } from '../types';

const IssuesPage: React.FC = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const [issues, setIssues] = useState<ClassifiedIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<ClassifiedIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (owner && repo) {
      fetchIssues();
    }
  }, [owner, repo]);

  const fetchIssues = async (difficulty?: Difficulty) => {
    if (!owner || !repo) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedIssues = await issueService.getIssues(owner, repo, difficulty);
      setIssues(fetchedIssues);
      setFilteredIssues(fetchedIssues);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch issues. Please try again.';
      setError(errorMessage);
      console.error('Issues fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (difficulty: Difficulty | null) => {
    if (difficulty === null) {
      setFilteredIssues(issues);
    } else {
      setFilteredIssues(
        issues.filter((issue) => issue.difficulty.level === difficulty)
      );
    }
  };

  if (!owner || !repo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Invalid Repository
          </h1>
          <p className="text-gray-600">
            Please provide a valid repository owner and name.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-5xl mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Issues for {owner}/{repo}
        </h1>
        <p className="text-gray-600">
          Browse and filter issues by difficulty level to find the perfect
          contribution opportunity.
        </p>
      </div>

      {error && (
        <div className="w-full max-w-5xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Failed to Load Issues
              </h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => fetchIssues()}
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
            <p className="text-gray-600">
              Fetching and classifying issues...
            </p>
          </div>
        </div>
      ) : issues.length > 0 ? (
        <IssueExplorer issues={filteredIssues} onFilter={handleFilter} />
      ) : (
        !error && (
          <div className="w-full max-w-5xl bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">
              No issues found for this repository.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default IssuesPage;
