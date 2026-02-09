import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WelcomeModal from '../components/ui/WelcomeModal';

const HomePage: React.FC = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    const userProfile = localStorage.getItem('userProfile');
    const userMode = localStorage.getItem('userMode');

    // Show modal if user hasn't seen it and doesn't have a profile or guest mode set
    if (!hasSeenWelcome && !userProfile && !userMode) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  return (
    <>
      <WelcomeModal isOpen={showWelcomeModal} onClose={handleCloseWelcome} />
      
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
    </>
  );
};

export default HomePage;
