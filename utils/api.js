import axios from 'axios';
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // If running on web in the browser, connect to port 8000 of the active host (localhost or LAN IP)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    if (process.env.EXPO_PUBLIC_API_URL) {
      return process.env.EXPO_PUBLIC_API_URL;
    } else {
      return `http://${window.location.hostname}:8000`;
    }
  }


  // Default to machine LAN IP for physical mobile devices / Expo Go
  return 'http://192.168.31.98:8000';
};

console.log("base", getApiBaseUrl());
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