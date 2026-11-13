import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, getActiveToken } from '../utils/api';

const TOKEN_KEY = 'voltline_auth_token';
const USER_KEY = 'voltline_auth_user';

// In-memory cache for synchronous reads
const memoryStore = new Map();

// Multi-tier storage helper:
// - Tokens are stored ONLY in memory and SessionStorage (and AsyncStorage on native iOS/Android). Tokens are NEVER stored in localStorage.
// - User data is stored in Memory, SessionStorage, and LocalStorage/AsyncStorage.
const storage = {
  getItem: (key) => {
    if (memoryStore.has(key)) {
      return memoryStore.get(key);
    }
    const isTokenKey = key === TOKEN_KEY || key === 'token';
    try {
      if (typeof window !== 'undefined') {
        // 1. Session Storage (valid for both token and user data)
        if (window.sessionStorage) {
          const sVal = window.sessionStorage.getItem(key);
          if (sVal) {
            memoryStore.set(key, sVal);
            return sVal;
          }
        }
        // 2. Local Storage: ONLY permitted for user data, NEVER for token!
        if (!isTokenKey && window.localStorage) {
          const lVal = window.localStorage.getItem(key);
          if (lVal) {
            memoryStore.set(key, lVal);
            return lVal;
          }
        }
      }
    } catch (_e) {
      // Ignore storage errors
    }
    return null;
  },
  setItem: (key, value) => {
    memoryStore.set(key, value);
    const isTokenKey = key === TOKEN_KEY || key === 'token';
    try {
      if (typeof window !== 'undefined') {
        // SessionStorage stores both tokens and user data
        if (window.sessionStorage) {
          window.sessionStorage.setItem(key, value);
        }
        if (window.localStorage) {
          if (isTokenKey) {
            // Strictly prevent token from being saved in localStorage, and remove if present
            window.localStorage.removeItem(key);
          } else {
            // Store user data in localStorage
            window.localStorage.setItem(key, value);
          }
        }
      }
    } catch (_e) {}
    try {
      // On web, AsyncStorage maps directly to localStorage.
      // Therefore, NEVER write tokens to AsyncStorage on web!
      // Only write tokens to AsyncStorage on native mobile platforms (iOS/Android).
      // User data can always be saved to AsyncStorage.
      if (!isTokenKey || Platform.OS !== 'web') {
        AsyncStorage.setItem(key, value).catch(() => {});
      }
    } catch (_e) {}
  },
  removeItem: (key) => {
    memoryStore.delete(key);
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(key);
        }
        if (window.localStorage) {
          window.localStorage.removeItem(key);
        }
      }
    } catch (_e) {}
    try {
      AsyncStorage.removeItem(key).catch(() => {});
    } catch (_e) {}
  },
};

export const AuthService = {
  /**
   * Log in user with email & password
   */
  async login({ email, password }) {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    const { data, token, message } = response.data;
    const user = data;

    if (token) {
      setAuthToken(token);
      storage.setItem(TOKEN_KEY, token);
      storage.setItem('token', token);
    }
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
      storage.setItem('user', JSON.stringify(user));
    }

    return { user, token, message };
  },

  /**
   * Register new user account
   */
  async signup({ name, email, password, phone }) {
    const response = await api.post('/auth/signup', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : '',
    });

    return response.data;
  },

  /**
   * Log out user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Logout locally even if network fails
    } finally {
      setAuthToken(null);
      storage.removeItem(TOKEN_KEY);
      storage.removeItem('token');
      storage.removeItem(USER_KEY);
      storage.removeItem('user');
    }
    return { success: true };
  },

  /**
   * Update user profile (name, phone, companyName, gstin, avatar)
   */
  async updateProfile(profileData) {
    const response = await api.put('/api/auth/profile', profileData);
    const updatedUser = response.data?.data || response.data;
    if (updatedUser) {
      storage.setItem(USER_KEY, JSON.stringify(updatedUser));
      storage.setItem('user', JSON.stringify(updatedUser));
    }
    return updatedUser;
  },

  /**
   * Fetch latest user profile from server
   */
  async getProfile() {
    const response = await api.get('/api/auth/profile');
    const user = response.data?.data || response.data;
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
      storage.setItem('user', JSON.stringify(user));
    }
    return user;
  },

  /**
   * Restore stored session on app load
   */
  async restoreSessionAsync() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem('token');
      }

      let storedToken = await getActiveToken();
      let storedUser = storage.getItem(USER_KEY) || storage.getItem('user');

      if (!storedUser) {
        const userVal = (await AsyncStorage.getItem(USER_KEY).catch(() => null)) ||
                        (await AsyncStorage.getItem('user').catch(() => null));
        if (userVal) {
          storedUser = userVal;
          memoryStore.set(USER_KEY, storedUser);
        }
      }

      if (storedToken) {
        setAuthToken(storedToken);
      }

      return {
        token: storedToken || null,
        user: storedUser ? JSON.parse(storedUser) : null,
      };
    } catch (_e) {
      return { token: null, user: null };
    }
  },

  /**
   * Restore stored session on app load (synchronous fallback)
   */
  getStoredSession() {
    try {
      const storedToken = storage.getItem(TOKEN_KEY) || storage.getItem('token');
      const storedUser = storage.getItem(USER_KEY) || storage.getItem('user');

      if (storedToken) {
        setAuthToken(storedToken);
      }

      return {
        token: storedToken || null,
        user: storedUser ? JSON.parse(storedUser) : null,
      };
    } catch (e) {
      return { token: null, user: null };
    }
  },
};

export default AuthService;
