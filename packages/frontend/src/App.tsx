/**
 * Main App component with routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import OfflineBanner from './components/OfflineBanner';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ModulesPage from './pages/ModulesPage';
import JobsPage from './pages/JobsPage';
import CreateJobPage from './pages/CreateJobPage';
import ExecutionsPage from './pages/ExecutionsPage';
import ExecutionDetailPage from './pages/ExecutionDetailPage';
import EventsPage from './pages/EventsPage';
import LiveDashboardPage from './pages/LiveDashboardPage';
import EndpointsPage from './pages/EndpointsPage';
import ReportsPage from './pages/ReportsPage';
import HistoryPage from './pages/HistoryPage';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <OfflineBanner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected routes with Layout */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/modules"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ModulesPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <JobsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateJobPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/jobs/:jobId/executions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ExecutionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/executions"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ExecutionsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/executions/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ExecutionDetailPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EventsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Consumption Monitoring Routes */}
              <Route
                path="/consumption/live"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <LiveDashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consumption/endpoints"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EndpointsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consumption/reports"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ReportsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/consumption/history"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <HistoryPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
