import React, { useState } from 'react';
import type { ProjectRecommendation } from '../../types';

interface ProjectRecommendationsListProps {
  recommendations: ProjectRecommendation[];
  onSelect?: (repoUrl: string) => void;
}

const ProjectRecommendationsList: React.FC<ProjectRecommendationsListProps> = ({
  recommendations,
  onSelect,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [minScore, setMinScore] = useState(0);

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const filteredRecommendations = recommendations.filter(
    (rec) => rec.score >= minScore
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="w-full max-w-5xl">
      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Minimum Match Score:
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-sm font-semibold text-gray-900 w-12">
            {minScore}%
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Showing {filteredRecommendations.length} of {recommendations.length}{' '}
          recommendations
        </p>
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">
            No recommendations match your filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {rec.repository.owner}/{rec.repository.name}
                    </h3>
                    <a
                      href={rec.repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                    >
                      View on GitHub →
                    </a>
                  </div>

                  {/* Match Score */}
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        rec.score
                      )}`}
                    >
                      {rec.score}%
                    </div>
                    <p className="text-xs text-gray-600">Match Score</p>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mb-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getScoreBarColor(
                        rec.score
                      )} transition-all duration-1000 ease-out`}
                      style={{
                        width: `${rec.score}%`,
                        animation: 'scoreBar 1s ease-out',
                      }}
                    />
                  </div>
                </div>

                {/* Repository Summary */}
                <p className="text-gray-700 mb-4">{rec.repository.summary}</p>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <span>⭐</span>
                    <span>{rec.repository.metadata.stars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🔱</span>
                    <span>{rec.repository.metadata.forks.toLocaleString()}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {rec.repository.metadata.language}
                  </span>
                </div>

                {/* Matched Skills & Interests */}
                <div className="space-y-2 mb-4">
                  {rec.matchedSkills.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Matched Skills:{' '}
                      </span>
                      <div className="inline-flex flex-wrap gap-2 mt-1">
                        {rec.matchedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {rec.matchedInterests.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Matched Interests:{' '}
                      </span>
                      <div className="inline-flex flex-wrap gap-2 mt-1">
                        {rec.matchedInterests.map((interest) => (
                          <span
                            key={interest}
                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reasoning Toggle */}
                <button
                  onClick={() => toggleCard(idx)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                >
                  {expandedCards.has(idx) ? 'Hide' : 'Show'} reasoning
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      expandedCards.has(idx) ? 'rotate-180' : ''
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
                </button>

                {/* Expanded Reasoning */}
                {expandedCards.has(idx) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-slide-down">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Why this matches your profile:
                    </h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {rec.reasoning}
                    </p>
                  </div>
                )}

                {/* Action Button */}
                {onSelect && (
                  <button
                    onClick={() => onSelect(rec.repository.url)}
                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  >
                    Get Contribution Guidance
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes scoreBar {
          from {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectRecommendationsList;
