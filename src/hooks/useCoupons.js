import { useQuery, useMutation } from '@tanstack/react-query';
import CouponService from '../../services/couponService';

// Get active coupons
export function useCoupons(options = {}) {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => CouponService.getActiveCoupons(),
    staleTime: 60000,
    ...options,
  });
}

// Validate coupon
export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, subtotal }) => CouponService.validateCoupon(code, subtotal),
  });
}

// Backward compatibility alias
export const useValidateCouponMutation = useValidateCoupon;

export default useCoupons;
