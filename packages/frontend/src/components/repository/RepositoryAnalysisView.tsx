import React, { useState } from 'react';
import type { RepositoryAnalysis } from '../../types';

interface RepositoryAnalysisViewProps {
  analysis: RepositoryAnalysis;
}

const RepositoryAnalysisView: React.FC<RepositoryAnalysisViewProps> = ({
  analysis,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set()
  );

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
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

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Repository Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {analysis.owner}/{analysis.name}
            </h1>
            <a
              href={analysis.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              View on GitHub →
            </a>
          </div>
          <div className="flex gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span>⭐</span>
              <span>{analysis.metadata.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔱</span>
              <span>{analysis.metadata.forks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📝</span>
              <span>{analysis.metadata.openIssues}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div
        className="bg-white rounded-lg shadow-sm p-6 animate-fade-in"
        style={{ animationDelay: '0.1s' }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>
        <p className="text-gray-700 leading-relaxed">{analysis.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {analysis.metadata.language}
          </span>
          {analysis.metadata.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Architecture Section */}
      <div
        className="bg-white rounded-lg shadow-sm p-6 animate-fade-in"
        style={{ animationDelay: '0.2s' }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Architecture</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          {analysis.architecture.description}
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Patterns</h3>
            <ul className="space-y-1">
              {analysis.architecture.patterns.map((pattern, idx) => (
                <li key={idx} className="text-gray-700 flex items-center gap-2">
                  <span className="text-blue-600">•</span>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Technologies</h3>
            <ul className="space-y-1">
              {analysis.architecture.technologies.map((tech, idx) => (
                <li key={idx} className="text-gray-700 flex items-center gap-2">
                  <span className="text-blue-600">•</span>
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {analysis.architecture.keyComponents.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              Key Components
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.architecture.keyComponents.map((component, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm"
                >
                  {component}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modules Section */}
      <div
        className="bg-white rounded-lg shadow-sm p-6 animate-fade-in"
        style={{ animationDelay: '0.3s' }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Modules & Folders
        </h2>
        <div className="space-y-3">
          {analysis.modules.map((module, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <button
                onClick={() => toggleModule(idx)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {module.name}
                    </h3>
                    <p className="text-sm text-gray-600">{module.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${getComplexityColor(
                      module.complexity
                    )}`}
                  >
                    {module.complexity} complexity
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedModules.has(idx) ? 'rotate-180' : ''
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

              {expandedModules.has(idx) && (
                <div className="px-4 py-3 bg-white animate-slide-down">
                  <p className="text-gray-700 mb-3">{module.purpose}</p>
                  {module.keyFiles.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Key Files:
                      </h4>
                      <ul className="space-y-1">
                        {module.keyFiles.map((file, fileIdx) => (
                          <li
                            key={fileIdx}
                            className="text-sm text-gray-600 flex items-center gap-2"
                          >
                            <span className="text-blue-600">→</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded">
                              {file}
                            </code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Entry Points Section */}
      <div
        className="bg-white rounded-lg shadow-sm p-6 animate-fade-in"
        style={{ animationDelay: '0.4s' }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Recommended Entry Points
        </h2>
        <p className="text-gray-600 mb-4">
          Start exploring the codebase with these files:
        </p>
        <div className="space-y-3">
          {analysis.entryPoints.map((entry, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-2">
                <code className="text-blue-600 font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                  {entry.file}
                </code>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(
                    entry.difficulty
                  )}`}
                >
                  {entry.difficulty}
                </span>
              </div>
              <p className="text-gray-700 text-sm">{entry.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RepositoryAnalysisView;
