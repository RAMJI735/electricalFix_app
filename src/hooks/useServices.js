import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ServiceService from '../../services/serviceService';
import CategoryService from '../../services/categoryService';

// Get all services
export function useServices(params = {}) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => ServiceService.getServices(params),
    staleTime: 60000,
  });
}

// Get services by category
export function useServicesByCategory(categoryId, params = {}) {
  return useQuery({
    queryKey: ['services', 'category', categoryId, params],
    queryFn: () => CategoryService.getServicesByCategoryId(categoryId, params),
    enabled: !!categoryId,
    staleTime: 60000,
  });
}

// Get paginated services
export function usePaginatedServices(params = {}) {
  return useQuery({
    queryKey: ['services', 'paginated', params],
    queryFn: () => CategoryService.getServicesPaginated(params),
    staleTime: 60000,
  });
}

// Get single service details
export function useServiceDetails(id) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => ServiceService.getServiceById(id),
    enabled: !!id,
    staleTime: 60000,
  });
}

// Create service
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ServiceService.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

// Update service
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ServiceService.updateService(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
    },
  });
}

// Delete service
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ServiceService.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}