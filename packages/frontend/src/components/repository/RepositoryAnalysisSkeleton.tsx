import React from 'react';

const RepositoryAnalysisSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3 mb-2 animate-shimmer bg-[length:1000px_100%]"></div>
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 animate-shimmer bg-[length:1000px_100%]"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:1000px_100%]"></div>
            <div className="h-6 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:1000px_100%]"></div>
          </div>
        </div>
      </div>

      {/* Summary Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/4 mb-4 animate-shimmer bg-[length:1000px_100%]"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6 animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-4/6 animate-shimmer bg-[length:1000px_100%]"></div>
        </div>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full animate-shimmer bg-[length:1000px_100%]"
            ></div>
          ))}
        </div>
      </div>

      {/* Architecture Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/4 mb-4 animate-shimmer bg-[length:1000px_100%]"></div>
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:1000px_100%]"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:1000px_100%]"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:1000px_100%]"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3 animate-shimmer bg-[length:1000px_100%]"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:1000px_100%]"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-shimmer bg-[length:1000px_100%]"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3 animate-shimmer bg-[length:1000px_100%]"></div>
          </div>
        </div>
      </div>

      {/* Modules Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 mb-4 animate-shimmer bg-[length:1000px_100%]"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer bg-[length:1000px_100%]"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 mb-2 animate-shimmer bg-[length:1000px_100%]"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:1000px_100%]"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Entry Points Skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3 mb-4 animate-shimmer bg-[length:1000px_100%]"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-2/3 mb-2 animate-shimmer bg-[length:1000px_100%]"></div>
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full animate-shimmer bg-[length:1000px_100%]"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RepositoryAnalysisSkeleton;
