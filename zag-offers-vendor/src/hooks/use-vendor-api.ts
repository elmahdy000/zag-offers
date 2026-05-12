import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCookie } from '@/lib/api';
import { vendorApi, getVendorStoreId, resolveImageUrl, Offer } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { secureUserData, secureStorage } from '@/lib/crypto';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online/api';

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

// جلب عروض المتجر
export const useVendorOffers = () => {
  return useQuery({
    queryKey: ['vendor-offers'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/offers/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch offers');
      return res.json();
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    refetchOnWindowFocus: false,
  });
};

// جلب كوبونات المتجر
export function useVendorCoupons() {
  return useQuery({
    queryKey: ['vendor-coupons'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/coupons/merchant`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch coupons');
      return res.json();
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 30 * 1000, // 30 ثانية
    gcTime: 2 * 60 * 1000, // 2 دقيقة
  });
}

// جلب إحصائيات المتجر
export function useVendorStats() {
  return useQuery({
    queryKey: ['vendor-stats'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/stores/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 60 * 1000, // 1 دقيقة
    gcTime: 5 * 60 * 1000, // 5 دقائق
    refetchInterval: 60 * 1000, // تحديث كل دقيقة
  });
}

// جلب بيانات المتجر
export function useVendorStore() {
  return useQuery({
    queryKey: ['vendor-store'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/stores/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch store');
      return res.json();
    },
    enabled: typeof window !== 'undefined' ? !!getCookie('auth_token') : false,
    staleTime: 10 * 60 * 1000, // 10 دقائق
    gcTime: 30 * 60 * 1000, // 30 دقيقة
  });
}

// إنشاء عرض جديد
export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOfferData) => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create offer');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

// تحديث عرض
export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOfferData }) => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/offers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update offer');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
    },
  });
}

// حذف عرض
export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete offer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

// تفعيل كوبون
export function useRedeemCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RedeemCouponData) => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/coupons/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to redeem coupon');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
    },
  });
}

// تحديث بيانات المتجر
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateStoreData) => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      const storeId = typeof window !== 'undefined' ? getVendorStoreId() : null;
      if (!token) throw new Error('Not authenticated');
      if (!storeId) throw new Error('Store ID not found');

      const res = await fetch(`${API_URL}/stores/${storeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update store');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-store'] });
    },
  });
}

// تغيير كلمة المرور
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: any) => {
      const token = typeof window !== 'undefined' ? getCookie('auth_token') : null;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'فشل تغيير كلمة المرور');
      }

      return res.json();
    },
  });
}
