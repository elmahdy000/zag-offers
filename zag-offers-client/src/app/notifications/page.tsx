"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, ArrowLeft, Trash2, Tag, Store, Ticket, Clock } from 'lucide-react';
import Link from 'next/link';
import { API_URL } from '@/lib/constants';

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
  data?: {
    offerId?: string;
    storeId?: string;
    couponId?: string;
  };
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
      return <Ticket size={20} className="text-green-500" />;
    default:
      return <Bell size={20} className="text-gray-500" />;
  }
}

function getNotifRoute(n: Notification): string {
  const d = n.data || {};
  switch (n.type) {
    case 'NEW_OFFER':
    case 'OFFER_APPROVED':
      return d.offerId ? `/offers/${d.offerId}` : '/offers';
    case 'STORE_APPROVED':
      return d.storeId ? `/stores/${d.storeId}` : '/stores';
    case 'COUPON_REDEEMED':
      return '/profile/coupons';
    default:
      return '/';
  }
}

export default function NotificationsPage() {
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
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  };

  const deleteNotification = async (id: string) => {
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
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id =>
          fetch(`${API_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );

      // Only remove IDs whose request succeeded
      const successfulIds = new Set(
        Array.from(selectedIds).filter((_, i) => results[i].status === 'fulfilled')
      );
      setNotifications(prev => prev.filter(n => !successfulIds.has(n.id)));
      setSelectedIds(new Set());
    } catch { /* silent */ }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black mb-2">الإشعارات</h1>
          <p className="text-white/40 text-sm font-bold">
            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 rounded-xl text-xs font-black hover:bg-[#FF6B00] hover:text-white transition-all"
            >
              <CheckCheck size={16} className="inline ml-1" />
              قراءة الكل
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={deleteSelected}
              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-black hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={16} className="inline ml-1" />
              حذف المحدد ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 glass rounded-[32px]">
          <Bell className="mx-auto text-white/10 mb-4" size={64} />
          <h3 className="text-xl font-black mb-2">لا توجد إشعارات</h3>
          <p className="text-white/40 text-sm font-bold mb-8">لم تتلقَ أي إشعارات حتى الآن</p>
          <Link href="/" className="px-8 py-3 bg-[#FF6B00] text-white font-black rounded-full shadow-lg">
            تصفح العروض
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`glass rounded-2xl p-5 border transition-all ${
                !notif.isRead ? 'border-[#FF6B00]/30 bg-[#FF6B00]/5' : 'border-white/5'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(notif.id)}
                  onChange={() => toggleSelect(notif.id)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 checked:bg-[#FF6B00] checked:border-[#FF6B00]"
                />

                {/* Icon */}
                <div className="mt-1 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={`font-black text-sm mb-1 ${!notif.isRead ? 'text-white' : 'text-white/60'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-[10px] text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-1 rounded-md font-black hover:bg-[#FF6B00] hover:text-white transition-all"
                      >
                        تحديد كمقروء
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[10px] text-white/30 font-black">
                      <Clock size={12} />
                      {new Date(notif.createdAt).toLocaleString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      {notif.data?.offerId && (
                        <Link
                          href={getNotifRoute(notif)}
                          onClick={() => !notif.isRead && markAsRead(notif.id)}
                          className="text-[10px] text-[#FF6B00] font-black hover:underline"
                        >
                          عرض العرض
                        </Link>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-white/30 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
