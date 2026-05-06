"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const API = 'https://api.zagoffers.online/api';
  const UPLOADS = 'https://api.zagoffers.online';
  const PAGE_SIZE = 18;

  // -- State --
  const [allOffers, setAllOffers] = useState<any[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [activeCatId, setActiveCatId] = useState('');
  const [activeArea, setActiveArea] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [offerDetails, setOfferDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [couponCode, setCouponCode] = useState('ZAG-XXXXXX');
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [sortOrder, setSortOrder] = useState('newest');

  // -- Icons Map --
  const catIcons: Record<string, string> = {
    'مطاعم': '🍔', 'كافيهات': '☕', 'ملابس': '👗', 'جيم': '💪',
    'تجميل': '💅', 'دورات': '📚', 'عيادات': '🏥', 'سوبرماركت': '🛒',
    'خدمات سيارات': '🚗', 'خدمات محلية': '🔧', 'default': '🏷️'
  };

  const getCatIcon = (name: string) => catIcons[name] || catIcons['default'];

  // -- Helpers --
  const daysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const logoUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return UPLOADS + (path.startsWith('/') ? '' : '/') + path;
  };

  const showToast = (msg: string, type = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // -- Fetching --
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/stores/categories`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data.items || []));
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchOffers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (activeCatId) params.set('categoryId', activeCatId);
      if (activeArea) params.set('area', activeArea);
      if (searchQ) params.set('search', searchQ);

      const res = await fetch(`${API}/offers?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      setAllOffers(items);
      setPage(1);
    } catch (err) {
      setIsError(true);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCatId, activeArea, searchQ]);

  const fetchOfferDetails = async (id: string) => {
    setIsLoadingDetails(true);
    setCouponCode('ZAG-XXXXXX');
    try {
      const res = await fetch(`${API}/offers/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOfferDetails(data);
    } catch (err) {
      showToast('⚠️ تعذّر تحميل تفاصيل العرض', 'error');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // -- Effects --
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    let sorted = [...allOffers];
    if (sortOrder === 'expiry') {
      sorted.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    } else if (sortOrder === 'discount') {
      sorted.sort((a, b) => {
        const numA = parseInt(a.discount) || 0;
        const numB = parseInt(b.discount) || 0;
        return numB - numA;
      });
    }
    setFilteredOffers(sorted);
  }, [allOffers, sortOrder]);

  useEffect(() => {
    if (selectedOfferId) {
      fetchOfferDetails(selectedOfferId);
    } else {
      setOfferDetails(null);
    }
  }, [selectedOfferId]);

  // -- Event Handlers --
  const handleGetCoupon = () => {
    showToast('🔐 سجّل دخولك أولاً للحصول على كوبون!', 'error');
    let i = 0;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const interval = setInterval(() => {
      setCouponCode('ZAG-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
      if (++i > 12) {
        clearInterval(interval);
        setCouponCode('ZAG-XXXXXX');
      }
    }, 80);
  };

  const resetFilters = () => {
    setActiveCatId('');
    setActiveArea('');
    setSearchQ('');
    setSortOrder('newest');
  };

  // -- Components --
  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton skeleton-img"></div>
      <div className="skeleton-body">
        <div className="skeleton skeleton-line sm"></div>
        <div className="skeleton skeleton-line md"></div>
        <div className="skeleton skeleton-line lg"></div>
        <div className="skeleton skeleton-line sm"></div>
        <div className="skeleton skeleton-btn"></div>
      </div>
    </div>
  );

  return (
    <div className="landing-root" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        
        :root {
          --orange:    #FF6B00;
          --orange-lt: #FF8C35;
          --orange-dk: #D95A00;
          --dark:      #1A1A1A;
          --dark2:     #242424;
          --dark3:     #2E2E2E;
          --green:     #00C853;
          --green-dk:  #00A844;
          --surface:   #1E1E1E;
          --card:      #252525;
          --border:    rgba(255,255,255,0.07);
          --text:      #F0F0F0;
          --text-muted:#9A9A9A;
          --radius:    16px;
          --radius-sm: 10px;
          --shadow:    0 8px 32px rgba(0,0,0,0.45);
          --glow:      0 0 24px rgba(255,107,0,0.25);
        }

        .landing-root {
          background: var(--dark);
          color: var(--text);
          min-height: 100vh;
          font-family: 'Cairo', sans-serif;
        }

        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 4vw, 60px);
          height: 68px;
          background: rgba(26,26,26,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .navbar-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .brand-icon { width: 38px; height: 38px; background: linear-gradient(135deg, var(--orange), var(--orange-dk)); border-radius: 10px; display: grid; place-items: center; font-size: 20px; box-shadow: var(--glow); flex-shrink: 0; }
        .brand-name { font-size: 22px; font-weight: 800; color: var(--text); }
        .brand-name span { color: var(--orange); }

        .navbar-search { flex: 1; max-width: 460px; margin: 0 24px; position: relative; }
        .navbar-search input { width: 100%; padding: 10px 18px 10px 44px; background: var(--dark3); border: 1px solid var(--border); border-radius: 99px; color: var(--text); font-family: inherit; font-size: 14px; outline: none; transition: all .2s; }
        .navbar-search input:focus { border-color: var(--orange); box-shadow: 0 0 0 3px rgba(255,107,0,0.15); }
        .navbar-search .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

        .navbar-actions { display: flex; align-items: center; gap: 12px; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 99px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: all .2s; }
        .btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
        .btn-ghost:hover { color: var(--text); border-color: rgba(255,255,255,0.2); }
        .btn-primary { background: linear-gradient(135deg, var(--orange), var(--orange-dk)); color: #fff; box-shadow: 0 4px 14px rgba(255,107,0,0.35); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,107,0,0.45); }

        .hero { position: relative; text-align: center; padding: 72px clamp(16px, 4vw, 60px) 60px; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 700px 400px at 50% -80px, rgba(255,107,0,0.18) 0%, transparent 70%), radial-gradient(ellipse 400px 300px at 20% 100%, rgba(0,200,83,0.08) 0%, transparent 60%); pointer-events: none; }
        .hero h1 { font-size: clamp(32px, 5vw, 58px); font-weight: 900; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.5px; }
        .hero h1 span { color: var(--orange); }
        .hero p { font-size: clamp(15px, 1.8vw, 18px); color: var(--text-muted); max-width: 520px; margin: 0 auto 36px; line-height: 1.7; }

        .hero-search { display: flex; align-items: center; max-width: 620px; margin: 0 auto 20px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 6px 6px 6px 16px; gap: 8px; box-shadow: var(--shadow); transition: all .2s; }
        .hero-search:focus-within { border-color: var(--orange); box-shadow: var(--glow), var(--shadow); }
        .hero-search input { flex: 1; background: transparent; border: none; outline: none; color: var(--text); font-family: inherit; font-size: 15px; }
        .hero-search .search-btn { padding: 10px 22px; background: linear-gradient(135deg, var(--orange), var(--orange-dk)); border: none; border-radius: 10px; color: #fff; font-weight: 700; cursor: pointer; transition: all .2s; white-space: nowrap; }

        .hero-stats { display: flex; justify-content: center; gap: clamp(20px, 4vw, 48px); flex-wrap: wrap; margin-top: 32px; }
        .hero-stat .number { font-size: clamp(22px, 3vw, 30px); font-weight: 900; color: var(--orange); }
        .hero-stat .label { font-size: 13px; color: var(--text-muted); margin-top: 2px; }

        .section-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 0 clamp(16px, 4vw, 60px); }

        .filters-wrap { padding: 28px clamp(16px, 4vw, 60px) 0; display: flex; flex-direction: column; gap: 16px; }
        .filters-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .filter-label { font-size: 13px; color: var(--text-muted); font-weight: 600; white-space: nowrap; }
        .categories-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; flex: 1; scrollbar-width: none; }
        .categories-scroll::-webkit-scrollbar { display: none; }
        .cat-chip { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--card); border: 1px solid var(--border); border-radius: 99px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; white-space: nowrap; transition: all .2s; flex-shrink: 0; }
        .cat-chip:hover { border-color: var(--orange); color: var(--orange); }
        .cat-chip.active { background: var(--orange); border-color: var(--orange); color: #fff; box-shadow: 0 4px 12px rgba(255,107,0,0.35); }

        .select-filter { padding: 9px 16px 9px 32px; background: var(--card); border: 1px solid var(--border); border-radius: 99px; color: var(--text); font-size: 13px; font-weight: 600; cursor: pointer; outline: none; transition: border-color .2s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239A9A9A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: left 10px center; }
        .results-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .results-count { font-size: 14px; color: var(--text-muted); }
        .results-count strong { color: var(--text); font-weight: 700; }

        .offers-section { padding: 24px clamp(16px, 4vw, 60px) 60px; }
        .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 20px; }

        .offer-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: all .25s; position: relative; display: flex; flex-direction: column; }
        .offer-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.5); border-color: rgba(255,107,0,0.3); }
        .offer-card-header { position: relative; height: 160px; background: linear-gradient(135deg, var(--dark3), var(--dark2)); overflow: hidden; }
        .offer-card-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #2a1a00, #1a2a00, #001a2a); opacity: 0.6; }
        .discount-badge { position: absolute; top: 14px; right: 14px; background: linear-gradient(135deg, var(--orange), var(--orange-dk)); color: #fff; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px; box-shadow: 0 4px 16px rgba(255,107,0,0.5); z-index: 2; }
        .featured-badge { position: absolute; top: 14px; left: 14px; background: linear-gradient(135deg, #FFD700, #FFA500); color: #1a1a1a; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 99px; z-index: 2; }
        .store-logo-wrap { position: absolute; bottom: -22px; right: 16px; z-index: 3; }
        .store-logo { width: 48px; height: 48px; border-radius: 12px; border: 3px solid var(--card); background: var(--dark3); object-fit: cover; display: block; }
        .store-logo-placeholder { width: 48px; height: 48px; border-radius: 12px; border: 3px solid var(--card); background: linear-gradient(135deg, var(--dark3), #3a3a3a); display: grid; place-items: center; font-size: 22px; }

        .offer-card-body { padding: 28px 16px 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .offer-category { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: var(--orange); text-transform: uppercase; letter-spacing: 0.5px; }
        .offer-title { font-size: 16px; font-weight: 700; color: var(--text); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .offer-store { font-size: 13px; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .offer-meta { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 6px; }
        .meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-muted); }
        .expiry-soon { color: #FF6B6B !important; }
        .get-coupon-btn { width: 100%; padding: 11px; background: linear-gradient(135deg, rgba(255,107,0,0.12), rgba(255,107,0,0.06)); border: 1px solid rgba(255,107,0,0.25); border-radius: 10px; color: var(--orange); font-size: 13px; font-weight: 700; cursor: pointer; transition: all .2s; margin-top: 10px; text-align: center; }
        .get-coupon-btn:hover { background: linear-gradient(135deg, var(--orange), var(--orange-dk)); color: #fff; border-color: var(--orange); box-shadow: 0 4px 14px rgba(255,107,0,0.4); }

        .skeleton { background: linear-gradient(90deg, var(--dark3) 25%, #363636 50%, var(--dark3) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skeleton-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .skeleton-img { height: 160px; border-radius: 0; }
        .skeleton-body { padding: 32px 16px 16px; display: flex; flex-direction: column; gap: 12px; }
        .skeleton-line { height: 14px; }
        .skeleton-line.sm { width: 40%; }
        .skeleton-line.md { width: 70%; }
        .skeleton-line.lg { width: 90%; }
        .skeleton-btn { height: 40px; margin-top: 12px; border-radius: 10px; }

        .state-container { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; gap: 16px; }
        .state-icon { width: 80px; height: 80px; background: var(--dark3); border-radius: 50%; display: grid; place-items: center; font-size: 36px; }
        .state-title { font-size: 20px; font-weight: 700; color: var(--text); }
        .state-msg { font-size: 14px; color: var(--text-muted); max-width: 320px; line-height: 1.6; }
        .state-action { padding: 10px 24px; background: linear-gradient(135deg, var(--orange), var(--orange-dk)); color: #fff; border: none; border-radius: 99px; font-weight: 700; cursor: pointer; transition: all .2s; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; pointer-events: none; transition: opacity .25s; }
        .modal-overlay.open { opacity: 1; pointer-events: all; }
        .modal { background: var(--card); border: 1px solid var(--border); border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 32px; position: relative; transform: translateY(20px); transition: transform .25s; }
        .modal-overlay.open .modal { transform: translateY(0); }
        .modal-close { position: absolute; top: 16px; left: 16px; width: 32px; height: 32px; background: var(--dark3); border: none; border-radius: 50%; color: var(--text-muted); cursor: pointer; display: grid; place-items: center; transition: all .2s; }

        .modal-discount { font-size: 48px; font-weight: 900; color: var(--orange); text-align: center; margin-bottom: 8px; }
        .modal-title { font-size: 22px; font-weight: 800; text-align: center; margin-bottom: 6px; }
        .modal-store { text-align: center; color: var(--text-muted); font-size: 14px; margin-bottom: 20px; }
        .modal-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .modal-info-item { background: var(--dark3); border-radius: 12px; padding: 14px; }
        .modal-info-label { font-size: 11px; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
        .modal-info-value { font-size: 15px; font-weight: 700; color: var(--text); }

        .coupon-code-box { background: rgba(0,200,83,0.08); border: 2px dashed rgba(0,200,83,0.4); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 16px; }
        .coupon-code { font-size: 26px; font-weight: 900; letter-spacing: 4px; color: var(--green); font-family: monospace; }
        .modal-cta { width: 100%; padding: 14px; background: linear-gradient(135deg, var(--green), var(--green-dk)); border: none; border-radius: 12px; color: #fff; font-weight: 700; cursor: pointer; transition: all .2s; box-shadow: 0 4px 16px rgba(0,200,83,0.35); }

        .toast-container { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 999; display: flex; flex-direction: column; gap: 8px; }
        .toast { background: var(--dark2); border: 1px solid var(--border); border-radius: 12px; padding: 12px 20px; font-size: 14px; font-weight: 600; color: var(--text); box-shadow: var(--shadow); }
        .toast.error { border-color: rgba(255,107,107,0.4); color: #FF6B6B; }

        .footer { border-top: 1px solid var(--border); padding: 32px clamp(16px, 4vw, 60px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer-brand { font-size: 18px; font-weight: 800; }
        .footer-brand span { color: var(--orange); }
        .footer-copy { font-size: 12px; color: var(--text-muted); }

        @media (max-width: 640px) {
          .navbar-search { display: none; }
          .hero h1 { font-size: 28px; }
          .hero { padding: 48px 16px 40px; }
          .navbar-actions .btn-ghost { display: none; }
        }
      ` }} />

      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">
          <div className="brand-icon">🏷️</div>
          <span className="brand-name">Zag<span>Offers</span></span>
        </Link>
        <div className="navbar-search">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="ابحث عن عروض، متاجر، فئات…" 
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div className="navbar-actions">
          <Link href="/login" className="btn btn-ghost">تسجيل الدخول</Link>
          <button className="btn btn-primary">🔔 اشتراك مجاني</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg"></div>
        <h1>اكتشف أفضل <span>العروض والخصومات</span><br />في مدينتك</h1>
        <p>وفّر أكثر مع كوبونات حصرية من أفضل المحلات والمطاعم والخدمات في الزقازيق</p>
        <div className="hero-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="ابحث عن مطعم، جيم، ملابس…" 
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <button className="search-btn" onClick={fetchOffers}>🔍 بحث</button>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="number">{allOffers.length || '...'}</div><div className="label">عرض نشط</div></div>
          <div className="hero-stat"><div className="number">{new Set(allOffers.map(o => o.store?.id)).size || '...'}</div><div className="label">متجر معتمد</div></div>
          <div className="hero-stat"><div className="number">{categories.length || '...'}</div><div className="label">فئة متنوعة</div></div>
        </div>
      </section>

      <div className="section-divider"></div>

      {/* Filters */}
      <div className="filters-wrap">
        <div className="filters-row">
          <span className="filter-label">📂 الفئة:</span>
          <div className="categories-scroll">
            <button 
              className={`cat-chip ${activeCatId === '' ? 'active' : ''}`}
              onClick={() => setActiveCatId('')}
            >🌟 الكل</button>
            {categories.map(c => (
              <button 
                key={c.id}
                className={`cat-chip ${activeCatId === c.id ? 'active' : ''}`}
                onClick={() => setActiveCatId(c.id)}
              >
                {getCatIcon(c.name)} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="filters-row">
          <span className="filter-label">📍 المنطقة:</span>
          <select 
            className="select-filter" 
            value={activeArea}
            onChange={(e) => setActiveArea(e.target.value)}
          >
            <option value="">كل المناطق</option>
            <option value="جامعة">منطقة الجامعة</option>
            <option value="القومية">القومية</option>
            <option value="وسط البلد">وسط البلد</option>
            <option value="المحافظة">المحافظة</option>
            <option value="طلبة عويضة">طلبة عويضة</option>
            <option value="منطقة الفيلات">منطقة الفيلات</option>
          </select>

          <select 
            className="select-filter" 
            style={{ marginRight: 'auto' }}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">الأحدث أولاً</option>
            <option value="expiry">ينتهي قريباً</option>
            <option value="discount">أعلى خصم</option>
          </select>
        </div>

        <div className="results-bar">
          <div className="results-count">
            {isLoading ? 'جاري التحميل…' : `عرض <strong>${Math.min(page * PAGE_SIZE, filteredOffers.length)}</strong> من أصل <strong>${filteredOffers.length}</strong> عرض`}
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <section className="offers-section">
        <div className="offers-grid">
          {isLoading && page === 1 ? (
            Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <div className="state-container">
              <div className="state-icon">⚠️</div>
              <div className="state-title">تعذّر الاتصال بالسيرفر</div>
              <button className="state-action" onClick={fetchOffers}>🔄 إعادة المحاولة</button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="state-container">
              <div className="state-icon">🔍</div>
              <div className="state-title">لا توجد عروض متطابقة</div>
              <button className="state-action" onClick={resetFilters}>🔄 إعادة ضبط الفلاتر</button>
            </div>
          ) : (
            filteredOffers.slice(0, page * PAGE_SIZE).map((offer) => {
              const days = daysLeft(offer.endDate);
              const isExpirySoon = days <= 3;
              const cat = offer.store?.category?.name || '';
              
              return (
                <div key={offer.id} className="offer-card" onClick={() => setSelectedOfferId(offer.id)}>
                  <div className="offer-card-header">
                    <div className="offer-card-bg"></div>
                    {offer.featured && <span className="featured-badge">⭐ مميز</span>}
                    <div className="discount-badge">{offer.discount}</div>
                    <div className="store-logo-wrap">
                      {offer.store?.logo ? (
                        <img className="store-logo" src={logoUrl(offer.store.logo)!} alt={offer.store.name} />
                      ) : (
                        <div className="store-logo-placeholder">{getCatIcon(cat)}</div>
                      )}
                    </div>
                  </div>
                  <div className="offer-card-body">
                    <div className="offer-category">{getCatIcon(cat)} {cat}</div>
                    <div className="offer-title">{offer.title}</div>
                    <div className="offer-store">🏪 {offer.store?.name}</div>
                    <div className="offer-meta">
                      <div className="meta-item">📍 {offer.store?.area}</div>
                      <div className={`meta-item ${isExpirySoon ? 'expiry-soon' : ''}`}>
                        {days <= 0 ? '⚠️ انتهى' : `📅 ${formatDate(offer.endDate)}`}
                      </div>
                    </div>
                    <button className="get-coupon-btn">🎟️ احصل على الكوبون</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!isLoading && filteredOffers.length > page * PAGE_SIZE && (
          <div className="load-more-wrap">
            <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>تحميل المزيد</button>
          </div>
        )}
      </section>

      {/* Modal */}
      <div 
        className={`modal-overlay ${selectedOfferId ? 'open' : ''}`} 
        onClick={(e) => e.target === e.currentTarget && setSelectedOfferId(null)}
      >
        <div className="modal">
          <button className="modal-close" onClick={() => setSelectedOfferId(null)}>✕</button>
          {isLoadingDetails ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>⏳ جاري التحميل…</div>
          ) : offerDetails && (
            <>
              <div className="modal-discount">{offerDetails.discount}</div>
              <div className="modal-title">{offerDetails.title}</div>
              <div className="modal-store">{offerDetails.store?.name} · {offerDetails.store?.area}</div>
              <div className="modal-divider" style={{ height: '1px', background: 'var(--border)', margin: '20px 0' }}></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', marginBottom: '16px' }}>{offerDetails.description}</p>
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <div className="modal-info-label">📂 الفئة</div>
                  <div className="modal-info-value">{getCatIcon(offerDetails.store?.category?.name)} {offerDetails.store?.category?.name}</div>
                </div>
                <div className="modal-info-item">
                  <div className="modal-info-label">📍 المنطقة</div>
                  <div className="modal-info-value">{offerDetails.store?.area}</div>
                </div>
              </div>
              <div className="coupon-code-box">
                <div style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 700, marginBottom: '8px' }}>🎟️ كود الكوبون</div>
                <div className="coupon-code">{couponCode}</div>
              </div>
              <button className="modal-cta" onClick={handleGetCoupon}>✅ توليد كوبوني الآن</button>
            </>
          )}
        </div>
      </div>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>

      <footer className="footer">
        <div className="footer-brand">Zag<span>Offers</span></div>
        <div className="footer-copy">© 2026 ZagOffers — عروض الزقازيق. جميع الحقوق محفوظة.</div>
      </footer>
    </div>
  );
}
