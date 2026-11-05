import { api } from '../utils/api';

export const SettingsService = {
  /**
   * Fetch current store settings, banners, announcement ticker, and commerce rules
   */
  async getSettings() {
    try {
      const response = await api.get('/api/settings');
      return response.data?.data || response.data || null;
    } catch (error) {
      console.warn('Error fetching settings:', error.message);
      return null;
    }
  },
};

export default SettingsService;

