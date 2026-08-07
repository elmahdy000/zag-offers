"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Phone, MessageCircle, ExternalLink, Tag, Store, Clock3, Star, BadgeCheck, Navigation, Images, ArrowLeft, ShieldCheck } from 'lucide-react';
import { RiFacebookFill, RiInstagramLine } from 'react-icons/ri';
import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/constants';
import { OfferCard } from '@/components/offer-card';
import { ErrorDisplay } from '@/components/error-display';
import { resolveImageUrl } from '@/lib/utils';

interface Category {
  name: string;
}

interface Store {
  id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  images?: string[];
  area: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  locationUrl?: string;
  facebook?: string;
  instagram?: string;
  workingHours?: string;
  ratingAvg?: number;
  ratingCount?: number;
  category?: Category;
}

interface Offer {
  id: string;
  title: string;
  discount: string;
  endDate: string;
  images?: string[];
  store: Store;
}

export default function StoreDetailsPage() {
  const { id } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // تحقق من صحة الـ ID
      if (!id || typeof id !== 'string' || id.length === 0) {
        console.error('Invalid store ID:', id);
        setLoading(false);
        return;
      }
      
      try {
        const [sRes, oRes] = await Promise.all([
          fetch(`${API_URL}/stores/${id}`),
          fetch(`${API_URL}/offers/store/${id}`)
        ]);
        
        if (sRes.ok) {
          const storeData = await sRes.json();
          // تحقق من صحة بيانات المتجر
          if (!storeData || !storeData.id) {
            console.error('Invalid store data:', storeData);
            setLoading(false);
            return;
          }
          setStore(storeData);
        }
        
        if (oRes.ok) {
          const offersData = await oRes.json();
          // تحقق من صحة بيانات العروض
          if (Array.isArray(offersData)) {
            setOffers(offersData.filter(o => o && o.id));
          }
        }
      } catch (e) { 
        console.error('Failed to fetch store data:', e);
        setError('فشل تحميل بيانات المتجر. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      <div className="glass rounded-[40px] p-8 sm:p-12 mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 bg-white/5 rounded-[32px] animate-pulse" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-4 w-24 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-36 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />)}
      </div>
    </div>
  );
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      <ErrorDisplay message={error} onRetry={() => window.location.reload()} />
    </div>
  );
  if (!store) return (
    <div className="max-w-7xl mx-auto px-4 py-10" dir="rtl">
      <div className="text-center py-24 glass rounded-[3rem] border border-white/5">
        <Store size={48} className="mx-auto text-white/10 mb-4" />
        <h3 className="text-2xl font-black mb-3">المتجر غير موجود</h3>
        <p className="text-white/40 text-sm font-bold mb-8">ربما تم حذف هذا المتجر أو أن الرابط غير صحيح</p>
        <Link href="/stores" className="px-8 py-3 bg-[#FF6B00] text-white font-black rounded-full shadow-lg">
          تصفح المتاجر
        </Link>
      </div>
    </div>
  );

  const logoUrl = resolveImageUrl(store.logo);
  const coverUrl = resolveImageUrl(store.coverImage || store.images?.[0]);
  const gallery = (store.images || []).map(resolveImageUrl).filter((image): image is string => Boolean(image)).slice(0, 4);
  const whatsappNumber = (store.whatsapp || '').replace(/\D/g, '').replace(/^0/, '20');

  return (
    <div className="store-profile-page" dir="rtl">
      <section className="store-profile-hero">
        <div className={`store-cover ${coverUrl ? 'has-cover' : 'no-cover'}`}>
          {coverUrl ? <Image src={coverUrl} alt={`غلاف ${store.name}`} fill priority className="object-cover" sizes="100vw" /> : <div className="store-cover-placeholder"><Store size={64}/></div>}
          <div className="store-cover-shade" />
        </div>
        <div className="site-container store-identity">
          <div className="store-profile-logo">{logoUrl ? <Image src={logoUrl} alt={store.name} width={144} height={144} className="h-full w-full object-cover" priority /> : <Store size={48}/>}</div>
          <div className="store-profile-copy">
            <div className="store-badges"><span><BadgeCheck size={15}/> متجر معتمد</span><span><Tag size={14}/>{store.category?.name || 'متجر'}</span></div>
            <h1>{store.name}</h1>
            <div className="store-quick-meta"><span><MapPin size={16}/>{store.area || 'الزقازيق'}</span>{store.ratingAvg !== undefined && <span><Star size={16}/>{store.ratingAvg.toFixed(1)} <small>({store.ratingCount || 0} تقييم)</small></span>}{store.workingHours && <span><Clock3 size={16}/>{store.workingHours}</span>}</div>
          </div>
          <div className="store-hero-actions">{store.phone && <a href={`tel:${store.phone}`}><Phone size={18}/> اتصال</a>}{store.whatsapp && <a className="is-whatsapp" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> واتساب</a>}</div>
        </div>
      </section>

      <div className="site-container store-profile-content">
        <div className="store-profile-layout">
          <main className="store-profile-main">
            <section className="store-section-card store-about">
              <div className="store-section-heading"><div><ShieldCheck/><span><small>نبذة سريعة</small><h2>عن المتجر</h2></span></div></div>
              <p>اكتشف أحدث عروض {store.name} واستفد من الخصومات المتاحة. يمكنك التواصل مع المتجر مباشرة أو زيارته في {store.area || 'الزقازيق'}.</p>
              {gallery.length > 0 && <div className="store-gallery">{gallery.map((image, index) => <div key={image} className={index === 0 ? 'is-main' : ''}><Image src={image} alt={`${store.name} - صورة ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 40vw" /></div>)}</div>}
            </section>
            <section className="store-offers-section">
              <div className="store-offers-heading"><div><span><Tag size={18}/></span><div><small>وفر أكثر</small><h2>عروض المتجر الحالية</h2></div></div><b>{offers.length} عرض</b></div>
              {offers.length === 0 ? <div className="store-empty-offers"><Tag size={30}/><h3>لا توجد عروض نشطة الآن</h3><p>تابع المتجر وارجع لاحقًا لاكتشاف عروضه الجديدة.</p><Link href="/offers">اكتشف عروضًا أخرى <ArrowLeft size={16}/></Link></div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{offers.map((offer: Offer) => <OfferCard key={offer.id} offer={{ ...offer, images: offer.images || [] }} />)}</div>}
            </section>
          </main>
          <aside className="store-profile-sidebar">
            <section className="store-section-card store-info-card">
              <div className="store-section-heading"><div><MapPin/><span><small>تواصل وزيارة</small><h2>بيانات المتجر</h2></span></div></div>
              <div className="store-info-list"><div><span><MapPin/></span><p><small>العنوان</small><b>{store.address || store.area || 'الزقازيق'}</b></p></div>{store.phone && <a href={`tel:${store.phone}`}><span><Phone/></span><p><small>رقم الهاتف</small><b dir="ltr">{store.phone}</b></p></a>}{store.workingHours && <div><span><Clock3/></span><p><small>مواعيد العمل</small><b>{store.workingHours}</b></p></div>}</div>
              {store.locationUrl && <a className="store-map-button" href={store.locationUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17}/> فتح الموقع على الخريطة <ExternalLink size={14}/></a>}
            </section>
            {(store.facebook || store.instagram) && <section className="store-social-card"><div><Images size={20}/><span><small>تابع الجديد</small><b>حسابات المتجر</b></span></div><div>{store.facebook && <a href={store.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><RiFacebookFill/></a>}{store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><RiInstagramLine/></a>}</div></section>}
          </aside>
        </div>
      </div>
    </div>
  );
}
