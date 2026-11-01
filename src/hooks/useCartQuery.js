import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CartService from '../../services/cartService';

export const cartKeys = {
  all: ['cart'],
  current: () => [...cartKeys.all, 'current'],
};

/**
 * Fetch current user cart with TanStack Query
 */
export function useCartQuery(options = {}) {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => CartService.getCart(),
    staleTime: 1000 * 30, // 30s fresh: shows instant cache, validates stock in background
    refetchOnMount: 'always', // Revalidates inventory whenever the user views Cart
    ...options,
  });
}

/**
 * Add item to cart mutation
 */
export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, quantity = 1, notes = '' }) =>
      CartService.addToCart(item, quantity, notes),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Update cart item quantity mutation
 */
export function useUpdateCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity, notes = '' }) =>
      CartService.updateCartItem(itemId, quantity, notes),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Remove cart item mutation
 */
export function useRemoveCartItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => CartService.removeCartItem(itemId),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Clear cart mutation
 */
export function useClearCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => CartService.clearCart(),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Apply coupon mutation
 */
export function useApplyCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponCode) => CartService.applyCoupon(couponCode),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

/**
 * Remove coupon mutation
 */
export function useRemoveCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => CartService.removeCoupon(),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
    },
  });
}

export default useCartQuery;
