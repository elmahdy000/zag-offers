"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveImageUrl } from '@/lib/api';

// --- Types & Constants ---
const API = 'https://api.zagoffers.online/api';
const UPLOADS = 'https://api.zagoffers.online';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  endDate: string;
  featured: boolean;
  store: {
    id: string;
    name: string;
    logo: string;
    area: string;
    categoryId: string;
    category?: { name: string };
  };
}

const CAT_ICONS: Record<string, string> = {
  'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
  'تجميل': '💅', 'دورات': '📚', 'عيادات': '🏥', 'سوبرماركت': '🛒',
  'default': '🏷️'
};

// --- Sub-Components ---

const OfferCard = ({ offer, onClick }: { offer: Offer; onClick: () => void }) => {
  const daysLeft = Math.ceil((new Date(offer.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const icon = CAT_ICONS[offer.store?.category?.name || ''] || CAT_ICONS.default;

  const icon = CAT_ICONS[offer.store?.category?.name || ''] || CAT_ICONS.default;

  return (
    <div className="offer-card-mini" onClick={onClick}>
      <div className="card-image-wrap">
        <div className="discount-tag">{offer.discount}</div>
        {offer.featured && <div className="featured-tag">⭐</div>}
        <div className="card-overlay"></div>
      </div>
      <div className="card-content">
        <div className="card-top">
          <span className="card-cat">{icon} {offer.store?.category?.name}</span>
          <span className={`card-days ${daysLeft <= 3 ? 'urgent' : ''}`}>
            {isExpired ? 'منتهي' : `باقي ${daysLeft} يوم`}
          </span>
        </div>
        <h3 className="card-title">{offer.title}</h3>
        <div className="card-store">
          {offer.store?.logo ? <img src={resolveImageUrl(offer.store.logo)} alt="" className="store-mini-logo" /> : <span className="store-icon">🏪</span>}
          <span className="store-name">{offer.store?.name}</span>
        </div>
        <div className="card-area">📍 {offer.store?.area}</div>
      </div>
    </div>
  );
};

// --- Main Page ---

export default function HomePage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ categoryId: '', area: '', search: '' });
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check Auth on Mount
  useEffect(() => {
    const token = localStorage.getItem('token') || document.cookie.includes('auth');
    setIsLoggedIn(!!token);
  }, []);

  const fetchInitialData = async () => {
    try {
      const catRes = await fetch(`${API}/stores/categories`);
      if (catRes.ok) setCategories(await catRes.json());
    } catch (e) { console.error("Data fetch error", e); }
  };

  const loadOffers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/offers`;
      const params = new URLSearchParams({ limit: '100' });
      
      if (filters.search.trim()) {
        url = `${API}/offers/search`;
        params.set('q', filters.search);
      } else {
        if (filters.categoryId) params.set('categoryId', filters.categoryId);
        if (filters.area) params.set('area', filters.area);
      }

      const res = await fetch(`${url}?${params}`);
      const data = await res.json();
      let items = Array.isArray(data) ? data : (data.items || []);

      // Client-side combined filter if searching
      if (filters.search.trim()) {
        if (filters.categoryId) items = items.filter((o: any) => o.store?.categoryId === filters.categoryId);
        if (filters.area) items = items.filter((o: any) => o.store?.area === filters.area);
      }

      setOffers(items);
    } catch (e) { console.error("Offers load error", e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { loadOffers(); }, [loadOffers]);

  return (
    <div className="page-container" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        :root {
          --primary: #FF6B00;
          --bg: #0F0F0F;
          --surface: #1A1A1A;
          --card: #222222;
          --text: #FFFFFF;
          --text-dim: #A0A0A0;
          --border: rgba(255,255,255,0.08);
          --radius: 12px;
        }

        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font-family: 'Cairo', sans-serif; }

        .navbar { height: 64px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 5%; sticky; top: 0; background: rgba(15,15,15,0.8); backdrop-filter: blur(10px); z-index: 100; }
        .logo { font-size: 20px; font-weight: 800; text-decoration: none; color: white; }
        .logo span { color: var(--primary); }
        .nav-actions { display: flex; gap: 10px; }
        .btn-auth { padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-decoration: none; transition: 0.2s; border: 1px solid var(--border); color: white; }
        .btn-auth.primary { background: var(--primary); border: none; }

        .hero { padding: 40px 5% 20px; text-align: center; }
        .hero h1 { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        .search-bar { max-width: 600px; margin: 20px auto; position: relative; }
        .search-bar input { width: 100%; padding: 12px 20px 12px 45px; background: var(--surface); border: 1px solid var(--border); border-radius: 30px; color: white; outline: none; font-family: inherit; }
        .search-bar input:focus { border-color: var(--primary); }

        .filters-section { padding: 0 5%; margin-bottom: 24px; display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
        .filter-chip { padding: 6px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-dim); }
        .filter-chip.active { background: var(--primary); color: white; border-color: var(--primary); }

        .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 0 5% 40px; }
        
        /* Compact Card Styling */
        .offer-card-mini { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: 0.2s; position: relative; }
        .offer-card-mini:hover { transform: translateY(-3px); border-color: var(--primary); }
        .card-image-wrap { height: 100px; background: linear-gradient(45deg, #1e1e1e, #2a2a2a); position: relative; }
        .discount-tag { position: absolute; top: 8px; right: 8px; background: var(--primary); color: white; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 14px; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .featured-tag { position: absolute; top: 8px; left: 8px; font-size: 12px; z-index: 2; }
        
        .card-content { padding: 12px; }
        .card-top { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 6px; font-weight: 700; }
        .card-cat { color: var(--primary); }
        .card-days.urgent { color: #FF4444; }
        .card-title { font-size: 13px; font-weight: 700; margin: 0 0 8px; line-height: 1.3; height: 34px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .card-store { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .store-mini-logo { width: 18px; height: 18px; border-radius: 4px; object-fit: cover; }
        .store-icon { font-size: 14px; }
        .store-name { font-size: 11px; color: var(--text-dim); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-area { font-size: 10px; color: var(--text-dim); }

        .modal-back { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-box { background: var(--surface); width: 100%; max-width: 400px; border-radius: 20px; padding: 24px; position: relative; border: 1px solid var(--border); }
        .modal-close { position: absolute; top: 15px; left: 15px; background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 20px; }

        .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; padding: 0 5%; }
        .skeleton-card { height: 220px; background: var(--surface); border-radius: var(--radius); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }

        @media (max-width: 500px) {
          .offers-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
          .hero h1 { font-size: 24px; }
        }
      ` }} />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="logo">Zag<span>Offers</span></Link>
        <div className="nav-actions">
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn-auth primary">لوحة التحكم</Link>
          ) : (
            <>
              <Link href="/login" className="btn-auth">دخول</Link>
              <Link href="/login" className="btn-auth primary">انضم مجاناً</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero & Search */}
      <header className="hero">
        <h1>وفّر أكثر مع <span>عروض الزقازيق</span></h1>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="ابحث عن عرض أو محل..." 
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
      </header>

      {/* Filters */}
      <div className="filters-section">
        <button 
          className={`filter-chip ${!filters.categoryId ? 'active' : ''}`}
          onClick={() => setFilters(f => ({ ...f, categoryId: '' }))}
        >الكل</button>
        {categories.map(c => (
          <button 
            key={c.id} 
            className={`filter-chip ${filters.categoryId === c.id ? 'active' : ''}`}
            onClick={() => setFilters(f => ({ ...f, categoryId: c.id }))}
          >
            {CAT_ICONS[c.name] || '🏷️'} {c.name}
          </button>
        ))}
      </div>

      {/* Offers Grid */}
      <main>
        {loading ? (
          <div className="skeleton-grid">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : (
          <div className="offers-grid">
            {offers.map(offer => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                onClick={() => setSelectedOffer(offer)} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Offer Modal */}
      {selectedOffer && (
        <div className="modal-back" onClick={() => setSelectedOffer(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedOffer(null)}>✕</button>
            <h2 style={{ color: 'var(--primary)', margin: '0 0 10px' }}>{selectedOffer.discount} خصم</h2>
            <h3 style={{ margin: '0 0 10px' }}>{selectedOffer.title}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{selectedOffer.description}</p>
            <div style={{ borderTop: '1px solid var(--border)', padding: '15px 0', marginTop: '15px' }}>
              <div style={{ fontWeight: 700 }}>🏠 {selectedOffer.store?.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>📍 {selectedOffer.store?.area}</div>
            </div>
            <button 
              className="btn-auth primary" 
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              onClick={() => router.push('/login')}
            >
              🎟️ الحصول على الكوبون
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
