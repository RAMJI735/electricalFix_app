/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import { Platform } from 'react-native';

const FALLBACK_API_URL =
  'https://ecom-backend-git-main-ramji735s-projects.vercel.app';

const getApiBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL;
  if (url) {
    url = url.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
    // If running on a native mobile device and configured URL is localhost/127.0.0.1, use live URL
    if (
      Platform.OS !== 'web' &&
      (url.includes('localhost') || url.includes('127.0.0.1'))
    ) {
      console.warn(
        '[API] "localhost" cannot be reached from native mobile devices. Using live URL:',
        FALLBACK_API_URL
      );
      return FALLBACK_API_URL;
    }
    return url;
  }

  return FALLBACK_API_URL;
};

const baseURL = getApiBaseUrl();
console.log(`[API Config] Platform: ${Platform.OS} | BaseURL: ${baseURL}`);

// Main API client (cookie credentials on web, native transport on mobile)
export const api = axios.create({
  baseURL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: Platform.OS === 'web',
});

// Refresh token client
const refreshApi = axios.create({
  baseURL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: Platform.OS === 'web',
});

// Request interceptor to log outgoing requests
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[API Request] ${config.method?.toUpperCase()} -> ${fullUrl}`);
    return config;
  },
  (error) => Promise.reject(error)
);

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
    const originalRequest = error.config || {};
    const fullUrl = `${originalRequest.baseURL || ''}${originalRequest.url || ''}`;

    console.error(`[API Error] ${originalRequest.method?.toUpperCase() || 'GET'} ${fullUrl}:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });

    if (!error.config) {
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

    // Public GET endpoints do not require authentication and must never trigger token refresh
    const isPublicEndpoint = [
      '/api/services',
      '/api/categories',
      '/api/settings',
    ].some((path) => requestUrl.includes(path));

    // Refresh on 401 from protected APIs only
    const shouldRefresh = error.response?.status === 401 && !isPublicEndpoint;

    if (
      !shouldRefresh ||
      originalRequest._retry ||
      isRefreshRequest ||
      isAuthRequest ||
      isPublicEndpoint
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
