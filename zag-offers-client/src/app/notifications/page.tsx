"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, ArrowLeft, Trash2, Tag, Store, Ticket, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/constants';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  data?: any;
}

function getNotifIcon(type?: string) {
  switch (type) {
    case 'NEW_OFFER':
    case 'OFFER_APPROVED':
      return <Tag size={20} className="text-orange-500" />;
    case 'STORE_APPROVED':
      return <Store size={20} className="text-blue-500" />;
    case 'COUPON_REDEEMED':
    case 'COUPON_GENERATED':
    case 'COUPON_UPDATE':
      return <Ticket size={20} className="text-green-500" />;
    default:
      return <Bell size={20} className="text-gray-500" />;
  }
}

function getNotifRoute(n: Notification): string {
  let d = n.data || {};
  if (typeof d === 'string') {
    try { d = JSON.parse(d); } catch { d = {}; }
  }
  
  switch (n.type) {
    case 'NEW_OFFER':
    case 'OFFER_APPROVED':
      return d.offerId ? `/offers/${d.offerId}` : '/offers';
    case 'STORE_APPROVED':
      return d.storeId ? `/stores/${d.storeId}` : '/stores';
    case 'COUPON_REDEEMED':
    case 'COUPON_UPDATE':
    case 'COUPON_GENERATED':
      return '/coupons';
    default:
      return '/';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const handleNotifClick = async (notif: Notification) => {
    // 1. Mark as read on server
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    
    // 2. Determine route
    const route = getNotifRoute(notif);
    
    // 3. Move to target
    router.push(route);
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* silent */ }
  };

  const deleteSelected = async () => {
    const token = localStorage.getItem('token');
    if (!token || selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`${API_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
      setSelectedIds(new Set());
    } catch { /* silent */ }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-[80vh]" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#FF6B00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
              <Bell className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-black">الإشعارات</h1>
          </div>
          <p className="text-white/40 text-sm font-bold mr-1">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار جديد يحتاج انتباهك` : 'أنت مطلع على كل شيء! لا توجد إشعارات جديدة'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-5 py-2.5 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 rounded-2xl text-xs font-black hover:bg-[#FF6B00] hover:text-white transition-all flex items-center gap-2"
            >
              <CheckCheck size={16} />
              قراءة الكل
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={deleteSelected}
              className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-xs font-black hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Trash2 size={16} />
              حذف المحدد ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 glass rounded-[3rem] border border-white/5 shadow-2xl"
        >
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="text-white/10" size={48} />
          </div>
          <h3 className="text-2xl font-black mb-3">صندوق الوارد فارغ</h3>
          <p className="text-white/40 text-sm font-bold mb-10 max-w-xs mx-auto">عندما تتلقى عروضاً جديدة أو تحديثات على كوبوناتك، ستظهر هنا</p>
          <Link href="/" className="px-10 py-4 bg-[#FF6B00] text-white font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-105 active:scale-95 transition-all inline-block">
            تصفح العروض الحالية
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleNotifClick(notif)}
                className={`group relative glass rounded-[2rem] p-6 border transition-all cursor-pointer hover:border-[#FF6B00]/40 ${
                  !notif.isRead ? 'border-[#FF6B00]/20 bg-[#FF6B00]/5' : 'border-white/5 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-start gap-5">
                  {/* Custom Checkbox */}
                  <div 
                    onClick={(e) => toggleSelect(e, notif.id)}
                    className={`mt-1.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      selectedIds.has(notif.id) 
                        ? 'bg-[#FF6B00] border-[#FF6B00] text-white' 
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {selectedIds.has(notif.id) && <CheckCheck size={14} />}
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {getNotifIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-black text-base leading-tight ${!notif.isRead ? 'text-white' : 'text-white/60'}`}>
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse shadow-[0_0_10px_#FF6B00]" />
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed line-clamp-2 font-bold ${!notif.isRead ? 'text-white/70' : 'text-white/30'}`}>
                          {notif.body}
                        </p>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4 text-[11px] font-black">
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Clock size={14} />
                          {new Date(notif.createdAt).toLocaleString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {!notif.isRead && (
                          <div className="text-[#FF6B00] flex items-center gap-1">
                             <CheckCircle2 size={12} />
                             جديد
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => deleteNotification(e, notif.id)}
                          className="w-9 h-9 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-white/5 text-white/20 flex items-center justify-center group-hover:text-[#FF6B00] transition-all">
                          <ArrowLeft size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
