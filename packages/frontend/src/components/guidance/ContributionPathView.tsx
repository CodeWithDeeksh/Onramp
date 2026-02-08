import React, { useState, useEffect } from 'react';
import type { ContributionPath } from '../../types';

interface ContributionPathViewProps {
  path: ContributionPath;
}

const ContributionPathView: React.FC<ContributionPathViewProps> = ({ path }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleComplete = (index: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'documentation':
        return '📚';
      case 'tutorial':
        return '🎓';
      case 'example':
        return '💡';
      default:
        return '🔗';
    }
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Contribution Path
            </h1>
            <a
              href={path.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              {path.repositoryUrl.replace('https://github.com/', '')} →
            </a>
          </div>
          <div className="text-right">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium border ${getDifficultyColor(
                path.difficulty
              )}`}
            >
              {path.difficulty}
            </span>
            <p className="text-sm text-gray-600 mt-2">
              ⏱️ {path.estimatedTime}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Your Progress
            </span>
            <span className="text-sm text-gray-600">
              {completedSteps.size} of {path.steps.length} steps completed
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${(completedSteps.size / path.steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200">
          <div
            className="bg-blue-600 w-full transition-all duration-300"
            style={{ height: `${scrollProgress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {path.steps.map((step, idx) => (
            <div
              key={idx}
              className="relative pl-20 animate-fade-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Step Number Circle */}
              <div
                className={`absolute left-0 w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                  completedSteps.has(idx)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {completedSteps.has(idx) ? '✓' : step.order}
              </div>

              {/* Step Card */}
              <div
                className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 ${
                  expandedSteps.has(idx)
                    ? 'shadow-lg'
                    : 'hover:shadow-md'
                }`}
              >
                {/* Step Header */}
                <button
                  onClick={() => toggleStep(idx)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-700">{step.description}</p>
                    </div>
                    <svg
                      className={`w-6 h-6 text-gray-500 transition-transform flex-shrink-0 ml-4 ${
                        expandedSteps.has(idx) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedSteps.has(idx) && (
                  <div className="px-6 pb-6 animate-slide-down">
                    {/* Files to Explore */}
                    {step.files.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          📁 Files to Explore:
                        </h4>
                        <div className="space-y-2">
                          {step.files.map((file, fileIdx) => (
                            <div
                              key={fileIdx}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <code className="text-sm text-blue-600 font-mono flex-1">
                                {file}
                              </code>
                              <a
                                href={`${path.repositoryUrl}/blob/main/${file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-600 hover:text-blue-600"
                              >
                                View →
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concepts to Learn */}
                    {step.concepts.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          💡 Key Concepts:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {step.concepts.map((concept, conceptIdx) => (
                            <span
                              key={conceptIdx}
                              className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {step.resources.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          📚 Helpful Resources:
                        </h4>
                        <div className="space-y-2">
                          {step.resources.map((resource, resIdx) => (
                            <a
                              key={resIdx}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                              <span className="text-2xl">
                                {getResourceIcon(resource.type)}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {resource.title}
                                </p>
                                <p className="text-xs text-gray-600 capitalize">
                                  {resource.type}
                                </p>
                              </div>
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mark Complete Button */}
                    <button
                      onClick={() => toggleComplete(idx)}
                      className={`w-full mt-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        completedSteps.has(idx)
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                      }`}
                    >
                      {completedSteps.has(idx)
                        ? '✓ Completed'
                        : 'Mark as Complete'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Message */}
      {completedSteps.size === path.steps.length && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center animate-scale-in">
          <span className="text-5xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Congratulations!
          </h3>
          <p className="text-green-700">
            You've completed all steps in your contribution path. You're ready
            to make your first contribution!
          </p>
        </div>
      )}
    </div>
  );
};

export default ContributionPathView;
