import { api } from '../utils/api';

export const CartService = {
  /**
   * Fetch current cart for active user
   */
  async getCart() {
    try {
      const response = await api.get('/api/cart');
      return response.data?.data || response.data || { items: [] };
    } catch (error) {
      console.error('Error fetching cart:', error.message);
      throw error;
    }
  },

  /**
   * Add service or product item to cart (requires authentication)
   */
  async addToCart(item, quantity = 1, notes = '') {
    try {
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
      };

      const response = await api.post('/api/cart', payload);
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
      const response = await api.put(`/api/cart/items/${itemId}`, {
        quantity,
        notes,
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
  async removeCartItem(itemId) {
    try {
      const response = await api.delete(`/api/cart/items/${itemId}`);
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
      const response = await api.delete('/api/cart');
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
      const response = await api.post('/api/cart/apply-coupon', {
        couponCode,
      });
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
      const response = await api.post('/api/cart/remove-coupon');
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error removing coupon:', error.message);
      throw error;
    }
  },

  /**
   * Sync user cart upon login
   */
  async mergeCart(userId = null) {
    try {
      const response = await api.post('/api/cart/merge', { userId });
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Cart sync info:', error.message);
      return null;
    }
  },
};

export default CartService;
