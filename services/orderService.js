import { api } from '../utils/api';
import CartService from './cartService';

export const OrderService = {
  /**
   * Create new order
   * @param {Object} orderData
   */
  async createOrder(orderData) {
    try {
      const guestId = CartService.getGuestId();
      const payload = {
        ...orderData,
        guestId,
      };

      const response = await api.post('/api/orders', payload, {
        headers: { 'x-guest-id': guestId },
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  },

  /**
   * Fetch all orders for current user or guest
   */
  async getOrders() {
    try {
      const guestId = CartService.getGuestId();
      const response = await api.get('/api/orders', {
        params: { guestId },
        headers: { 'x-guest-id': guestId },
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching orders:', error.message);
      throw error;
    }
  },

  /**
   * Fetch order by ID or orderNumber
   */
  async getOrderById(id) {
    try {
      const response = await api.get(`/api/orders/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Cancel order
   */
  async cancelOrder(id, reason = 'Cancelled by customer') {
    try {
      const response = await api.put(`/api/orders/${id}/cancel`, { reason });
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error cancelling order ${id}:`, error.message);
      throw error;
    }
  },
};

export default OrderService;
