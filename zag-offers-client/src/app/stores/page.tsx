"use client";

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { MapPin, ArrowLeft, Search, X, BadgeCheck, Store as StoreIcon, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveImageUrl } from '@/lib/utils';
import { ErrorDisplay } from '@/components/error-display';

import { API_URL } from '@/lib/constants';

import { Offer, Store } from '@/lib/types';
import { extractItems, filterStores } from '@/lib/catalog-utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function StoresListPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchStores = useCallback(async () => {
    const cachedRaw = localStorage.getItem('cache_stores_list');
    
    if (cachedRaw && stores.length === 0) {
      const parsed = JSON.parse(cachedRaw);
      const cacheTs = parseInt(localStorage.getItem('cache_stores_list_ts') || '0', 10);
      const age = Date.now() - cacheTs;
      if (age > 5 * 60 * 1000) {
        localStorage.removeItem('cache_stores_list');
        localStorage.removeItem('cache_stores_list_ts');
      } else {
        const data = Array.isArray(parsed) ? parsed : (parsed.data || []);
        setStores(data);
        setLoading(false);
      }
    }

    try {
      const [res, offersRes] = await Promise.all([
        fetch(`${API_URL}/stores?limit=100`, { cache: 'no-store' }),
        fetch(`${API_URL}/offers?limit=100`, { cache: 'no-store' }),
      ]);
      if (res.ok) {
        const data = await res.json();
        const storesData = extractItems<Store>(data);
        const validStores = storesData.filter((s: Store) => s && s.id && s.name);
        setStores(validStores);
        localStorage.setItem('cache_stores_list', JSON.stringify(validStores));
        localStorage.setItem('cache_stores_list_ts', String(Date.now()));
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
      if (offersRes.ok) setOffers(extractItems<Offer>(await offersRes.json()));
      setError(null);
    } catch (e) { 
      console.error('Failed to fetch stores (offline?):', e); 
      if (!cachedRaw) {
        setError('فشل تحميل المتاجر. يرجى التأكد من اتصالك بالإنترنت.');
      }
    } finally { 
      setLoading(false); 
    }
  }, [stores.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => fetchStores(), 0);

    const handleOnline = () => fetchStores();
    window.addEventListener('online', handleOnline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchStores]);

  const filteredStores = useMemo(() => filterStores(stores, debouncedSearch), [stores, debouncedSearch]);
  const storeOfferStats = useMemo(() => {
    const stats = new Map<string, { count: number; maxDiscount: number }>();
    offers.forEach((offer) => {
      const storeId = offer.store?.id;
      if (!storeId) return;
      const current = stats.get(storeId) || { count: 0, maxDiscount: 0 };
      const discount = Number(String(offer.discount || '').match(/\d+(?:\.\d+)?/)?.[0] || 0);
      stats.set(storeId, { count: current.count + 1, maxDiscount: Math.max(current.maxDiscount, discount) });
    });
    return stats;
  }, [offers]);

  return (
    <main className="stores-page" dir="rtl">
      <div className="site-container py-7 sm:py-9">
      <header className="stores-page-header">
        <div>
          <h1>شركاء النجاح</h1>
          <p>اكتشف أفضل المحلات والخدمات في الزقازيق</p>
        </div>
        <div className="stores-search-wrap">
          <Search aria-hidden="true" size={19} />
          <input 
            type="text"
            placeholder="ابحث باسم المتجر أو التصنيف أو المنطقة"
            aria-label="البحث في المتاجر"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="stores-search-clear"
              aria-label="مسح البحث"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="stores-grid" aria-label="جارٍ تحميل المتاجر">
          {[1,2,3,4,5,6,7,8].map(i => <StoreCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchStores} />
      ) : filteredStores.length === 0 ? (
        <div className="stores-empty-state">
          <span><Search size={26} /></span>
          <h3>{search ? 'لم نجد متاجر مطابقة لبحثك' : 'لا توجد متاجر متاحة حاليًا'}</h3>
          <p>{search ? 'جرّب البحث باسم مختلف أو غيّر المنطقة' : 'ستظهر المتاجر هنا فور إضافتها واعتمادها'}</p>
          {search && (
          <button
            onClick={() => setSearch('')}
            className="stores-empty-action"
          >
            <RotateCcw size={15} /> مسح البحث
          </button>
          )}
        </div>
      ) : (
        <div className="stores-grid">
          {filteredStores.map((store) => <StoreCard key={store.id} store={store} stats={storeOfferStats.get(store.id)} />)}
        </div>
      )}
      </div>
    </main>
  );
}

const StoreCard = memo(function StoreCard({ store, stats }: { store: Store; stats?: { count: number; maxDiscount: number } }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const logoUrl = !logoFailed ? resolveImageUrl(store.logo) : '';
  const coverUrl = !coverFailed ? resolveImageUrl(store.coverImage || store.images?.[0]) : '';
  const initial = store.name.trim().charAt(0) || 'م';

  return (
    <Link href={`/stores/${store.id}`} className="store-card" aria-label={`استكشف متجر ${store.name}`}>
      <div className="store-card-cover">
        {coverUrl ? <Image src={coverUrl} alt="" fill loading="lazy" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px" className="object-cover" onError={() => setCoverFailed(true)} /> : <div className="store-image-fallback"><StoreIcon size={26} /><span>{initial}</span></div>}
        {store.status === 'APPROVED' && <span className="store-status"><span /> متجر معتمد</span>}
      </div>
      <div className="store-card-logo">
        {logoUrl ? <Image src={logoUrl} alt={`شعار ${store.name}`} fill loading="lazy" sizes="64px" className="object-cover" onError={() => setLogoFailed(true)} /> : <span>{initial}</span>}
      </div>
      <div className="store-card-body">
        <div className="store-name-row"><h2>{store.name}</h2>{store.status === 'APPROVED' && <BadgeCheck aria-label="متجر موثق" />}</div>
        <div className="store-meta-row"><span>{store.category?.name || 'متجر محلي'}</span><i>•</i><span><MapPin size={13} />{store.area || 'الزقازيق'}</span></div>
        <div className="store-offer-stats">
          <div><small>العروض المتاحة</small><strong>{stats?.count || 0} {stats?.count === 1 ? 'عرض' : 'عروض'}</strong></div>
          <div><small>أعلى خصم</small><strong>{stats?.maxDiscount ? `حتى ${stats.maxDiscount}%` : 'قريبًا'}</strong></div>
        </div>
        <span className="store-card-action">استكشف المتجر <ArrowLeft size={17} /></span>
      </div>
    </Link>
  );
});

function StoreCardSkeleton() {
  return <div className="store-card store-card-skeleton" aria-hidden="true"><div className="skeleton-cover" /><div className="skeleton-logo" /><div className="store-card-body"><i /><i /><div className="skeleton-stats" /><i className="skeleton-button" /></div></div>;
}
