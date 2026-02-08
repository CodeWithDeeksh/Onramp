import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Welcome to Onramp
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl">
        AI-powered onboarding assistant that helps developers understand
        unfamiliar codebases and find contribution opportunities.
      </p>
      <div className="flex gap-4">
        <Link
          to="/analyze"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg"
        >
          Analyze Repository
        </Link>
        <Link
          to="/recommendations"
          className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-105"
        >
          Get Recommendations
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
