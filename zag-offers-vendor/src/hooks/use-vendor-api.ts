import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookie, vendorApi, getVendorStoreId } from '@/lib/api';

// Types
interface CreateOfferData {
  title: string;
  discount: string;
  description?: string;
  endDate: string;
  storeId: string;
  images?: string[];
  originalPrice?: number | null;
  startDate?: string;
}

interface UpdateOfferData {
  title: string;
  discount: string;
  description?: string;
  endDate: string;
  images?: string[];
  originalPrice?: number | null;
  startDate?: string;
}

interface RedeemCouponData {
  code: string;
  storeId?: string;
}

interface UpdateStoreData {
  name?: string;
  phone?: string;
  address?: string;
  whatsapp?: string;
  locationUrl?: string;
  logo?: string;
  coverImage?: string;
  images?: string[];
}

// ── Vendor Offers Hook ──
export const useVendorOffers = () => {
  return useQuery({
    queryKey: ['vendor-offers'],
    queryFn: async () => {
      const res = await vendorApi().get('/offers/my');
      return res.data;
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// ── Vendor Coupons Hook ──
export function useVendorCoupons() {
  return useQuery({
    queryKey: ['vendor-coupons'],
    queryFn: async () => {
      const res = await vendorApi().get('/coupons/merchant');
      return res.data;
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ── Vendor Stats Hook ──
export function useVendorStats() {
  return useQuery({
    queryKey: ['vendor-stats'],
    queryFn: async () => {
      const res = await vendorApi().get('/stores/my-dashboard');
      return res.data;
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Update every minute
    retry: 3,
  });
}

/**
 * ── Vendor Store Hook (Crucial Fix) ──
 * This hook is optimized to handle slow responses and provide reliable store data.
 */
export function useVendorStore() {
  return useQuery({
    queryKey: ['vendor-store'],
    queryFn: async () => {
      try {
        const res = await vendorApi().get('/stores/my', {
          timeout: 15000, // 15 seconds timeout
        });
        if (!res.data) throw new Error('No data returned from server');
        return res.data;
      } catch (err: any) {
        console.error('Store fetch error:', err);
        if (err.response?.status === 404) {
          throw new Error('لم يتم العثور على متجر مربوط بهذا الحساب. يرجى التواصل مع الإدارة.');
        }
        throw new Error(err.response?.data?.message || 'فشل الاتصال بخادم بيانات المتجر. يرجى المحاولة لاحقاً.');
      }
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attempt) => Math.min(attempt * 1000, 3000),
  });
}

// ── Create Offer Mutation ──
export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOfferData) => {
      const res = await vendorApi().post('/offers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

// ── Update Offer Mutation ──
export function useUpdateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOfferData }) => {
      const res = await vendorApi().patch(`/offers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
    },
  });
}

// ── Delete Offer Mutation ──
export function useDeleteOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await vendorApi().delete(`/offers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

// ── Redeem Coupon Mutation ──
export function useRedeemCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RedeemCouponData) => {
      const res = await vendorApi().post('/coupons/redeem', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

// ── Update Store Mutation ──
export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateStoreData) => {
      const storeId = typeof window !== 'undefined' ? getVendorStoreId() : null;
      if (!storeId) throw new Error('Store ID not found');
      const res = await vendorApi().patch(`/stores/${storeId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-store'] });
    },
  });
}

// ── Change Password Mutation ──
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await vendorApi().post('/auth/password', data);
      return res.data;
    },
  });
}
