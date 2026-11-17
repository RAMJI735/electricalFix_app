import { api } from '../utils/api';
import { MOCK_PRODUCTS } from '../src/constants/mockData';

export const ServiceService = {
  /**
   * Fetch all services/products
   * @param {Object} params - Query params (category, search, status, type, brand, minPrice, maxPrice, page, limit, sortBy)
   */
  async getServices(params = {}) {
    try {
      const response = await api.get('/api/services', { params });
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching services:', error.message);
      throw error;
    }
  },

  /**
   * Fetch services by Category ID
   * @param {string} categoryId
   * @param {Object} params
   */
  async getServicesByCategory(categoryId, params = {}) {
    try {
      const response = await api.get('/api/services', {
        params: { category: categoryId, ...params },
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error(`Error fetching services for category ${categoryId}:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch single service by ID
   * @param {string} id
   */
  async getServiceById(id) {
    if (!id) {
      throw new Error('Service ID is required');
    }
    try {
      const response = await api.get(`/api/services/${id}`, { timeout: 8000 });
      return response.data?.data || response.data;
    } catch (error) {
      console.warn(`Error fetching service with id ${id}:`, error.message);
      const mockItem = MOCK_PRODUCTS.find((p) => (p._id || p.id) === id);
      if (mockItem) {
        return mockItem;
      }
      throw error;
    }
  },

  /**
   * Create new service or product
   * @param {Object} serviceData
   */
  
  async createService(serviceData) {
    try {
      const response = await api.post('/api/services', serviceData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating service:', error.message);
      throw error;
    }
  },

  /**
   * Update service by ID
   * @param {string} id
   * @param {Object} serviceData
   */
  async updateService(id, serviceData) {
    try {
      const response = await api.put(`/api/services/${id}`, serviceData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error updating service ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Delete service by ID
   * @param {string} id
   */
  async deleteService(id) {
    try {
      const response = await api.delete(`/api/services/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting service ${id}:`, error.message);
      throw error;
    }
  },
};

export default ServiceService;
