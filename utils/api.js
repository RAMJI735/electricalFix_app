/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import { Platform } from 'react-native';

const FALLBACK_API_URL =
  'https://ecom-backend-git-main-ramji735s-projects.vercel.app';

const getApiBaseUrl = () => {
  // On web, always connect to current page's hostname on port 8000 for same-origin HttpOnly cookies.
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.hostname
  ) {
    return `http://${window.location.hostname}:8000`;
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  return FALLBACK_API_URL;
};

const baseURL = getApiBaseUrl();

// Main API client (100% HttpOnly cookie based)
export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Refresh token client (100% HttpOnly cookie based)
const refreshApi = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
});

let refreshPromise = null;

// Ensure NO access or refresh tokens ever remain in JavaScript storage (localStorage/sessionStorage)
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    if (window.localStorage) {
      window.localStorage.removeItem('voltline_auth_token');
      window.localStorage.removeItem('token');
    }
    if (window.sessionStorage) {
      window.sessionStorage.removeItem('voltline_auth_token');
      window.sessionStorage.removeItem('token');
    }
  } catch (_e) { }
}

// Token helper stubs kept for backwards compatibility (tokens live strictly in HttpOnly cookies)
export const setAuthToken = (_token) => {
  // No-op: Tokens are managed strictly via HttpOnly cookies and never stored in JavaScript
};

export const getActiveToken = async () => {
  return null;
};




api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    const isRefreshRequest =
      requestUrl.includes('/auth/new-accesstoken');

    const isAuthRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/signup',
      '/auth/logout',
      '/auth/send-otp',
      '/auth/reset-password',
    ].some((path) => requestUrl.includes(path));

    // Refresh on every 401 from protected APIs
    const shouldRefresh = error.response?.status === 401;

    if (
      !shouldRefresh ||
      originalRequest._retry ||
      isRefreshRequest ||
      isAuthRequest
    ) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Network error. Please verify backend server is running.';

      return Promise.reject(new Error(message));
    }

    originalRequest._retry = true;

    try {
      // Only one refresh request for simultaneous 401 responses
      if (!refreshPromise) {
        refreshPromise = refreshApi
          .post('/auth/new-accesstoken')
          .finally(() => {
            refreshPromise = null;
          });
      }

      // Wait until backend sets the new HttpOnly access cookie
      await refreshPromise;

      // Retry original request with updated cookie
      return api(originalRequest);

    } catch (refreshError) {
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined'
      ) {
        window.dispatchEvent(new Event('auth:logout'));
      }

      return Promise.reject(refreshError);
    }
  }
);



export default api;
