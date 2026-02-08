import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider, RepositoryProvider } from './context';
import Layout from './components/layout/Layout';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const GuidancePage = lazy(() => import('./pages/GuidancePage'));
const IssuesPage = lazy(() => import('./pages/IssuesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <RepositoryProvider>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/analyze" element={<AnalyzePage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/guidance" element={<GuidancePage />} />
                <Route path="/issues/:owner/:repo" element={<IssuesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </Suspense>
          </Layout>
        </RepositoryProvider>
      </UserProvider>
    </Router>
  );
};

export default App;
