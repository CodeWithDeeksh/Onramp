import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setUserProfile } = useUser();
  const [showSignUp, setShowSignUp] = useState(false);

  if (!isOpen) return null;

  const handleGuestMode = () => {
    // Set a guest flag in localStorage
    localStorage.setItem('userMode', 'guest');
    onClose();
  };

  const handleCreateProfile = () => {
    onClose();
    navigate('/profile');
  };

  const handleSignIn = () => {
    // For now, just redirect to profile page
    // In a real app, this would show a sign-in form
    onClose();
    navigate('/profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Onramp
            </h2>
            <p className="text-gray-600">
              AI-powered open-source onboarding assistant
            </p>
          </div>

          {/* Content */}
          {!showSignUp ? (
            <div className="space-y-4">
              {/* Sign In Button */}
              <button
                onClick={handleSignIn}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg font-medium"
              >
                Sign In
              </button>

              {/* Sign Up Button */}
              <button
                onClick={handleCreateProfile}
                className="w-full px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 hover:scale-105 font-medium"
              >
                Create Account
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Guest Mode Button */}
              <button
                onClick={handleGuestMode}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Continue as Guest
              </button>

              {/* Info Text */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Create an account to save your preferences and get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                Create your profile to get started
              </p>
              <button
                onClick={handleCreateProfile}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 hover:shadow-lg font-medium"
              >
                Create Profile
              </button>
              <button
                onClick={() => setShowSignUp(false)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
