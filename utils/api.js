import axios from 'axios';
import { Platform } from 'react-native';

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

console.log('API Base URL:', getApiBaseUrl());
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to set authorization header dynamically
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to automatically attach authorization token if available
api.interceptors.request.use(
  async (config) => {
    if (!config.headers['Authorization']) {
      try {
        let token = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          token = window.localStorage.getItem('voltline_auth_token');
        }
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (e) {}
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