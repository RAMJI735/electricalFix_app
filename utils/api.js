import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FALLBACK_API_URL = 'https://ecom-backend-git-main-ramji735s-projects.vercel.app';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  return FALLBACK_API_URL;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory active token
let currentAuthToken = null;

// Helper to get active token across tiers (Memory -> SessionStorage -> AsyncStorage on Native)
export const getActiveToken = async () => {
  if (currentAuthToken) return currentAuthToken;
  try {
    // 1. Web sessionStorage (token is strictly session-scoped on web)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sessionTok =
        window.sessionStorage.getItem('voltline_auth_token') ||
        window.sessionStorage.getItem('token');
      if (sessionTok) {
        currentAuthToken = sessionTok;
        return sessionTok;
      }
    }
    // Purge any residual tokens in web localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('voltline_auth_token');
      window.localStorage.removeItem('token');
    }
    // 2. Native mobile platforms (iOS / Android) only.
    // On web, AsyncStorage polyfills to localStorage, so do NOT use it for tokens on web.
    if (Platform.OS !== 'web') {
      const pairs = await AsyncStorage.multiGet(['voltline_auth_token', 'token']).catch(() => []);
      for (const [, val] of pairs) {
        if (val) {
          currentAuthToken = val;
          return val;
        }
      }
    }
  } catch (_e) {
    // Ignore storage errors
  }
  return null;
};

// Helper to set authorization token dynamically (SessionStorage on Web, AsyncStorage on Native)
export const setAuthToken = (token) => {
  currentAuthToken = token || null;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) {
          window.sessionStorage.setItem('voltline_auth_token', token);
          window.sessionStorage.setItem('token', token);
        }
        // Ensure token is NEVER saved in localStorage on web
        if (window.localStorage) {
          window.localStorage.removeItem('voltline_auth_token');
          window.localStorage.removeItem('token');
        }
      }
      // Only persist tokens in AsyncStorage on native mobile platforms (iOS / Android).
      // On web, AsyncStorage maps directly to localStorage, so we do NOT write tokens to it.
      if (Platform.OS !== 'web') {
        AsyncStorage.multiSet([
          ['voltline_auth_token', token],
          ['token', token],
        ]).catch(() => {});
      }
    } catch (_e) {}
  } else {
    delete api.defaults.headers.common['Authorization'];
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) {
          window.sessionStorage.removeItem('voltline_auth_token');
          window.sessionStorage.removeItem('token');
        }
        // Purge any legacy token from localStorage
        if (window.localStorage) {
          window.localStorage.removeItem('voltline_auth_token');
          window.localStorage.removeItem('token');
        }
      }
      if (Platform.OS !== 'web') {
        AsyncStorage.multiRemove(['voltline_auth_token', 'token']).catch(() => {});
      }
    } catch (_e) {}
  }
};

// Request interceptor to automatically attach authorization token to EVERY outgoing request
api.interceptors.request.use(
  async (config) => {
    let token = currentAuthToken;
    if (!token) {
      token = await getActiveToken();
    }
    if (token) {
      if (config.headers?.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else if (config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network error. Please verify backend server is running.';
    return Promise.reject(new Error(message));
  }
);

export default api;
