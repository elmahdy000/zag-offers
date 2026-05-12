'use client';

import { useState, useEffect } from 'react';
import { 
  Store, MapPin, Phone, Mail, Camera, Save, Loader2, 
  CheckCircle2, MessageCircle, Trash2, Plus, ArrowUpRight, 
  AlertCircle, RefreshCw, Layout, Globe, Smartphone, 
  Info, Image as ImageIcon, ChevronLeft
} from 'lucide-react';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useVendorStore, useUpdateStore } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function StoreProfilePage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    locationUrl: '',
    email: '',
  });

  const { data: store, isLoading, isError, error, refetch } = useVendorStore();
  const { mutate: updateStore, isPending: updating } = useUpdateStore();

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        phone: store.phone || '',
        whatsapp: store.whatsapp || '',
        address: store.address || '',
        locationUrl: store.locationUrl || '',
        email: store.owner?.email || '',
      });
    }
  }, [store]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await vendorApi().post('/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        updateStore({ logo: res.data.url }, {
          onSuccess: () => {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
          }
        });
      }
    } catch (error) {
      alert('فشل رفع اللوجو، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!store) return;
    if (!formData.name.trim()) return alert('اسم المتجر مطلوب');
    
    setSaving(true);
    updateStore(
      {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        whatsapp: formData.whatsapp.trim(),
        address: formData.address.trim(),
        locationUrl: formData.locationUrl.trim(),
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        },
        onSettled: () => setSaving(false),
      }
    );
  };

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    const errorStatus = (error as any)?.response?.status;
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/5 blur-[100px] rounded-full" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
          <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl mb-8 mx-auto">
             <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-black text-text mb-3">حدث خطأ في الاتصال</h2>
          <p className="text-text-dim text-sm font-bold max-w-xs mx-auto mb-10 leading-relaxed">
            {error instanceof Error ? error.message : 'فشل جلب بيانات المتجر'}
            {errorStatus && <span className="block mt-1 opacity-40 font-mono text-[10px]">Error Code: {errorStatus}</span>}
          </p>
          <button onClick={() => refetch()} className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto">
            <RefreshCw size={20} /> إعادة المحاولة
          </button>
        </motion.div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="p-4 sm:p-8 lg:p-12 dir-rtl max-w-5xl mx-auto animate-in bg-bg min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="flex items-center gap-3 mb-3 text-primary">
            <Layout size={18} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">بوابة المتجر</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-text tracking-tighter leading-tight">هوية المتجر <br className="sm:hidden" /> والمعلومات</h1>
        </motion.div>
        
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-3">
          <a href={`https://zagoffers.online/stores/${store.id}`} target="_blank" rel="noopener" className="glass h-14 px-6 rounded-2xl flex items-center gap-3 text-text-dim hover:text-primary transition-all group border border-white/5">
            <Globe size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest hidden sm:block">الموقع المباشر</span>
            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-y-1" />
          </a>
          <button onClick={handleSave} disabled={saving || updating} className="bg-primary text-white h-14 px-8 rounded-2xl font-black text-sm shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-3 disabled:opacity-50">
            {saving || updating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            حفظ التغييرات
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Profile Side (Logo & Status) */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-[4rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative glass p-8 sm:p-12 rounded-[3.5rem] border border-white/10 flex flex-col items-center bg-bg/80 backdrop-blur-2xl shadow-2xl">
              <div className="relative mb-8">
                <div className="w-44 h-44 bg-bg2 border-4 border-white/10 rounded-[3.5rem] flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-primary/40 transition-all duration-500">
                  {store.logo ? (
                    <img src={resolveImageUrl(store.logo)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store size={64} className="text-text-dimmer opacity-20" />
                  )}
                  {(saving || updating) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                  )}
                </div>
                <input type="file" id="logo-input" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <button 
                  onClick={() => document.getElementById('logo-input')?.click()}
                  className="absolute -bottom-2 -left-2 bg-primary text-white p-5 rounded-[1.8rem] shadow-2xl shadow-primary/50 hover:scale-110 active:scale-95 transition-all border-[6px] border-bg z-20"
                >
                  <Camera size={22} />
                </button>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${store.status === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                    {store.status === 'APPROVED' ? 'متجر معتمد' : 'بانتظار المراجعة'}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-text tracking-tight mb-2">{formData.name || 'اسم المتجر'}</h2>
                <div className="flex items-center justify-center gap-1.5 text-text-dimmer font-bold text-[10px] uppercase">
                  <MapPin size={12} />
                  {store.category?.name || 'قسم غير محدد'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Info Block */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
            <h3 className="text-[11px] font-black text-text-dim uppercase tracking-widest mb-6 flex items-center gap-2">
              <Info size={14} className="text-primary" /> معلومات سريعة
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[11px] font-bold text-text-dimmer">تاريخ الانضمام</span>
                <span className="text-[11px] font-black text-text tabular-nums">{new Date(store.createdAt).toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[11px] font-bold text-text-dimmer">حالة المتجر</span>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${store.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'}`}>
                  {store.status === 'APPROVED' ? 'نشط' : 'قيد المراجعة'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Forms Side */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Info Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass p-8 sm:p-12 rounded-[3.5rem] border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Layout size={20} />
              </div>
              <h3 className="text-lg font-black text-text">البيانات الأساسية</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
                  <Store size={12} /> اسم المتجر الرسمي
                </label>
                <input 
                  type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-bg/50 border border-white/10 rounded-2xl py-4.5 px-6 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} /> رقم الموبايل العام
                </label>
                <input 
                  type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-bg/50 border border-white/10 rounded-2xl py-4.5 px-6 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
                  <MessageCircle size={12} /> واتساب (لاستقبال الكوبونات)
                </label>
                <input 
                  type="tel" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="2010XXXXXXXX"
                  className="w-full bg-bg/50 border border-white/10 rounded-2xl py-4.5 px-6 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner placeholder:opacity-30" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
                  <Smartphone size={12} /> رابط الموقع على الخرائط
                </label>
                <input 
                  type="url" value={formData.locationUrl} onChange={e => setFormData({ ...formData, locationUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-bg/50 border border-white/10 rounded-2xl py-4.5 px-6 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner placeholder:opacity-30" 
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={12} /> العنوان بالتفصيل
                </label>
                <input 
                  type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-bg/50 border border-white/10 rounded-2xl py-4.5 px-6 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>

              <div className="md:col-span-2 space-y-3 opacity-50 grayscale pointer-events-none">
                <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} /> البريد الإلكتروني <span className="bg-white/5 px-2 py-0.5 rounded text-[8px] opacity-70">غير قابل للتعديل</span>
                </label>
                <input 
                  type="email" value={formData.email} readOnly
                  className="w-full bg-black/20 border border-white/10 rounded-2xl py-4.5 px-6 text-sm font-bold text-text-dimmer outline-none" 
                />
              </div>
            </div>
          </motion.div>

          {/* Gallery Section Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass p-8 sm:p-12 rounded-[3.5rem] border border-white/5 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text leading-none">معرض الصور</h3>
                  <p className="text-[10px] font-bold text-text-dim mt-2">صور توضح الخدمات وتصميم المحل</p>
                </div>
              </div>
              <button onClick={() => document.getElementById('gallery-input')?.click()} className="bg-white/5 hover:bg-white/10 text-text px-5 py-2.5 rounded-xl text-[10px] font-black border border-white/10 transition-all flex items-center gap-2">
                <Plus size={14} /> إضافة صور
              </button>
              <input type="file" id="gallery-input" className="hidden" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                setSaving(true);
                const currentImages = store.images || [];
                const newImages = [...currentImages];
                for (const file of files) {
                  const uploadFormData = new FormData();
                  uploadFormData.append('file', file);
                  try {
                    const res = await vendorApi().post('/upload', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (res.data?.url) newImages.push(res.data.url);
                  } catch (err) {}
                }
                updateStore({ images: newImages }, { onSettled: () => setSaving(false) });
              }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {(store.images || []).map((img: string, idx: number) => (
                <div key={idx} className="relative aspect-square rounded-[1.8rem] overflow-hidden border border-white/10 group shadow-lg bg-bg2">
                  <img src={resolveImageUrl(img)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button onClick={() => setImageToDelete(idx)} className="bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:bg-red-600 transition-colors scale-90 group-hover:scale-100 duration-300">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => document.getElementById('gallery-input')?.click()} className="aspect-square rounded-[1.8rem] border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 text-text-dimmer hover:text-primary group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                  <Camera size={24} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">إضافة صورة</span>
              </button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Save Success Notification Portal */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[1000]">
            <div className="glass-heavy px-8 py-5 rounded-3xl border border-secondary/30 shadow-2xl shadow-secondary/20 flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center text-secondary">
                 <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-text">تم الحفظ بنجاح</h4>
                <p className="text-[10px] font-bold text-text-dim mt-0.5">تم تحديث بيانات المتجر على كافة التطبيقات</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={imageToDelete !== null}
        onClose={() => setImageToDelete(null)}
        onConfirm={() => {
          if (imageToDelete !== null) {
            const filtered = (store.images || []).filter((_: string, i: number) => i !== imageToDelete);
            updateStore({ images: filtered }, { onSuccess: () => setImageToDelete(null) });
          }
        }}
        isLoading={updating}
        title="حذف الصورة"
        message="هل أنت متأكد من حذف هذه الصورة؟ سيتم إزالتها نهائياً من معرض متجرك."
        type="danger"
      />
    </div>
  );
}
