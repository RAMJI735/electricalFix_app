import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddressService from '../../services/addressService';

export const addressKeys = {
  all: ['addresses'],
  lists: () => [...addressKeys.all, 'list'],
  details: () => [...addressKeys.all, 'detail'],
  detail: (id) => [...addressKeys.details(), id],
};

/**
 * Fetch all saved delivery addresses with TanStack Query
 */
export function useAddresses(options = {}) {
  return useQuery({
    queryKey: addressKeys.lists(),
    queryFn: () => AddressService.getAddresses(),
    staleTime: 1000 * 60 * 2, // 2 minutes: instant cache, background refresh if modified
    ...options,
  });
}

/**
 * Fetch single address by ID with TanStack Query
 */
export function useAddress(id, options = {}) {
  return useQuery({
    queryKey: addressKeys.detail(id),
    queryFn: () => AddressService.getAddressById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2, // 2 minutes: instant cache, background refresh if modified
    ...options,
  });
}

/**
 * Mutation to create an address
 */
export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (addressData) => AddressService.createAddress(addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

/**
 * Mutation to update an address
 */
export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => AddressService.updateAddress(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}

/**
 * Mutation to delete an address
 */
export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => AddressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

/**
 * Mutation to set default address
 */
export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => AddressService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
  });
}

export default useAddresses;
