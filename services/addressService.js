import { api } from '../utils/api';
import AuthService from './authService';

const getStoredUserId = () => {
  try {
    const session = AuthService.getStoredSession();
    return session?.user?._id || session?.user?.id || null;
  } catch (e) {
    return null;
  }
};

export const AddressService = {
  /**
   * Fetch all saved addresses for current user
   */
  async getAddresses(customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.get('/api/addresses', {
        params: uid ? { userId: uid } : {},
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching addresses:', error.message);
      throw error;
    }
  },

  /**
   * Fetch single address by ID
   */
  async getAddressById(id) {
    try {
      const response = await api.get(`/api/addresses/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching address ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Create a new delivery/site address
   */
  async createAddress(addressData) {
    try {
      const uid = addressData.userId || getStoredUserId();
      const response = await api.post('/api/addresses', {
        ...addressData,
        ...(uid ? { userId: uid } : {}),
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating address:', error.message);
      throw error;
    }
  },

  /**
   * Update an existing address
   */
  async updateAddress(id, addressData) {
    try {
      const uid = addressData?.userId || getStoredUserId();
      const response = await api.put(`/api/addresses/${id}`, {
        ...addressData,
        ...(uid ? { userId: uid } : {}),
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error updating address ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Delete an address
   */
  async deleteAddress(id) {
    try {
      const uid = getStoredUserId();
      const response = await api.delete(`/api/addresses/${id}`, {
        params: uid ? { userId: uid } : {},
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error deleting address ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Mark an address as the default address
   */
  async setDefaultAddress(id) {
    try {
      const uid = getStoredUserId();
      const response = await api.patch(`/api/addresses/${id}/default`, {
        userId: uid,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error setting default address ${id}:`, error.message);
      throw error;
    }
  },
};

export default AddressService;
