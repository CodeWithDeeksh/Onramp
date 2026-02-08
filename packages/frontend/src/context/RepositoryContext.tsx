import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { RepositoryAnalysis } from '../types';

interface RepositoryContextType {
  currentRepository: RepositoryAnalysis | null;
  setCurrentRepository: (repository: RepositoryAnalysis | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisError: string | null;
  setAnalysisError: (error: string | null) => void;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(
  undefined
);

export const RepositoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentRepository, setCurrentRepository] =
    useState<RepositoryAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  return (
    <RepositoryContext.Provider
      value={{
        currentRepository,
        setCurrentRepository,
        isAnalyzing,
        setIsAnalyzing,
        analysisError,
        setAnalysisError,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepository = (): RepositoryContextType => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
};
