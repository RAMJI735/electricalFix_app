/* eslint-disable import/no-named-as-default-member */
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

let inMemoryToken = null;
let inMemoryRefreshToken = null;

let sessionExpiredHandler = null;
let tokenRefreshedHandler = null;

export const registerSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

export const registerTokenRefreshedHandler = (handler) => {
  tokenRefreshedHandler = handler;
};

// Main API client (cookie credentials on web, Bearer auth header on all platforms)
export const api = axios.create({
  baseURL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: Platform.OS === 'web',
});

// Refresh token client (must NEVER send expired access token)
const refreshApi = axios.create({
  baseURL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: Platform.OS === 'web',
});

export const setAuthToken = (token, refreshToken = null) => {
  inMemoryToken = token || null;
  if (refreshToken) {
    inMemoryRefreshToken = refreshToken;
  }
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
  // Guarantee refreshApi never carries an access token
  delete refreshApi.defaults.headers.common['Authorization'];
  delete refreshApi.defaults.headers.common['authorization'];
};

export const setRefreshToken = (refreshToken) => {
  inMemoryRefreshToken = refreshToken || null;
};

export const getActiveToken = async () => {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  try {
    let stored = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      stored =
        window.localStorage?.getItem('voltline_auth_token') ||
        window.sessionStorage?.getItem('voltline_auth_token');
    }
    if (!stored) {
      stored = await AsyncStorage.getItem('voltline_auth_token');
    }
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch (_e) {}
  return null;
};

export const getActiveRefreshToken = async () => {
  if (inMemoryRefreshToken) {
    return inMemoryRefreshToken;
  }
  try {
    let stored = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      stored =
        window.localStorage?.getItem('voltline_refresh_token') ||
        window.sessionStorage?.getItem('voltline_refresh_token');
    }
    if (!stored) {
      stored = await AsyncStorage.getItem('voltline_refresh_token');
    }
    if (stored) {
      inMemoryRefreshToken = stored;
      return stored;
    }
  } catch (_e) {}
  return null;
};

export const persistTokens = async ({ token, refreshToken }) => {
  if (token) {
    setAuthToken(token);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage?.setItem('voltline_auth_token', token);
      }
      await AsyncStorage.setItem('voltline_auth_token', token);
    } catch (_e) {}
  }
  if (refreshToken) {
    setRefreshToken(refreshToken);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage?.setItem('voltline_refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('voltline_refresh_token', refreshToken);
    } catch (_e) {}
  }
};

export const clearAllTokens = async () => {
  setAuthToken(null);
  inMemoryRefreshToken = null;
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage?.removeItem('voltline_auth_token');
      window.localStorage?.removeItem('voltline_refresh_token');
      window.localStorage?.removeItem('voltline_auth_user');
      window.sessionStorage?.removeItem('voltline_auth_token');
      window.sessionStorage?.removeItem('voltline_refresh_token');
      window.sessionStorage?.removeItem('voltline_auth_user');
    }
    await AsyncStorage.multiRemove([
      'voltline_auth_token',
      'voltline_refresh_token',
      'voltline_auth_user',
    ]);
  } catch (_e) {}
};

// Request interceptor to attach Authorization header and log outgoing requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = inMemoryToken || (await getActiveToken());
      if (token) {
        config.headers = config.headers || {};
        delete config.headers.authorization;
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers.Authorization = `Bearer ${token}`;
          config.headers.authorization = `Bearer ${token}`;
        }
      }
    } catch (_e) {}

    const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
    console.log(`[API Request] ${config.method?.toUpperCase()} -> ${fullUrl}`);
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

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

    const isRefreshRequest = requestUrl.includes('/auth/new-accesstoken') ||
      requestUrl.includes('/auth/refresh');

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
      const refreshToken = await getActiveRefreshToken();

      if (!refreshToken) {
        await clearAllTokens();
        if (sessionExpiredHandler) {
          try {
            sessionExpiredHandler();
          } catch (_e) {}
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      // Only one refresh request for concurrent 401 responses
      if (!refreshPromise) {
        refreshPromise = refreshApi
          .post(
            '/auth/new-accesstoken',
            { refreshToken },
            {
              headers: {
                'x-refresh-token': refreshToken,
              },
              timeout: 8000,
            }
          )
          .then(async (res) => {
            const newToken =
              res.data?.token ||
              res.data?.accessToken ||
              res.data?.data?.token ||
              res.data?.data?.accessToken;
            const newRefreshToken =
              res.data?.refreshToken ||
              res.data?.data?.refreshToken;

            if (newToken) {
              await persistTokens({
                token: newToken,
                refreshToken: newRefreshToken || refreshToken,
              });
              if (tokenRefreshedHandler) {
                try {
                  tokenRefreshedHandler(newToken);
                } catch (_e) {}
              }
              return newToken;
            }
            throw new Error('New access token not provided in refresh response');
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        delete originalRequest.headers.authorization;
        delete originalRequest.headers.Authorization;
        if (typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        } else {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.authorization = `Bearer ${newToken}`;
        }
      }

      return api(originalRequest);
    } catch (refreshError) {
      await clearAllTokens();

      if (sessionExpiredHandler) {
        try {
          sessionExpiredHandler();
        } catch (_e) {}
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;
