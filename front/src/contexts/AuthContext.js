import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getProfile } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access');
      if (!token) {
        setUser(null);
        setLoading(false);
        setIsInitialized(true);
        return;
      }

      const response = await getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setUser(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const loginUser = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      
      if (response.data.status === 'success') {
        // Store tokens
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        
        // Fetch user profile
        const profileResponse = await getProfile();
        setUser(profileResponse.data);
        
        return { success: true, user: profileResponse.data };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Only check auth if there's a token
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const value = {
    user,
    loading,
    isInitialized,
    loginUser,
    logoutUser,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 