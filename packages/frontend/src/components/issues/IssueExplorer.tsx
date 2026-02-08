import React, { useState } from 'react';
import type { ClassifiedIssue, Difficulty } from '../../types';

interface IssueExplorerProps {
  issues: ClassifiedIssue[];
  onFilter?: (difficulty: Difficulty | null) => void;
}

const IssueExplorer: React.FC<IssueExplorerProps> = ({ issues, onFilter }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'difficulty' | 'comments' | 'date'>('difficulty');

  const toggleIssue = (issueId: number) => {
    setExpandedIssues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const handleFilterChange = (difficulty: Difficulty | null) => {
    setSelectedDifficulty(difficulty);
    if (onFilter) {
      onFilter(difficulty);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '🚀';
      case 'advanced':
        return '⚡';
      default:
        return '📝';
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'label':
        return '🏷️';
      case 'description':
        return '📝';
      case 'scope':
        return '📏';
      case 'dependencies':
        return '🔗';
      default:
        return '•';
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        return difficultyOrder[a.difficulty.level] - difficultyOrder[b.difficulty.level];
      case 'comments':
        return b.issue.comments - a.issue.comments;
      case 'date':
        return new Date(b.issue.createdAt).getTime() - new Date(a.issue.createdAt).getTime();
      default:
        return 0;
    }
  });

  const filteredIssues = selectedDifficulty
    ? sortedIssues.filter((issue) => issue.difficulty.level === selectedDifficulty)
    : sortedIssues;

  const issueCountByDifficulty = {
    beginner: issues.filter((i) => i.difficulty.level === 'beginner').length,
    intermediate: issues.filter((i) => i.difficulty.level === 'intermediate').length,
    advanced: issues.filter((i) => i.difficulty.level === 'advanced').length,
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Difficulty Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filter by Difficulty:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange(null)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 ${
                  selectedDifficulty === null
                    ? 'border-blue-600 bg-blue-50 text-blue-700 scale-105'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                All ({issues.length})
              </button>
              {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => handleFilterChange(diff)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-all duration-200 capitalize ${
                    selectedDifficulty === diff
                      ? getDifficultyColor(diff).replace('hover:', '')
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {getDifficultyIcon(diff)} {diff} ({issueCountByDifficulty[diff]})
                </button>
              ))}
            </div>
          </div>

          {/* Sort Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="difficulty">Difficulty</option>
              <option value="comments">Comments</option>
              <option value="date">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">
            No issues found matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((classifiedIssue, idx) => {
            const { issue, difficulty } = classifiedIssue;
            const isExpanded = expandedIssues.has(issue.id);

            return (
              <div
                key={issue.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Issue Header */}
                <button
                  onClick={() => toggleIssue(issue.id)}
                  className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Issue Number Badge */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-700">
                      #{issue.number}
                    </div>

                    {/* Issue Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {issue.title}
                        </h3>
                        <span
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium border-2 transition-all duration-200 ${getDifficultyColor(
                            difficulty.level
                          )} ${isExpanded ? 'animate-pulse-slow' : ''}`}
                        >
                          {getDifficultyIcon(difficulty.level)} {difficulty.level}
                        </span>
                      </div>

                      {/* Issue Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          💬 {issue.comments} comments
                        </span>
                        <span className="flex items-center gap-1">
                          📅 {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          {issue.state === 'open' ? '🟢' : '🔴'} {issue.state}
                        </span>
                      </div>

                      {/* Labels */}
                      {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {issue.labels.slice(0, 5).map((label, labelIdx) => (
                            <span
                              key={labelIdx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                            >
                              {label}
                            </span>
                          ))}
                          {issue.labels.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{issue.labels.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Expand Indicator */}
                      <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                        {isExpanded ? 'Hide' : 'Show'} details
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
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
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100 animate-slide-down">
                    {/* Issue Description */}
                    {issue.body && (
                      <div className="mt-4 mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Description:
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {issue.body}
                        </p>
                      </div>
                    )}

                    {/* Classification Reasoning */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Why this is classified as {difficulty.level}:
                      </h4>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {difficulty.reasoning}
                      </p>

                      {/* Complexity Signals */}
                      {difficulty.signals.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">
                            Complexity Signals:
                          </h5>
                          <div className="space-y-1">
                            {difficulty.signals.map((signal, signalIdx) => (
                              <div
                                key={signalIdx}
                                className="flex items-start gap-2 text-xs"
                              >
                                <span>{getSignalIcon(signal.type)}</span>
                                <span className="text-gray-600">
                                  <span className="font-medium capitalize">
                                    {signal.type}:
                                  </span>{' '}
                                  {signal.value}
                                  <span
                                    className={`ml-2 ${
                                      signal.impact === 'increases'
                                        ? 'text-red-600'
                                        : 'text-green-600'
                                    }`}
                                  >
                                    ({signal.impact} difficulty)
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      View on GitHub
                      <svg
                        className="w-4 h-4"
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssueExplorer;
