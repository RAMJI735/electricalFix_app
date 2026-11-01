import { useQuery } from '@tanstack/react-query';
import CategoryService from '../../services/categoryService';

export const categoryKeys = {
  all: ['categories'],
  lists: () => [...categoryKeys.all, 'list'],
  list: (params) => [...categoryKeys.lists(), params],
  details: () => [...categoryKeys.all, 'detail'],
  detail: (id) => [...categoryKeys.details(), id],
};

/**
 * Fetch all categories with TanStack Query
 */
export function useCategories(params = {}, options = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => CategoryService.getCategories(params),
    staleTime: 1000 * 60 * 5, // 5 minutes: fast cache, background refresh if changed
    ...options,
  });
}

/**
 * Fetch a single category by ID with TanStack Query
 */
export function useCategory(id, options = {}) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => CategoryService.getCategoryById(id),
    enabled: Boolean(id),
    ...options,
  });
}

export default useCategories;
