import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AuthService from '../services/authService';
import { queryClient } from '../src/lib/queryClient';
import { registerSessionExpiredHandler, registerTokenRefreshedHandler } from '../utils/api';

const AuthContext = createContext();

const getInitialSession = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const storedUser =
        window.localStorage?.getItem('voltline_auth_user') ||
        window.sessionStorage?.getItem('voltline_auth_user');
      const storedToken =
        window.localStorage?.getItem('voltline_auth_token') ||
        window.sessionStorage?.getItem('voltline_auth_token');
      if (storedUser && storedToken) {
        return {
          user: JSON.parse(storedUser),
          token: storedToken,
          isLoading: false,
        };
      }
    } catch (_e) {}
  }
  return { user: null, token: null, isLoading: true };
};

export function AuthProvider({ children }) {
  const initial = getInitialSession();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [isLoading, setIsLoading] = useState(initial.isLoading);
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Synchronize with API token refresh & session expiration events
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
      try {
        queryClient.clear();
      } catch (_e) {}
    });

    registerTokenRefreshedHandler((newToken) => {
      setToken(newToken);
    });

    return () => {
      registerSessionExpiredHandler(null);
      registerTokenRefreshedHandler(null);
    };
  }, []);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const session = await AuthService.restoreSessionAsync();
        if (isMounted) {
          if (session.user && session.token) {
            setUser(session.user);
            setToken(session.token);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
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
      } catch (_e) {}
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
      } catch (_autoLoginErr) {
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
    } catch (err) {
      console.warn('AuthContext logout notice:', err);
    } finally {
      // Clear all cached React Query state so old data is immediately wiped
      try {
        queryClient.clear();
      } catch (_e) {}
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
    setIsRefreshingProfile(true);
    try {
      const latestUser = await AuthService.getProfile();
      if (latestUser) {
        setUser(latestUser);
      }
      return latestUser;
    } catch (err) {
      console.warn('Profile refresh failed:', err);
    } finally {
      setIsRefreshingProfile(false);
    }
  };

  /**
   * Send Email OTP
   */
  const sendOtp = async (email) => {
    setAuthError(null);
    try {
      return await AuthService.sendOtp(email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Verify Email OTP
   */
  const verifyOtp = async (email, otp) => {
    setAuthError(null);
    try {
      return await AuthService.verifyOtp(email, otp);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Send Password Reset OTP
   */
  const sendResetPasswordOtp = async (email) => {
    setAuthError(null);
    try {
      return await AuthService.sendResetPasswordOtp(email);
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Reset Password with OTP
   */
  const resetPassword = async ({ email, otp, password }) => {
    setAuthError(null);
    try {
      return await AuthService.resetPassword({ email, otp, password });
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && (user._id || user.id || user.email) && token),
    isLoading,
    isRefreshingProfile,
    authError,
    login,
    signup,
    sendOtp,
    verifyOtp,
    sendResetPasswordOtp,
    resetPassword,
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
