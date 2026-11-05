import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CategoryService from '../../services/categoryService';

// Get all categories
export function useCategories(params = {}, options = {}) {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => CategoryService.getCategories(params),
    staleTime: 60000,
    ...options,
  });
}

// Get single category by ID
export function useCategory(id, options = {}) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => CategoryService.getCategoryById(id),
    enabled: !!id,
    staleTime: 60000,
    ...options,
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: CategoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => CategoryService.updateCategory(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force }) => CategoryService.deleteCategory(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export default useCategories;
