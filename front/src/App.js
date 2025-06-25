import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Deposit from './components/Deposit';
import Transfer from './components/Transfer';
import Loan from './components/loan';
import Welcome from './components/Welcome';
import './App.css';

// Loading component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner">Loading...</div>
  </div>
);

// Public route component - redirects to dashboard if user is authenticated
const PublicRoute = ({ children }) => {
  const { isInitialized, loading, user } = useAuth();
  
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Private route component - redirects to login if user is not authenticated
const PrivateRoute = ({ children }) => {
  const { isInitialized, loading, user } = useAuth();
  
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isInitialized, loading } = useAuth();

  // Show loading screen until we're sure about auth state
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Show Welcome page at root */}
          <Route path="/" element={<Welcome />} />
          
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          
          {/* Private routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/deposit" 
            element={
              <PrivateRoute>
                <Deposit />
              </PrivateRoute>
            } 
          />
          <Route path="/transfer" element={
            <PrivateRoute>
              <Transfer />
            </PrivateRoute>
          } />
          <Route path="/loan" element={
            <PrivateRoute>
              <Loan />
            </PrivateRoute>
          } />

          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
