import { useQuery } from '@tanstack/react-query';
import SettingsService from '../../services/settingsService';

// Get store settings
export function useSettings(options = {}) {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => SettingsService.getSettings(),
    staleTime: 60000,
    ...options,
  });

  const settings = query.data || null;

  return {
    ...query,
    settings,
    banners: settings?.heroBanners?.filter((b) => b.active) || [],
    announcement: settings?.announcement || {
      text: '⚡ NEXT-DAY SITE DISPATCH AVAILABLE',
      enabled: true,
      type: 'live',
    },
    assurances: settings?.assurances?.filter((a) => a.enabled) || [],
    commerce: settings?.commerce || {
      freeDeliveryThreshold: 2000,
      standardDeliveryFee: 150,
      taxRate: 18,
      currency: 'INR',
      currencySymbol: '₹',
    },
    storeName: settings?.storeName || 'VOLTLINE STORE',
    tagline: settings?.tagline || 'Certified Electrical Supplies & Parts',
    supportPhone: settings?.supportPhone || '+91 98765 43210',
    supportEmail: settings?.supportEmail || 'support@voltline.in',
    whatsappNumber: settings?.whatsappNumber || '+91 98765 43210',
    officeAddress: settings?.officeAddress || 'Sector V, Salt Lake',
    city: settings?.city || 'Kolkata',
    state: settings?.state || 'West Bengal',
    pincode: settings?.pincode || '700091',
    gstin: settings?.gstin || '19AAACV1234F1Z5',
  };
}

export default useSettings;
