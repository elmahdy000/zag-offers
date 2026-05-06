'use client';

import { useState } from 'react';
import {
  Megaphone,
  Loader2,
  Send,
  MapPin,
  Image as ImageIcon,
  Type,
  AlignLeft,
  Smartphone,
  Eye,
  CheckCircle2,
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
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const broadcastMutation = useMutation({
    mutationFn: (payload: { title: string; body: string; area?: string; imageUrl?: string }) =>
      adminApi().post('/admin/broadcast', payload),
    onSuccess: () => {
      showToast('تم إرسال الإشعار الجماعي لجميع المستخدمين بنجاح', 'success');
      setTitle('');
      setBody('');
      setArea('');
      setImageUrl('');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل إرسال الإشعار الجماعي', 'error');
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/\/(jpg|jpeg|png|webp)$/)) {
      showToast('عفواً، مسموح فقط بصور من نوع JPG أو PNG أو WebP', 'error');
      return;
    }

    // Validate file size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await adminApi().post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const relativeUrl = response.data.url;
      // Convert relative URL to absolute if needed, or assume backend handles it.
      // Usually, we want the full URL for FCM.
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
      setImageUrl(baseUrl + relativeUrl);
      showToast('تم رفع الصورة بنجاح');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل رفع الصورة', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('يرجى ملء عنوان ومحتوى الإشعار', 'error');
      return;
    }
    broadcastMutation.mutate({ title, body, area: area || undefined, imageUrl: imageUrl || undefined });
  };

  return (
    <div className="p-6 lg:p-10 space-y-10">
      <PageHeader
        title="إرسال تنبيهات عامة"
        description="تواصل مباشرة مع كافة مستخدمي المنصة عبر إشعارات فورية للجوال"
        icon={Megaphone}
      />

      <div className="grid gap-10 lg:grid-cols-2 max-w-6xl">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
               <Send size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">تفاصيل الإشعار</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                <Type size={12} className="text-orange-500" /> عنوان الإشعار
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: خصومات حصرية في القومية!"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                <AlignLeft size={12} className="text-orange-500" /> محتوى الرسالة
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب تفاصيل الإشعار هنا..."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-sm resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                <MapPin size={12} className="text-orange-500" /> المنطقة (اختياري)
              </label>
              <input
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="اتركه فارغاً للإرسال لجميع المستخدمين"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
                <ImageIcon size={12} className="text-orange-500" /> صورة الإشعار
              </label>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative group h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all overflow-hidden">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-orange-600" size={24} />
                  ) : imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Uploaded" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">تغيير الصورة</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={24} className="text-slate-300 group-hover:text-orange-400" />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-600">رفع صورة من الجهاز</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="أو ضع رابط صورة هنا..."
                      className="h-32 w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-[11px] font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all shadow-sm resize-none"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-tighter">URL</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200 group"
              >
                {broadcastMutation.isPending ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Megaphone size={24} className="group-hover:scale-110 transition-transform" />
                    بث الإشعار الآن
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                تحذير: سيتم إرسال هذا الإشعار فوراً لجميع المستخدمين المسجلين
              </p>
            </div>
          </form>
        </motion.div>

        {/* Preview Section */}
        <div className="space-y-8">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <Eye size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">معاينة مباشرة</h2>
           </div>

           {/* Mobile Phone Mockup */}
           <div className="relative mx-auto w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl p-4 overflow-hidden">
              {/* Speaker & Sensor */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20 flex items-center justify-center gap-2">
                 <div className="w-10 h-1 bg-slate-700 rounded-full" />
                 <div className="w-2 h-2 bg-slate-700 rounded-full" />
              </div>

              {/* Wallpaper / Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 opacity-90" />

              {/* Status Bar */}
              <div className="relative z-10 flex justify-between px-6 pt-4 text-white/90 font-bold text-[10px]">
                 <span>9:41</span>
                 <div className="flex gap-1.5 items-center">
                    <Smartphone size={10} />
                    <div className="w-4 h-2 rounded-sm border border-white/40" />
                 </div>
              </div>

              {/* Notifications Container */}
              <div className="relative z-10 mt-12 px-3 space-y-3">
                 <AnimatePresence>
                   {(title || body) && (
                     <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/20"
                     >
                        <div className="flex items-start gap-3">
                           <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                              <LayoutGrid size={20} className="text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                 <span className="text-[10px] font-black text-orange-600 uppercase tracking-tight">Zag Offers</span>
                                 <span className="text-[9px] text-slate-400 font-bold">الآن</span>
                              </div>
                              <h4 className="text-xs font-black text-slate-900 truncate leading-tight">{title || 'عنوان الإشعار يظهر هنا'}</h4>
                              <p className="mt-1 text-[11px] text-slate-600 font-bold line-clamp-2 leading-snug">{body || 'محتوى الرسالة الذي سيصل للمستخدمين سيظهر هنا بالكامل...'}</p>
                           </div>
                        </div>
                        {imageUrl && (
                          <div className="mt-3 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                            <img src={imageUrl} alt="Preview" className="w-full h-24 object-cover" />
                          </div>
                        )}
                     </motion.div>
                   )}
                 </AnimatePresence>

                 {/* Simulated background notification */}
                 <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-4 border border-white/10 opacity-40">
                    <div className="h-3 w-24 bg-white/30 rounded-full mb-2" />
                    <div className="h-2 w-full bg-white/20 rounded-full mb-1" />
                    <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                 </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1.5 bg-white/30 rounded-full" />
           </div>

           <div className="flex items-center justify-center gap-4 text-slate-400">
              <div className="flex items-center gap-1.5">
                 <CheckCircle2 size={14} className="text-emerald-500" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">تنسيق ذكي</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <CheckCircle2 size={14} className="text-emerald-500" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">دعم الصور</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <CheckCircle2 size={14} className="text-emerald-500" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">اختياري</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

const LayoutGrid = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);
