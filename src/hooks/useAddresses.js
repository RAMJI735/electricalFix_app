import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddressService from '../../services/addressService';
import { useAuth } from '../../context/AuthContext';

// Get saved delivery addresses
export function useAddresses(options = {}) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const targetUserId = options.userId || currentUser?._id || currentUser?.id;
  const isEnabled = options.enabled !== undefined ? options.enabled : Boolean(isAuthenticated && targetUserId);

  return useQuery({
    queryKey: ['addresses', targetUserId],
    queryFn: () => AddressService.getAddresses(targetUserId),
    enabled: isEnabled,
    staleTime: 60000,
    ...options,
  });
}

// Get single address by ID
export function useAddress(id, options = {}) {
  return useQuery({
    queryKey: ['address', id],
    queryFn: () => AddressService.getAddressById(id),
    enabled: !!id,
    staleTime: 60000,
    ...options,
  });
}

// Create address
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressData) => AddressService.createAddress(addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

// Update address
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => AddressService.updateAddress(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['address', id] });
    },
  });
}

// Delete address
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => AddressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

// Set default address
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => AddressService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
}

// Compatibility aliases
export const useCreateAddressMutation = useCreateAddress;
export const useUpdateAddressMutation = useUpdateAddress;
export const useDeleteAddressMutation = useDeleteAddress;
export const useSetDefaultAddressMutation = useSetDefaultAddress;

export default useAddresses;
