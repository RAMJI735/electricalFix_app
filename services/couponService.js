import { api } from '../utils/api';

export const CouponService = {
  /**
   * Fetch active coupons available for the app
   */
  async getActiveCoupons() {
    try {
      const response = await api.get('/api/coupons', {
        params: { active: 'true' },
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.warn('Error fetching active coupons:', error.message);
      return [];
    }
  },

  /**
   * Validate coupon code against subtotal
   */
  async validateCoupon(code, subtotal) {
    try {
      const response = await api.post('/api/coupons/validate', {
        code,
        subtotal,
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error validating coupon:', error.message);
      throw error;
    }
  },
};

export default CouponService;

