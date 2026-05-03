'use client';

import { useState } from 'react';
import {
  Loader2,
  Megaphone,
  Send,
  AlertCircle,
  MapPin,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

export default function BroadcastPage() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [area, setArea] = useState('');

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; area?: string }) => 
      adminApi().post('/admin/broadcast', payload),
    onSuccess: () => {
      showToast('تم إرسال التنبيه العام بنجاح لجميع المستخدمين');
      setTitle('');
      setBody('');
      setArea('');
    },
    onError: () => {
      showToast('حدث خطأ أثناء إرسال التنبيه، يرجى المحاولة لاحقاً', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    broadcastMutation.mutate({ title, body, area: area || undefined });
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <PageHeader 
        title="التنبيهات العامة" 
        description="إرسال إشعارات فورية وتنبيهات لكافة مستخدمي المنصة أو لمناطق محددة" 
        icon={Megaphone}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
               <Send size={18} className="text-orange-600" /> تفاصيل التنبيه
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">عنوان التنبيه</label>
                <div className="relative">
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثلاً: تحديث جديد للمنصة، أو عرض حصري..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-11 pl-4 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">محتوى الرسالة</label>
                <div className="relative">
                  <MessageSquare className="absolute right-4 top-4 text-slate-300" size={16} />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="اكتب تفاصيل التنبيه بوضوح هنا..."
                    className="w-full min-h-[160px] rounded-xl border border-slate-200 bg-slate-50/50 pr-11 pl-4 py-4 text-sm font-medium focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-1">استهداف منطقة محددة (اختياري)</label>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="مثلاً: الزقازيق، القومية... (اتركه فارغاً للكل)"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 pr-11 pl-4 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="w-full h-14 rounded-xl bg-slate-900 text-white font-bold text-base shadow-lg shadow-slate-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 mt-4"
              >
                {broadcastMutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <Megaphone size={20} />}
                إرسال التنبيه الآن
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-6 flex gap-4">
             <AlertCircle className="text-amber-600 shrink-0" size={20} />
             <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900 leading-none">ملاحظة هامة</p>
                <p className="text-xs font-medium text-amber-700 leading-relaxed">بمجرد الضغط على إرسال، سيتم بث التنبيه فوراً عبر Push Notifications لجميع المستخدمين المستهدفين. يرجى مراجعة المحتوى بعناية.</p>
             </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
           <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-inner flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-full max-w-xs bg-white rounded-[32px] border-[6px] border-slate-900 p-4 shadow-2xl aspect-[9/18] relative">
                 {/* Notification Mockup */}
                 <div className="absolute top-20 left-4 right-4 animate-bounce">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/20">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="h-6 w-6 rounded-md bg-orange-600 flex items-center justify-center text-[10px] font-bold text-white">Z</div>
                          <p className="text-[10px] font-bold text-slate-400 flex-1 uppercase tracking-wider">Zag Offers</p>
                          <p className="text-[10px] font-medium text-slate-400">الآن</p>
                       </div>
                       <h4 className="text-xs font-bold text-slate-900 truncate">{title || 'عنوان التنبيه يظهر هنا'}</h4>
                       <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-2 leading-relaxed">{body || 'محتوى الرسالة سيظهر هنا بشكل منسق وجذاب للعميل...'}</p>
                    </div>
                 </div>

                 {/* Phone decoration */}
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-20 rounded-full bg-slate-900" />
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-1 w-24 rounded-full bg-slate-200" />
              </div>
              <p className="mt-8 text-sm font-bold text-slate-400 flex items-center gap-2">
                 <Info size={16} /> معاينة شكل التنبيه على الهاتف
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
