import { api } from '../utils/api';

export const CategoryService = {
  /**
   * Fetch all service & product categories from backend
   * @param {Object} params - Query params (e.g. { search, status, all: true, page, limit })
   */
  async getCategories(params = {}) {
    try {
      const response = await api.get('/api/categories', { params });
      // Backend returns { success: true, count, data: [...] }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories from API:', error.message);
      throw error;
    }
  },

  /**
   * Fetch a single category by ID
   * @param {string} id
   */
  async getCategoryById(id) {
    try {
      const response = await api.get(`/api/categories/${id}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error fetching category with id ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Fetch all services/products for a specific category ID
   * @param {string} categoryId - The category MongoDB ID
   * @param {Object} params - Additional query params (search, page, limit, sortBy, minPrice, maxPrice)
   */
  async getServicesByCategoryId(categoryId, params = {}) {
    try {
      // If no specific category or "all", fetch all services
      if (!categoryId || categoryId === 'all') {
        const response = await api.get('/api/services', { params });
        return response.data?.data || response.data || [];
      }

      // Query specific category services: /api/categories/:id/services
      const response = await api.get(`/api/categories/${categoryId}/services`, { params });
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      // Fallback: /api/services?category=:id
      try {
        const queryParams =
          categoryId && categoryId !== 'all'
            ? { category: categoryId, ...params }
            : params;
        const fallback = await api.get('/api/services', { params: queryParams });
        return fallback.data?.data || fallback.data || [];
      } catch (fallbackError) {
        console.error(
          `Error fetching services for category ${categoryId || 'all'}:`,
          fallbackError.message
        );
        throw fallbackError;
      }
    }
  },

  /**
   * Fetch services/products with pagination and optional category / search filtering
   * @param {Object} options - { categoryId, page, limit, search, sortBy }
   * @returns {Promise<{ items: Array, page: number, totalPages: number, total: number, hasNextPage: boolean }>}
   */
  async getServicesPaginated({
    categoryId = 'all',
    page = 1,
    limit = 6,
    search = '',
    sortBy,
  } = {}) {
    const params = { page, limit };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (sortBy) {
      params.sortBy = sortBy;
    }

    try {
      let response;
      if (!categoryId || categoryId === 'all') {
        response = await api.get('/api/services', { params });
      } else {
        response = await api.get(`/api/categories/${categoryId}/services`, { params });
      }

      const resData = response.data;
      const items = Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData)
        ? resData
        : [];

      const total = typeof resData?.total === 'number' ? resData.total : items.length;
      const totalPages =
        typeof resData?.totalPages === 'number'
          ? resData.totalPages
          : Math.ceil(total / limit) || 1;
      const hasNextPage =
        typeof resData?.hasNextPage === 'boolean'
          ? resData.hasNextPage
          : page < totalPages;

      return {
        items,
        page: resData?.page || page,
        totalPages,
        total,
        hasNextPage,
      };
    } catch (error) {
      // Fallback: /api/services?category=:id
      try {
        const queryParams =
          categoryId && categoryId !== 'all'
            ? { category: categoryId, ...params }
            : params;
        const fallback = await api.get('/api/services', { params: queryParams });
        const resData = fallback.data;
        const items = Array.isArray(resData?.data)
          ? resData.data
          : Array.isArray(resData)
          ? resData
          : [];

        const total = typeof resData?.total === 'number' ? resData.total : items.length;
        const totalPages =
          typeof resData?.totalPages === 'number'
            ? resData.totalPages
            : Math.ceil(total / limit) || 1;
        const hasNextPage =
          typeof resData?.hasNextPage === 'boolean'
            ? resData.hasNextPage
            : page < totalPages;

        return {
          items,
          page: resData?.page || page,
          totalPages,
          total,
          hasNextPage,
        };
      } catch (fallbackError) {
        console.error('Error fetching paginated services:', fallbackError.message);
        throw fallbackError;
      }
    }
  },

  /**
   * Create a new category
   * @param {Object} categoryData - { categoryName, description, icon, image, status }
   */
  async createCategory(categoryData) {
    try {
      const response = await api.post('/api/categories', categoryData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error creating category:', error.message);
      throw error;
    }
  },

  /**
   * Update category by ID
   * @param {string} id
   * @param {Object} categoryData
   */
  async updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/api/categories/${id}`, categoryData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error(`Error updating category ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Delete category by ID
   * @param {string} id
   * @param {boolean} force
   */
  async deleteCategory(id, force = false) {
    try {
      const response = await api.delete(`/api/categories/${id}`, {
        params: { force: force ? 'true' : undefined },
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting category ${id}:`, error.message);
      throw error;
    }
  },
};

export default CategoryService;
