'use client';
import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, XCircle, Clock, Trash2, ChevronRight, MessageSquare, Tag } from 'lucide-react';
import { getCookie } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton } from '@/components/Skeleton';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.zagoffers.online').replace(/\/$/, '');

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    const token = getCookie('auth_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAllRead = async () => {
    try {
      const token = getCookie('auth_token');
      if (token) {
        await fetch(`${API_URL}/api/notifications/read-all`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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

  return (
    <div className="p-4 sm:p-8 dir-rtl max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight">التنبيهات</h1>
          <p className="text-text-dim mt-2 font-bold text-xs">سجل بآخر التفاعلات والعمليات في متجرك</p>
        </div>
        <button 
          onClick={markAllRead}
          className="text-[11px] font-black text-text-dim bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition-all border border-white/5"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="py-24 glass rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40">
            <Bell size={48} className="mb-4" />
            <p className="text-sm font-bold">لا توجد تنبيهات حالياً</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`glass p-5 rounded-[1.8rem] border flex items-center gap-5 transition-all group ${
                  n.isRead ? 'bg-white/[0.01] border-white/5' : 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                  n.isRead ? 'bg-white/5 border-white/5' : 'bg-white/10 border-white/10'
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
      <div className="mt-12 p-6 glass rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-primary/5 to-transparent flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
               <MessageSquare size={18} />
            </div>
            <div>
               <p className="text-xs font-black text-text">هل واجهت مشكلة؟</p>
               <p className="text-[10px] font-bold text-text-dim">تواصل مع الدعم الفني لطلب المساعدة</p>
            </div>
         </div>
         <a href="https://wa.me/201091428238" target="_blank" className="bg-white text-bg px-4 py-2 rounded-xl text-[10px] font-black hover:bg-primary hover:text-white transition-all">تواصل الآن</a>
      </div>
    </div>
  );
}
