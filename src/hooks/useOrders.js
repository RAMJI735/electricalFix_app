import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import OrderService from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';

// Get user orders
export function useOrders(userIdOrOptions = {}, maybeOptions = {}) {
  const { user: currentUser, isAuthenticated } = useAuth();
  let targetUserId;
  let options;

  if (typeof userIdOrOptions === 'string') {
    targetUserId = userIdOrOptions;
    options = maybeOptions || {};
  } else if (userIdOrOptions && typeof userIdOrOptions === 'object') {
    options = userIdOrOptions;
    targetUserId = options.userId || currentUser?._id || currentUser?.id;
  } else {
    targetUserId = currentUser?._id || currentUser?.id;
    options = {};
  }

  const {
    params,
    enabled,
    staleTime = 60000,
    ...restOptions
  } = options;

  const isEnabled = enabled !== undefined ? enabled : Boolean(targetUserId && isAuthenticated);

  return useQuery({
    queryKey: ['orders', targetUserId, params],
    queryFn: () => OrderService.getOrders(targetUserId, params),
    enabled: isEnabled,
    staleTime,
    ...restOptions,
  });
}

// Get single order details
export function useOrderDetails(id, options = {}) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => OrderService.getOrderById(id),
    enabled: !!id,
    staleTime: 60000,
    ...options,
  });
}

// Create order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderPayload) => OrderService.createOrder(orderPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

// Cancel order
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => OrderService.cancelOrder(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Compatibility aliases
export const useCreateOrderMutation = useCreateOrder;
export const useCancelOrderMutation = useCancelOrder;

export default useOrders;
