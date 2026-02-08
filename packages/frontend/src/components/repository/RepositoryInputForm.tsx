import React, { useState } from 'react';
import { z } from 'zod';

interface RepositoryInputFormProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
}

// GitHub URL validation schema
const githubUrlSchema = z
  .string()
  .url('Please enter a valid URL')
  .refine(
    (url) => {
      const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
      return githubPattern.test(url);
    },
    { message: 'Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)' }
  );

const RepositoryInputForm: React.FC<RepositoryInputFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const validateUrl = (value: string): boolean => {
    if (!value) {
      setError('Repository URL is required');
      return false;
    }

    try {
      githubUrlSchema.parse(value);
      setError(null);
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    if (touched) {
      validateUrl(value);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (url) {
      validateUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (validateUrl(url)) {
      onSubmit(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="repo-url"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            GitHub Repository URL
          </label>
          <input
            id="repo-url"
            type="text"
            value={url}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://github.com/owner/repository"
            disabled={isLoading}
            className={`w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error && touched
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          />
          {error && touched && (
            <p className="mt-2 text-sm text-red-600 animate-slide-down">
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (touched && !!error)}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            isLoading || (touched && !!error)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-lg active:scale-95'
          } text-white flex items-center justify-center gap-2`}
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
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
              Analyzing...
            </>
          ) : (
            'Analyze Repository'
          )}
        </button>
      </div>
    </form>
  );
};

export default RepositoryInputForm;
