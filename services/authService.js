import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api,
  setAuthToken,
  getActiveToken,
  getActiveRefreshToken,
  persistTokens,
  clearAllTokens,
} from '../utils/api';

const USER_KEY = 'voltline_auth_user';
const TOKEN_KEY = 'voltline_auth_token';
const REFRESH_TOKEN_KEY = 'voltline_refresh_token';

const memoryStore = new Map();

// Storage for user profile and authentication tokens
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
        if (window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
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
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(key);
        }
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (_e) {}
  },
};

export const AuthService = {
  /**
   * Log in user
   */
  async login({ email, password }) {
    const response = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    const token =
      response.data?.token ||
      response.data?.data?.token ||
      null;
    const refreshToken =
      response.data?.refreshToken ||
      response.data?.data?.refreshToken ||
      null;
    const user =
      response.data?.data?.user ||
      response.data?.data ||
      response.data?.user ||
      null;

    if (token) {
      await persistTokens({ token, refreshToken });
      await storage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }

    if (user) {
      const cleanUser = { ...user };
      delete cleanUser.token;
      delete cleanUser.refreshToken;
      await storage.setItem(USER_KEY, JSON.stringify(cleanUser));
    }

    return {
      user,
      token,
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

    const token =
      response.data?.token ||
      response.data?.data?.token ||
      null;
    const refreshToken =
      response.data?.refreshToken ||
      response.data?.data?.refreshToken ||
      null;
    const user =
      response.data?.data?.user ||
      response.data?.data ||
      response.data?.user ||
      null;

    if (token) {
      await persistTokens({ token, refreshToken });
      await storage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        await storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }

    if (user) {
      const cleanUser = { ...user };
      delete cleanUser.token;
      delete cleanUser.refreshToken;
      await storage.setItem(USER_KEY, JSON.stringify(cleanUser));
    }

    return {
      user,
      token,
      message: response.data?.message,
    };
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
   * Guarantees local storage and memory are always cleared, even if server request times out.
   */
  async logout() {
    try {
      // 2-second timeout for server notification so UI logout never hangs
      await Promise.race([
        api.post('/auth/logout'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
      ]);
    } catch (_e) {
      // Continue local logout even if network request fails or times out
    } finally {
      await clearAllTokens();
      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(REFRESH_TOKEN_KEY);
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
   * Verify authenticated session with backend
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
   * Checks stored token and verifies profile with backend.
   */
  async restoreSessionAsync() {
    try {
      const storedToken = (await storage.getItem(TOKEN_KEY)) || (await getActiveToken());
      const storedRefreshToken = (await storage.getItem(REFRESH_TOKEN_KEY)) || (await getActiveRefreshToken());
      const storedUser = await storage.getItem(USER_KEY);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      if (storedToken) {
        setAuthToken(storedToken, storedRefreshToken);

        try {
          const freshUser = await Promise.race([
            this.getProfile(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
          ]);
          if (freshUser) {
            const currentToken = (await getActiveToken()) || storedToken;
            return {
              user: freshUser,
              token: currentToken,
            };
          }
        } catch (_authErr) {
          // If 401 occurred, check if token was refreshed by response interceptor
          const refreshedToken = await getActiveToken();
          if (refreshedToken && refreshedToken !== storedToken) {
            try {
              const freshUser = await this.getProfile();
              if (freshUser) {
                return { user: freshUser, token: refreshedToken };
              }
            } catch (_e2) {}
          }

          if (_authErr?.response?.status === 401 || _authErr?.message?.includes('401')) {
            await clearAllTokens();
            await storage.removeItem(TOKEN_KEY);
            await storage.removeItem(REFRESH_TOKEN_KEY);
            await storage.removeItem(USER_KEY);
            return { user: null, token: null };
          }
        }

        if (parsedUser) {
          const currentToken = (await getActiveToken()) || storedToken;
          return {
            user: parsedUser,
            token: currentToken,
          };
        }
      }

      await clearAllTokens();
      return {
        user: null,
        token: null,
      };
    } catch (_e) {
      await clearAllTokens();
      await storage.removeItem(TOKEN_KEY);
      await storage.removeItem(REFRESH_TOKEN_KEY);
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
      const storedToken = (await storage.getItem(TOKEN_KEY)) || (await getActiveToken());

      return {
        user: storedUser ? JSON.parse(storedUser) : null,
        token: storedToken || null,
      };
    } catch (_e) {
      return {
        user: null,
        token: null,
      };
    }
  },

  getStoredSessionSync() {
    try {
      const rawUser = memoryStore.get(USER_KEY);
      const user = rawUser ? JSON.parse(rawUser) : null;
      const token = memoryStore.get(TOKEN_KEY) || null;
      return { user, token };
    } catch (_e) {
      return { user: null, token: null };
    }
  },
};

export default AuthService;
