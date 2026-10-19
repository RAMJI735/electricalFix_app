import { api, setAuthToken } from '../utils/api';

const TOKEN_KEY = 'voltline_auth_token';
const USER_KEY = 'voltline_auth_user';

// Local storage helper (works safely on web and graceful fallback for memory)
const storage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignore storage errors
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore storage errors
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {
      // Ignore storage errors
    }
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
   * Restore stored session on app load
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