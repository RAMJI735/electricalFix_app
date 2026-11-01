import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../utils/api';

const TOKEN_KEY = 'voltline_auth_token';
const USER_KEY = 'voltline_auth_user';

// In-memory cache for synchronous reads
const memoryStore = new Map();

// Multi-tier storage helper (Memory + AsyncStorage + Web localStorage)
const storage = {
  getItem: (key) => {
    if (memoryStore.has(key)) {
      return memoryStore.get(key);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val) {
          memoryStore.set(key, val);
          return val;
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
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
    try {
      AsyncStorage.setItem(key, value).catch(() => {});
    } catch (e) {}
  },
  removeItem: (key) => {
    memoryStore.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
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
    }
    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
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
      storage.removeItem(USER_KEY);
    }
    return { success: true };
  },

  /**
   * Restore stored session on app load (async for Android APK AsyncStorage)
   */
  async restoreSessionAsync() {
    try {
      let storedToken = memoryStore.get(TOKEN_KEY);
      let storedUser = memoryStore.get(USER_KEY);

      if (!storedToken || !storedUser) {
        const [tokenPair, userPair] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]).catch(() => [null, null]);
        if (tokenPair && tokenPair[1]) {
          storedToken = tokenPair[1];
          memoryStore.set(TOKEN_KEY, storedToken);
        }
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
      const storedToken = storage.getItem(TOKEN_KEY);
      const storedUser = storage.getItem(USER_KEY);

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