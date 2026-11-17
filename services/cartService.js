import { api } from '../utils/api';
import AuthService from './authService';

const getStoredUserId = () => {
  try {
    const session = AuthService.getStoredSessionSync ? AuthService.getStoredSessionSync() : null;
    return session?.user?._id || session?.user?.id || null;
  } catch (_e) {
    return null;
  }
};

export const CartService = {
  /**
   * Fetch current cart for active user
   */
  async getCart(customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.get('/api/cart', {
        params: uid ? { userId: uid } : {},
        timeout: 10000,
      });
      return response.data?.data || response.data || { items: [] };
    } catch (error) {
      console.error('Error fetching cart:', error.message);
      throw error;
    }
  },

  /**
   * Add service or product item to cart (requires authentication)
   */
  async addToCart(item, quantity = 1, notes = '', customUserId = null) {
    try {
      const targetItemId = item._id || item.id || item.itemId || item.serviceId;
      if (!targetItemId) {
        throw new Error('Item ID is required to add to cart');
      }
      const uid = customUserId || getStoredUserId();

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
        ...(uid ? { userId: uid } : {}),
      };

      const response = await api.post('/api/cart', payload, { timeout: 10000 });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error adding to cart:', error.message);
      throw error;
    }
  },

  /**
   * Update item quantity or notes in cart
   */
  async updateCartItem(itemId, quantity, notes = '', customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.put(`/api/cart/items/${itemId}`, {
        quantity,
        notes,
        ...(uid ? { userId: uid } : {}),
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error updating cart item ${itemId}:`, error.message);
      throw error;
    }
  },

  /**
   * Remove item from cart
   */
  async removeCartItem(itemId, customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.delete(`/api/cart/items/${itemId}`, {
        params: uid ? { userId: uid } : {},
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
  async clearCart(customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.delete('/api/cart', {
        params: uid ? { userId: uid } : {},
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
  async applyCoupon(couponCode, customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.post('/api/cart/apply-coupon', {
        couponCode,
        ...(uid ? { userId: uid } : {}),
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error applying coupon:', error.message);
      throw error;
    }
  },

  /**
   * Remove applied coupon
   */
  async removeCoupon(customUserId = null) {
    try {
      const uid = customUserId || getStoredUserId();
      const response = await api.post('/api/cart/remove-coupon', {
        ...(uid ? { userId: uid } : {}),
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error removing coupon:', error.message);
      throw error;
    }
  },

  /**
   * Merge guest cart into user cart upon login
   */
  async mergeCart(guestItems) {
    try {
      const response = await api.post('/api/cart/merge', { items: guestItems });
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Guest cart merge failed:', error.message);
      return null;
    }
  },
};

export default CartService;
