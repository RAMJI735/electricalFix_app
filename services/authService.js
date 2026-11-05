import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken, getActiveToken } from '../utils/api';

const TOKEN_KEY = 'voltline_auth_token';
const USER_KEY = 'voltline_auth_user';

// In-memory cache for synchronous reads
const memoryStore = new Map();

// Multi-tier storage helper (Memory + SessionStorage + LocalStorage + AsyncStorage)
const storage = {
  getItem: (key) => {
    if (memoryStore.has(key)) {
      return memoryStore.get(key);
    }
    try {
      if (typeof window !== 'undefined') {
        // 1. Session Storage
        if (window.sessionStorage) {
          const sVal = window.sessionStorage.getItem(key);
          if (sVal) {
            memoryStore.set(key, sVal);
            return sVal;
          }
        }
        // 2. Local Storage
        if (window.localStorage) {
          const lVal = window.localStorage.getItem(key);
          if (lVal) {
            memoryStore.set(key, lVal);
            return lVal;
          }
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
    return null;
  },
  setItem: (key, value) => {
    memoryStore.set(key, value);
    try {
      if (typeof window !== 'undefined') {
        if (window.sessionStorage) {
          window.sessionStorage.setItem(key, value);
        }
        if (window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      }
    } catch (e) {}
    try {
      AsyncStorage.setItem(key, value).catch(() => {});
    } catch (e) {}
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
    } catch (e) {}
    try {
      AsyncStorage.removeItem(key).catch(() => {});
    } catch (e) {}
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
      let storedToken = await getActiveToken();
      let storedUser = storage.getItem(USER_KEY) || storage.getItem('user');

      if (!storedUser) {
        const [, userPair] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]).catch(() => [null, null]);
        if (userPair && userPair[1]) {
          storedUser = userPair[1];
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
    } catch (e) {
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
