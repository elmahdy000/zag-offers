'use client';
import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, ChevronRight, MessageSquare, Tag, RefreshCw } from 'lucide-react';
import { getCookie } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifs = async () => {
    const token = getCookie('auth_token');
    if (!token) {
      setError('انتهت جلسة الدخول. سجّل الدخول مرة أخرى.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Notifications request failed: ${res.status}`);
      const data: unknown = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('فشل تحميل التنبيهات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchNotifs(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const markAllRead = async () => {
    try {
      const token = getCookie('auth_token');
      if (token) {
        const response = await fetch(`${API_URL}/api/notifications/read-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Mark read failed: ${response.status}`);
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
      setError('تعذر تحديث التنبيهات. حاول مرة أخرى.');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'COUPON_GENERATED': return <Tag size={18} className="text-primary" />;
      case 'OFFER_APPROVED': return <CheckCircle2 size={18} className="text-secondary" />;
      case 'OFFER_REJECTED': return <XCircle size={18} className="text-red-500" />;
      default: return <Bell size={18} className="text-text-dim" />;
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-4 sm:p-8 dir-rtl max-w-4xl mx-auto">
        <EmptyState
          icon={<Bell size={28} />}
          title="تعذر تحميل التنبيهات"
          description={error}
          actionText="إعادة المحاولة"
          actionIcon={<RefreshCw size={16} />}
          onAction={fetchNotifs}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 dir-rtl max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">التنبيهات</h1>
          <p className="text-text-dim mt-2 font-bold text-xs">سجل بآخر التفاعلات والعمليات في متجرك</p>
        </div>
        <button 
          onClick={markAllRead}
           className="text-[11px] font-black text-text-dim bg-glass-heavy px-4 py-2 rounded-xl hover:bg-card transition-all border border-glass-border"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title="كل شيء هادئ حتى الآن"
            description="ستظهر هنا الموافقات على العروض وطلبات الكوبونات وأهم تحديثات متجرك."
            actionText="تحديث التنبيهات"
            actionIcon={<RefreshCw size={16} />}
            onAction={fetchNotifs}
          />
        ) : (
          <AnimatePresence>
            {notifications.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass p-5 rounded-[1.8rem] border flex items-center gap-5 transition-all group ${
                  n.isRead ? 'bg-glass border-glass-border' : 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                  'bg-glass-heavy border-glass-border'
                }`}>
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-text truncate">{n.title}</h3>
                    <span className="text-[10px] font-bold text-text-dimmer flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(n.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-text-dim line-clamp-1">{n.body}</p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={18} className="text-text-dimmer rotate-180" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Quick Help Footer */}
      <div className="mt-12 p-6 glass rounded-[2.5rem] border border-glass-border bg-gradient-to-br from-primary/5 to-transparent flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
               <MessageSquare size={18} />
            </div>
            <div>
               <p className="text-xs font-black text-text">هل واجهت مشكلة؟</p>
               <p className="text-[10px] font-bold text-text-dim">تواصل مع الدعم الفني لطلب المساعدة</p>
            </div>
         </div>
         <a href="https://wa.me/201091428238" target="_blank" rel="noreferrer" className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-primary-lt transition-all">تواصل الآن</a>
      </div>
    </div>
  );
}
