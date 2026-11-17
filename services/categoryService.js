import { api } from '../utils/api';
import { CATEGORY_MAP } from '../src/constants/mockData';

const isMongoId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

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
   * @param {string} categoryId - The category MongoDB ID or slug (e.g. 'tools')
   * @param {Object} params - Additional query params (search, page, limit, sortBy, minPrice, maxPrice)
   */
  async getServicesByCategoryId(categoryId, params = {}) {
    const resolvedCategoryId = (categoryId && CATEGORY_MAP[categoryId]) || categoryId;

    try {
      // If no specific category or "all", fetch all services
      if (!resolvedCategoryId || resolvedCategoryId === 'all') {
        const response = await api.get('/api/services', { params });
        return response.data?.data || response.data || [];
      }

      // If valid 24-hex ObjectId, query /api/categories/:id/services
      if (isMongoId(resolvedCategoryId)) {
        const response = await api.get(`/api/categories/${resolvedCategoryId}/services`, { params });
        if (response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
      }

      // Fallback query by category or search param
      const queryParams = isMongoId(resolvedCategoryId)
        ? { category: resolvedCategoryId, ...params }
        : { search: resolvedCategoryId, ...params };
      const fallback = await api.get('/api/services', { params: queryParams });
      return fallback.data?.data || fallback.data || [];
    } catch (error) {
      console.warn(`Error fetching services for category ${categoryId || 'all'}:`, error.message);
      return [];
    }
  },

  /**
   * Fetch services/products with pagination and optional category / search filtering
   * @param {Object} options - { categoryId, page, limit, search, sortBy, type }
   * @returns {Promise<{ items: Array, page: number, totalPages: number, total: number, hasNextPage: boolean }>}
   */
  async getServicesPaginated({
    categoryId = 'all',
    page = 1,
    limit = 6,
    search = '',
    sortBy,
    type,
    ...rest
  } = {}) {
    const resolvedCategoryId = (categoryId && CATEGORY_MAP[categoryId]) || categoryId;
    const params = { page, limit, ...rest };

    if (search && search.trim()) {
      params.search = search.trim();
    }
    if (sortBy) {
      params.sortBy = sortBy;
    }
    // Only pass type if explicitly requested and NOT 'product' (database stores items as type: 'service')
    if (type && type !== 'product') {
      params.type = type;
    }

    try {
      let response;
      if (!resolvedCategoryId || resolvedCategoryId === 'all') {
        response = await api.get('/api/services', { params, timeout: 5000 });
      } else if (isMongoId(resolvedCategoryId)) {
        response = await api.get(`/api/categories/${resolvedCategoryId}/services`, { params, timeout: 5000 });
      } else {
        response = await api.get('/api/services', {
          params: { search: resolvedCategoryId, ...params },
          timeout: 5000,
        });
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
      // Only fallback if a specific subroute failed (e.g. /api/categories/:id/services)
      if (resolvedCategoryId && resolvedCategoryId !== 'all' && isMongoId(resolvedCategoryId)) {
        try {
          const queryParams = { ...params, category: resolvedCategoryId };
          const fallback = await api.get('/api/services', { params: queryParams, timeout: 5000 });
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
        } catch (_fallbackError) {
          // ignore fallback error
        }
      }

      console.warn('Error fetching paginated services, returning empty response:', error.message);
      return {
        items: [],
        page,
        totalPages: 1,
        total: 0,
        hasNextPage: false,
      };
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
