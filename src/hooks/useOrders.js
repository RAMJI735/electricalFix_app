import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import OrderService from '../../services/orderService';
import { cartKeys } from './useCartQuery';
import { serviceKeys } from './useServices';

import { useAuth } from '../../context/AuthContext';

export const orderKeys = {
  all: ['orders'],
  lists: () => [...orderKeys.all, 'list'],
  list: (userId, params) => [
    ...orderKeys.lists(),
    userId || 'current',
    params || {},
  ],
  details: () => [...orderKeys.all, 'detail'],
  detail: (id) => [...orderKeys.details(), id],
};

/**
 * Fetch orders for an individual user with TanStack Query.
 * Supports:
 *   useOrders() - automatically uses current authenticated user
 *   useOrders(userId)
 *   useOrders({ userId, select, params, enabled, ...options })
 *   useOrders(userId, { select, params, enabled, ...options })
 *
 * @param {string|Object} [userIdOrOptions] - User ID string or options object
 * @param {Object} [maybeOptions] - Options when first arg is userId
 */
export function useOrders(userIdOrOptions = {}, maybeOptions = {}) {
  let authContext = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    authContext = useAuth();
  } catch (e) {
    // In case hook is used outside of AuthProvider
  }

  const currentUser = authContext?.user;
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
    select,
    params,
    enabled,
    staleTime = 1000 * 30, // 30s fresh: instant cache, background refresh when needed
    ...restOptions
  } = options;

  const isEnabled = enabled !== undefined ? enabled : Boolean(targetUserId);

  return useQuery({
    queryKey: orderKeys.list(targetUserId, params),
    queryFn: () => OrderService.getOrders(targetUserId, params),
    enabled: isEnabled,
    staleTime,
    select,
    ...restOptions,
  });
}

/**
 * Fetch single order details with TanStack Query
 */
export function useOrderDetails(id, options = {}) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => OrderService.getOrderById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60, // 1 minute: fast cache, background refresh for delivery updates
    ...options,
  });
}

/**
 * Mutation to create an order
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderPayload) => OrderService.createOrder(orderPayload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
    onError: (err) => {
      // If order placement fails (e.g. out of stock or inventory depleted),
      // immediately refresh cart and catalog queries to sync real-time stock
      queryClient.invalidateQueries({ queryKey: cartKeys.all });
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

/**
 * Mutation to cancel an order
 */
export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => OrderService.cancelOrder(id, reason),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export default useOrders;
