import React from 'react';
import Header from './Header';
import Footer from './Footer';
import CustomCursor from '../ui/CustomCursor';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <CustomCursor />
      <Header />
      <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-7xl" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
