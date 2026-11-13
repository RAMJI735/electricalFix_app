import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../utils/api';

const USER_KEY = 'voltline_auth_user';

const memoryStore = new Map();

// Storage strictly for user profile data (NO tokens are ever stored here)
const storage = {
  getItem: async (key) => {
    if (memoryStore.has(key)) {
      return memoryStore.get(key);
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const val =
          window.localStorage?.getItem(key) ||
          window.sessionStorage?.getItem(key);
        if (val) {
          memoryStore.set(key, val);
          return val;
        }
      } else {
        const val = await AsyncStorage.getItem(key);
        if (val) {
          memoryStore.set(key, val);
          return val;
        }
      }
    } catch (_e) {}

    return null;
  },

  setItem: async (key, value) => {
    memoryStore.set(key, value);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Enforce user rule: purge any residual tokens from localStorage/sessionStorage
        if (window.localStorage) {
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('voltline_auth_token');
          window.localStorage.setItem(key, value);
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem('token');
          window.sessionStorage.removeItem('voltline_auth_token');
        }
      } else {
        // AsyncStorage: used ONLY for optional user profile, NEVER for tokens
        await AsyncStorage.setItem(key, value);
      }
    } catch (_e) {}
  },

  removeItem: async (key) => {
    memoryStore.delete(key);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.localStorage) {
          window.localStorage.removeItem(key);
          window.localStorage.removeItem('user');
          window.localStorage.removeItem('token');
          window.localStorage.removeItem('voltline_auth_token');
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(key);
          window.sessionStorage.removeItem('user');
          window.sessionStorage.removeItem('token');
          window.sessionStorage.removeItem('voltline_auth_token');
        }
      } else {
        await AsyncStorage.removeItem(key);
        await AsyncStorage.removeItem('user').catch(() => {});
      }
    } catch (_e) {}
  },
};

export const AuthService = {
  /**
   * Log in user
   * Authentication tokens are set and managed purely through HttpOnly cookies by the server.
   * JavaScript does not store any tokens.
   */
  async login({ email, password }) {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    const user =
      response.data?.data?.user ||
      response.data?.data ||
      response.data?.user ||
      null;

    // Optional user profile caching (strictly stripped of any token properties)
    if (user) {
      const cleanUser = { ...user };
      delete cleanUser.token;
      delete cleanUser.refreshToken;
      await storage.setItem(USER_KEY, JSON.stringify(cleanUser));
    }

    setAuthToken(null);

    return {
      user,
      token: null, // Tokens are not stored in JS
      message: response.data?.message,
    };
  },

  async signup({ name, email, password, phone }) {
    const response = await api.post('/auth/signup', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone ? phone.trim() : '',
    });

    return response.data;
  },

  async sendOtp(email) {
    const response = await api.post('/auth/send-otp', {
      email: email.trim().toLowerCase(),
    });

    return response.data;
  },

  async verifyOtp(email, otp) {
    const response = await api.post('/auth/send-otp', {
      email: email.trim().toLowerCase(),
      otp: String(otp).trim(),
    });

    return response.data;
  },

  async sendResetPasswordOtp(email) {
    const response = await api.post('/auth/reset-password', {
      email: email.trim().toLowerCase(),
      verifyOtp: false,
    });

    return response.data;
  },

  async resetPassword({ email, otp, password }) {
    const response = await api.post('/auth/reset-password', {
      email: email.trim().toLowerCase(),
      otp: String(otp).trim(),
      password,
      verifyOtp: true,
    });

    return response.data;
  },

  /**
   * Log out user
   * Clears HttpOnly cookies on the backend and purges local cached profile.
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (_e) {
      // Continue local logout even if network request fails
    } finally {
      setAuthToken(null);
      await storage.removeItem(USER_KEY);
    }

    return { success: true };
  },

  async updateProfile(profileData) {
    const response = await api.put('/api/auth/profile', profileData);

    const updatedUser = response.data?.data || response.data;

    if (updatedUser) {
      const cleanUser = { ...updatedUser };
      delete cleanUser.token;
      delete cleanUser.refreshToken;
      await storage.setItem(USER_KEY, JSON.stringify(cleanUser));
    }

    return updatedUser;
  },

  /**
   * Verify authenticated session with backend via HttpOnly cookies
   */
  async getProfile() {
    const response = await api.get('/api/auth/me');

    const user = response.data?.data || response.data?.user || response.data;

    if (user) {
      const cleanUser = { ...user };
      delete cleanUser.token;
      delete cleanUser.refreshToken;
      await storage.setItem(USER_KEY, JSON.stringify(cleanUser));
    }

    return user;
  },

  /**
   * Restore user session:
   * First asks backend /api/auth/me via HttpOnly cookie.
   * If cookie is valid, user is authenticated without any JS token storage.
   */
  async restoreSessionAsync() {
    try {
      // 1. Purge any legacy tokens from localStorage/sessionStorage
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage?.removeItem('token');
        window.localStorage?.removeItem('voltline_auth_token');
        window.sessionStorage?.removeItem('token');
        window.sessionStorage?.removeItem('voltline_auth_token');
      }

      // 2. Verify active session with backend via HttpOnly cookies
      let freshUser = null;
      try {
        freshUser = await this.getProfile();
      } catch (_authErr) {
        // Unauthenticated or cookies expired
      }

      if (freshUser) {
        return {
          user: freshUser,
          token: null,
        };
      }

      // 3. Fallback: if backend is unreachable, check cached user profile
      const storedUser = await storage.getItem(USER_KEY);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      return {
        user: parsedUser || null,
        token: null,
      };
    } catch (_e) {
      await storage.removeItem(USER_KEY);

      return {
        user: null,
        token: null,
      };
    }
  },

  async getStoredSession() {
    try {
      const storedUser = await storage.getItem(USER_KEY);

      return {
        user: storedUser ? JSON.parse(storedUser) : null,
        token: null,
      };
    } catch (_e) {
      return {
        user: null,
        token: null,
      };
    }
  },
};

export default AuthService;
