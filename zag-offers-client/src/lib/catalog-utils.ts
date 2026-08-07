import type { Offer, SortOption, Store } from './types';

export function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  return [];
}

export function normalizeSearchQuery(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652]/g, '');
}

export function filterOffers(
  offers: Offer[],
  filters: { query?: string; categoryId?: string; area?: string; activeOnly?: boolean },
): Offer[] {
  const query = normalizeSearchQuery(filters.query || '');
  const now = Date.now();

  return offers.filter((offer) => {
    if (!offer?.id || !offer.store?.id) return false;
    if (filters.activeOnly && offer.endDate && new Date(offer.endDate).getTime() <= now) return false;
    if (filters.categoryId && offer.store.category?.id !== filters.categoryId && offer.store.categoryId !== filters.categoryId) return false;
    if (filters.area && offer.store.area !== filters.area) return false;
    if (!query) return true;

    return [
      offer.title,
      offer.description,
      offer.store.name,
      offer.store.area,
      offer.store.category?.name,
    ].some((value) => normalizeSearchQuery(value || '').includes(query));
  });
}

export function sortOffers(offers: Offer[], sort: SortOption): Offer[] {
  const list = [...offers];
  if (sort === 'expiring') {
    return list.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }
  if (sort === 'discount') {
    const value = (discount: string) => Number.parseInt(discount?.replace(/[^0-9]/g, '') || '0', 10);
    return list.sort((a, b) => value(b.discount) - value(a.discount));
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function filterStores(stores: Store[], queryValue: string): Store[] {
  const query = normalizeSearchQuery(queryValue);
  return stores.filter((store) => {
    if (!store?.id || !store.name) return false;
    if (!query) return true;
    return [store.name, store.area, store.category?.name]
      .some((value) => normalizeSearchQuery(value || '').includes(query));
  });
}
