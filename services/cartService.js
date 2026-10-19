import { api } from '../utils/api';

const GUEST_ID_KEY = 'voltline_guest_id';

// Local storage helper (works on web and fallback memory)
let memoryGuestId = null;

const getStoredGuestId = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let gid = window.localStorage.getItem(GUEST_ID_KEY);
      if (!gid) {
        gid = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        window.localStorage.setItem(GUEST_ID_KEY, gid);
      }
      return gid;
    }
  } catch (e) {
    // Ignore storage errors
  }

  if (!memoryGuestId) {
    memoryGuestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }
  return memoryGuestId;
};

export const CartService = {
  getGuestId() {
    return getStoredGuestId();
  },

  /**
   * Fetch current cart for active user or guest
   */
  async getCart() {
    try {
      const guestId = getStoredGuestId();
      const response = await api.get('/api/cart', {
        params: { guestId },
        headers: { 'x-guest-id': guestId },
      });
      return response.data?.data || response.data || { items: [] };
    } catch (error) {
      console.error('Error fetching cart:', error.message);
      throw error;
    }
  },

  /**
   * Add service or product item to cart
   */
  async addToCart(item, quantity = 1, notes = '') {
    try {
      const guestId = getStoredGuestId();
      const targetItemId = item._id || item.id || item.itemId || item.serviceId;

      const payload = {
        itemId: targetItemId,
        name: item.name || item.serviceName || 'Electrical Item',
        price: Number(item.price) || 0,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        image: item.image || '',
        category: typeof item.category === 'object' ? item.category?._id : (item.category || ''),
        type: item.type || 'service',
        brand: item.brand || '',
        notes: notes || '',
        guestId,
      };

      const response = await api.post('/api/cart', payload, {
        headers: { 'x-guest-id': guestId },
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error adding to cart:', error.message);
      throw error;
    }
  },

  /**
   * Update item quantity or notes in cart
   */
  async updateCartItem(itemId, quantity, notes = '') {
    try {
      const guestId = getStoredGuestId();
      const response = await api.put(
        `/api/cart/items/${itemId}`,
        { quantity, notes, guestId },
        { headers: { 'x-guest-id': guestId } }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error updating cart item ${itemId}:`, error.message);
      throw error;
    }
  },

  /**
   * Remove item from cart
   */
  async removeCartItem(itemId) {
    try {
      const guestId = getStoredGuestId();
      const response = await api.delete(`/api/cart/items/${itemId}`, {
        params: { guestId },
        headers: { 'x-guest-id': guestId },
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error removing cart item ${itemId}:`, error.message);
      throw error;
    }
  },

  /**
   * Clear all items in active cart
   */
  async clearCart() {
    try {
      const guestId = getStoredGuestId();
      const response = await api.delete('/api/cart', {
        params: { guestId },
        headers: { 'x-guest-id': guestId },
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error clearing cart:', error.message);
      throw error;
    }
  },

  /**
   * Apply promotional coupon code
   */
  async applyCoupon(couponCode) {
    try {
      const guestId = getStoredGuestId();
      const response = await api.post(
        '/api/cart/apply-coupon',
        { couponCode, guestId },
        { headers: { 'x-guest-id': guestId } }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error applying coupon:', error.message);
      throw error;
    }
  },

  /**
   * Remove promotional coupon
   */
  async removeCoupon() {
    try {
      const guestId = getStoredGuestId();
      const response = await api.post(
        '/api/cart/remove-coupon',
        { guestId },
        { headers: { 'x-guest-id': guestId } }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error removing coupon:', error.message);
      throw error;
    }
  },

  /**
   * Merge guest cart into user cart upon login
   */
  async mergeCart(userId = null) {
    try {
      const guestId = getStoredGuestId();
      const payload = { guestId };
      if (userId) {
        payload.userId = userId;
      }
      const response = await api.post(
        '/api/cart/merge',
        payload,
        { headers: { 'x-guest-id': guestId } }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Cart merge info:', error.message);
      return null;
    }
  },
};

export default CartService;
