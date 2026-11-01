import { api } from '../utils/api';

export const OrderService = {
  /**
   * Create new order
   * @param {Object} orderData
   */
  async createOrder(orderData) {
    try {
      const response = await api.post('/api/orders', orderData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating order:', error.message);
      throw error;
    }
  },

  /**
   * Fetch all orders for current or individual user
   * @param {string|Object} [userIdOrParams] - MongoDB User ID or query params
   * @param {Object} [params] - Additional query params (status, search, page, limit, sort)
   */
  async getOrders(userIdOrParams, params = {}) {
    let userId;
    let queryParams;

    if (typeof userIdOrParams === 'string') {
      userId = userIdOrParams;
      queryParams = params;
    } else if (userIdOrParams && typeof userIdOrParams === 'object') {
      queryParams = userIdOrParams;
      userId = queryParams.userId;
    } else {
      userId = null;
      queryParams = params;
    }

    try {
      let response;
      if (userId) {
        // Individual user endpoint: /api/orders/user/:userId
        response = await api.get(`/api/orders/user/${userId}`, { params: queryParams });
      } else {
        response = await api.get('/api/orders', { params: queryParams });
      }
      return response.data?.data || response.data || [];
    } catch (error) {
      // Fallback: try /api/orders with userId in query
      if (userId) {
        try {
          const fallback = await api.get('/api/orders', {
            params: { userId, ...queryParams },
          });
          return fallback.data?.data || fallback.data || [];
        } catch (fallbackError) {
          console.error(`Error fetching orders for user ${userId}:`, fallbackError.message);
          throw fallbackError;
        }
      }
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
