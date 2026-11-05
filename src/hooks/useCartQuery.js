import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CartService from '../../services/cartService';

// Get user cart
export function useCartQuery(options = {}) {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => CartService.getCart(),
    staleTime: 60000,
    ...options,
  });
}

// Add item to cart
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, quantity = 1, notes = '' }) =>
      CartService.addToCart(item, quantity, notes),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Update cart item quantity
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity, notes = '' }) =>
      CartService.updateCartItem(itemId, quantity, notes),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Remove item from cart
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId) => CartService.removeCartItem(itemId),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Clear cart
export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => CartService.clearCart(),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Apply coupon
export function useApplyCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (couponCode) => CartService.applyCoupon(couponCode),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Remove coupon
export function useRemoveCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => CartService.removeCoupon(),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// Compatibility aliases
export const useAddToCartMutation = useAddToCart;
export const useUpdateCartItemMutation = useUpdateCartItem;
export const useRemoveCartItemMutation = useRemoveCartItem;
export const useClearCartMutation = useClearCart;
export const useApplyCouponMutation = useApplyCoupon;
export const useRemoveCouponMutation = useRemoveCoupon;

export default useCartQuery;
