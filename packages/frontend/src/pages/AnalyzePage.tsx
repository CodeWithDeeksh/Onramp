import React from 'react';
import { useRepository } from '../context';
import { repositoryService } from '../services';
import {
  RepositoryInputForm,
  RepositoryAnalysisView,
  RepositoryAnalysisSkeleton,
} from '../components/repository';

const AnalyzePage: React.FC = () => {
  const {
    currentRepository,
    setCurrentRepository,
    isAnalyzing,
    setIsAnalyzing,
    analysisError,
    setAnalysisError,
  } = useRepository();

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCurrentRepository(null); // Clear previous results

    try {
      console.log('Analyzing repository:', url);
      const analysis = await repositoryService.analyzeRepository(url);
      console.log('Analysis received:', analysis);
      setCurrentRepository(analysis);
    } catch (error: any) {
      console.error('Analysis error:', error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        'Failed to analyze repository. Please try again.';
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-5xl mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Analyze Repository
        </h1>
        <p className="text-gray-600">
          Enter a GitHub repository URL to get AI-powered insights and
          onboarding guidance.
        </p>
      </div>

      <RepositoryInputForm onSubmit={handleAnalyze} isLoading={isAnalyzing} />

      {analysisError && (
        <div className="w-full max-w-2xl mt-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Analysis Failed
              </h3>
              <p className="text-red-700 text-sm">{analysisError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 w-full flex justify-center">
        {isAnalyzing && (
          <>
            {console.log('Showing skeleton loader')}
            <RepositoryAnalysisSkeleton />
          </>
        )}
        {!isAnalyzing && currentRepository && (
          <>
            {console.log('Showing analysis view with data:', currentRepository)}
            <RepositoryAnalysisView analysis={currentRepository} />
          </>
        )}
        {!isAnalyzing && !currentRepository && !analysisError && (
          <div className="text-gray-500 text-center">
            {console.log('No data to display')}
            <p>Enter a repository URL above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzePage;
