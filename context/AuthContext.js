import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';
import { queryClient } from '../src/lib/queryClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const session = await AuthService.restoreSessionAsync();
        if (isMounted && session.user) {
          setUser(session.user);
          setToken(session.token);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user
   */
  const login = async ({ email, password }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await AuthService.login({ email, password });
      setUser(result.user);
      setToken(result.token);
      // Invalidate relevant queries to fetch fresh user-specific data
      try {
        queryClient.invalidateQueries();
      } catch (e) {}
      return result;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user and automatically log in
   */
  const signup = async ({ name, email, password, phone }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await AuthService.signup({ name, email, password, phone });
      // Attempt auto-login with registered credentials
      try {
        const loginResult = await AuthService.login({ email, password });
        setUser(loginResult.user);
        setToken(loginResult.token);
        return loginResult;
      } catch (autoLoginErr) {
        // Even if auto-login fails, signup succeeded
        return result;
      }
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log out user
   */
  const logout = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await AuthService.logout();
    } finally {
      // Clear all cached React Query state so old data is immediately wiped
      try {
        queryClient.clear();
      } catch (e) {}
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  /**
   * Update profile
   */
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const updatedUser = await AuthService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh profile
   */
  const refreshProfile = async () => {
    try {
      const latestUser = await AuthService.getProfile();
      if (latestUser) {
        setUser(latestUser);
      }
      return latestUser;
    } catch (err) {
      console.warn('Profile refresh failed:', err);
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    authError,
    login,
    signup,
    logout,
    updateProfile,
    refreshProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
