import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ServiceService from '../../services/serviceService';
import CategoryService from '../../services/categoryService';

export const serviceKeys = {
  all: ['services'],
  lists: () => [...serviceKeys.all, 'list'],
  list: (params) => [...serviceKeys.lists(), params],
  paginated: (params) => [...serviceKeys.all, 'paginated', params],
  byCategory: (categoryId, params) => [...serviceKeys.all, 'category', categoryId, params],
  details: () => [...serviceKeys.all, 'detail'],
  detail: (id) => [...serviceKeys.details(), id],
};

/**
 * Fetch services/products with TanStack Query
 */
export function useServices(params = {}, options = {}) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => ServiceService.getServices(params),
    staleTime: 1000 * 60, // 1 minute: instant cache, background refresh if changed by admin
    ...options,
  });
}

/**
 * Fetch services/products by category ID with TanStack Query
 */
export function useServicesByCategory(categoryId, params = {}, options = {}) {
  return useQuery({
    queryKey: serviceKeys.byCategory(categoryId, params),
    queryFn: () => CategoryService.getServicesByCategoryId(categoryId, params),
    staleTime: 1000 * 60, // 1 minute: instant cache, background refresh if changed by admin
    ...options,
  });
}

/**
 * Fetch paginated services/products with TanStack Query caching
 */
export function usePaginatedServices(params = {}, options = {}) {
  const { categoryId = 'all', page = 1, limit = 6, search = '', sortBy, type, ...rest } = params;
  return useQuery({
    queryKey: serviceKeys.paginated({ categoryId, page, limit, search, sortBy, type, ...rest }),
    queryFn: () =>
      CategoryService.getServicesPaginated({
        categoryId,
        page,
        limit,
        search,
        sortBy,
        type,
        ...rest,
      }),
    staleTime: 1000 * 60, // 1 minute: instant cache, background refresh if changed by admin
    ...options,
  });
}

/**
 * Fetch single service/product details with TanStack Query
 */
export function useServiceDetails(serviceId, options = {}) {
  return useQuery({
    queryKey: serviceKeys.detail(serviceId),
    queryFn: () => ServiceService.getServiceById(serviceId),
    enabled: Boolean(serviceId),
    staleTime: 1000 * 60, // 1 minute: instant cache, background refresh if changed by admin
    ...options,
  });
}

/**
 * Mutation to create a service or product
 */
export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceData) => ServiceService.createService(serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

/**
 * Mutation to update a service or product
 */
export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => ServiceService.updateService(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

/**
 * Mutation to delete a service or product
 */
export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => ServiceService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
    },
  });
}

export default useServices;
