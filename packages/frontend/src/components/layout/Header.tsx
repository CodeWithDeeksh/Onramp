import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context';

const Header: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive(path)
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-200'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-4 py-3 rounded-lg transition-all duration-200 ${
      isActive(path)
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            onClick={closeMobileMenu}
          >
            Onramp
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/analyze" className={navLinkClass('/analyze')}>
              Analyze
            </Link>
            <Link
              to="/recommendations"
              className={navLinkClass('/recommendations')}
            >
              Recommendations
            </Link>
            <Link to="/profile" className={navLinkClass('/profile')}>
              {userProfile ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Profile
                </span>
              ) : (
                'Profile'
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 animate-slide-down">
            <div className="flex flex-col gap-2">
              <Link
                to="/analyze"
                className={mobileNavLinkClass('/analyze')}
                onClick={closeMobileMenu}
              >
                Analyze
              </Link>
              <Link
                to="/recommendations"
                className={mobileNavLinkClass('/recommendations')}
                onClick={closeMobileMenu}
              >
                Recommendations
              </Link>
              <Link
                to="/profile"
                className={mobileNavLinkClass('/profile')}
                onClick={closeMobileMenu}
              >
                Profile
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
