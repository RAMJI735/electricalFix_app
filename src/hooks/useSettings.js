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
    commerce: {
      deliveryCharges: settings?.deliveryCharges !== undefined
        ? Boolean(settings.deliveryCharges)
        : (settings?.commerce?.deliveryCharges !== undefined ? Boolean(settings.commerce.deliveryCharges) : false),
      minPrice: settings?.minPrice !== undefined
        ? Number(settings.minPrice)
        : (settings?.commerce?.minPrice !== undefined ? Number(settings.commerce.minPrice) : (settings?.commerce?.freeDeliveryThreshold ?? 100)),
      delivery_cost: settings?.delivery_cost !== undefined
        ? Number(settings.delivery_cost)
        : (settings?.commerce?.delivery_cost !== undefined ? Number(settings.commerce.delivery_cost) : (settings?.commerce?.standardDeliveryFee ?? 50)),
      freeDeliveryThreshold: settings?.minPrice !== undefined
        ? Number(settings.minPrice)
        : (settings?.commerce?.freeDeliveryThreshold ?? 100),
      standardDeliveryFee: settings?.delivery_cost !== undefined
        ? Number(settings.delivery_cost)
        : (settings?.commerce?.standardDeliveryFee ?? 50),
      taxRate: settings?.commerce?.taxRate ?? 18,
      gstType: settings?.gstType || settings?.commerce?.gstType || 'exclusive',
      currency: settings?.commerce?.currency || 'INR',
      currencySymbol: settings?.commerce?.currencySymbol || '₹',
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
    termsAndConditions: settings?.termsAndConditions || null,
    privacyPolicy: settings?.privacyPolicy || null,
  };
}

export default useSettings;
