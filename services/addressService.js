import { api } from '../utils/api';
import CartService from './cartService';

export const AddressService = {
  /**
   * Fetch all saved addresses for current user or guest
   */
  async getAddresses() {
    try {
      const guestId = CartService.getGuestId();
      const response = await api.get('/api/addresses', {
        params: { guestId },
        headers: { 'x-guest-id': guestId },
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
      const guestId = CartService.getGuestId();
      const payload = {
        ...addressData,
        guestId,
      };

      const response = await api.post('/api/addresses', payload, {
        headers: { 'x-guest-id': guestId },
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
      const guestId = CartService.getGuestId();
      const response = await api.put(
        `/api/addresses/${id}`,
        { ...addressData, guestId },
        { headers: { 'x-guest-id': guestId } }
      );
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
      const guestId = CartService.getGuestId();
      const response = await api.delete(`/api/addresses/${id}`, {
        params: { guestId },
        headers: { 'x-guest-id': guestId },
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
      const guestId = CartService.getGuestId();
      const response = await api.patch(
        `/api/addresses/${id}/default`,
        { guestId },
        { headers: { 'x-guest-id': guestId } }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error setting default address ${id}:`, error.message);
      throw error;
    }
  },
};

export default AddressService;
