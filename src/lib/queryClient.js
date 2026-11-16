import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute: fast instant cache, revalidates silently in background
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days persistent storage retention
      retry: 2, // Rapid failure recovery without blocking mobile UI
      refetchOnMount: true, // Stale-while-revalidate: instant render from cache, background refresh if stale
      refetchOnWindowFocus: false, // Prevent refetch on app foregrounding
      refetchOnReconnect: true, // Auto-refetch stale queries when connection returns
      networkMode: 'always', // Always execute immediately in React Native (avoids paused-query infinite loading)
    },
    mutations: {
      retry: 1,
      networkMode: 'always',
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'VOLTLINE_TANSTACK_QUERY_CACHE_V2',
  throttleTime: 1000,
});

export default queryClient;
