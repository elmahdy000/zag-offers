import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/lib/constants';

export interface Offer {
  id: string;
  title: string;
  description: string;
  images: string[];
  discount: string;
  startDate: string;
  endDate: string;
  storeId: string;
  store: {
    id: string;
    name: string;
    logo?: string;
  };
}

// جلب العروض
export function useOffers(params?: {
  categoryId?: string;
  area?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['offers', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params?.area) queryParams.append('area', params.area);
      if (params?.featured) queryParams.append('featured', 'true');
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const res = await fetch(`${API_URL}/offers?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch offers');
      return res.json();
    },
    staleTime: 60 * 1000, // 1 دقيقة
    gcTime: 5 * 60 * 1000, // 5 دقائق
  });
}

// جلب العرض بالـ ID
export function useOffer(id: string) {
  return useQuery({
    queryKey: ['offer', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/offers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch offer');
      return res.json();
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

// جلب عروض المتجر
export function useStoreOffers(storeId: string) {
  return useQuery({
    queryKey: ['store-offers', storeId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/offers/store/${storeId}`);
      if (!res.ok) throw new Error('Failed to fetch store offers');
      return res.json();
    },
    enabled: !!storeId,
    staleTime: 60 * 1000,
  });
}

// جلب الفئات
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // NOTE: endpoint is /stores/categories (not /categories)
      const res = await fetch(`${API_URL}/stores/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 دقائق
    gcTime: 30 * 60 * 1000, // 30 دقيقة
  });
}

// جلب المتاجر
export function useStores(limit: number = 100) {
  return useQuery({
    queryKey: ['stores', limit],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/stores?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch stores');
      const data = await res.json();
      return Array.isArray(data) ? data : (data.items || []);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// جلب المتجر بالـ ID
export function useStore(id: string) {
  return useQuery({
    queryKey: ['store', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/stores/${id}`);
      if (!res.ok) throw new Error('Failed to fetch store');
      return res.json();
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// إنشاء كوبون
export function useGenerateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/coupons/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ offerId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate coupon');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate coupons cache
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

// جلب الكوبونات الخاصة بالمستخدم
export function useMyCoupons() {
  return useQuery({
    queryKey: ['coupons', 'my'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return [];

      const res = await fetch(`${API_URL}/coupons/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch coupons');
      return res.json();
    },
    // SSR-safe: evaluate localStorage only in browser
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
    staleTime: 30 * 1000,
  });
}

// جلب المفضلة
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        // Fallback to localStorage
        const saved = typeof window !== 'undefined' ? localStorage.getItem('favorites') : null;
        return saved ? JSON.parse(saved) : [];
      }

      const res = await fetch(`${API_URL}/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      return data.map((fav: { offer: Offer }) => ({ ...fav.offer, store: fav.offer.store }));
    },
    // SSR-safe: evaluate localStorage only in browser
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
    staleTime: 60 * 1000,
  });
}

// تبديل المفضلة
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offerId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API_URL}/favorites/toggle/${offerId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to toggle favorite');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
