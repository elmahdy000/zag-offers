'use client';

import { useState, useEffect } from 'react';
import { 
  Store, MapPin, Phone, Mail, Camera, Save, Loader2, 
  CheckCircle2, MessageCircle, Trash2, Plus, ArrowUpRight, 
  AlertCircle, RefreshCw, Layout, Globe, Smartphone, 
  Info, Image as ImageIcon, ExternalLink, HelpCircle
} from 'lucide-react';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useVendorStore, useUpdateStore } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '@/components/ConfirmModal';

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
    } catch (err) {
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-xl mx-auto">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-xl font-black text-text mb-2">خطأ في تحميل البيانات</h2>
          <p className="text-text-dim text-sm max-w-sm mb-8 leading-relaxed mx-auto">
            {errorStatus === 404 
              ? 'لم نتمكن من العثور على متجر مربوط بهذا الحساب. إذا كنت قد سجلت حديثاً، يرجى التواصل مع الدعم الفني.'
              : 'فشل الاتصال بالخادم. تأكد من اتصال الإنترنت أو حاول مرة أخرى.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
            <button onClick={() => refetch()} className="bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
              <RefreshCw size={18} /> إعادة المحاولة
            </button>
            <a href="https://wa.me/201015684611" target="_blank" className="bg-emerald-500/10 text-emerald-500 py-4 rounded-2xl font-black text-sm border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2">
              <MessageCircle size={18} /> الدعم الفني
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="p-4 sm:p-8 lg:p-12 dir-rtl bg-bg min-h-screen max-w-7xl mx-auto animate-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl font-black text-text tracking-tight">إعدادات المتجر</h1>
          <p className="text-text-dim text-xs font-bold mt-2">تحكم في ظهور متجرك أمام آلاف المستخدمين</p>
        </motion.div>
        
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-3 w-full md:w-auto">
          <button onClick={handleSave} disabled={saving || updating} className="flex-1 md:flex-none bg-primary text-white h-14 px-8 rounded-2xl font-black text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {saving || updating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            حفظ التغييرات
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="space-y-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center relative overflow-hidden bg-bg2/40">
             <div className="relative mb-6">
                <div className="w-36 h-36 bg-bg2 border-4 border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                  {store.logo ? (
                    <img src={resolveImageUrl(store.logo)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/30">
                       <ImageIcon size={48} />
                    </div>
                  )}
                  {(saving || updating) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                      <Loader2 className="animate-spin text-primary" size={28} />
                    </div>
                  )}
                </div>
                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <button onClick={() => document.getElementById('logo-upload')?.click()} className="absolute -bottom-2 -left-2 bg-primary text-white p-3.5 rounded-2xl shadow-xl hover:scale-110 transition-all border-4 border-bg z-20">
                  <Camera size={20} />
                </button>
             </div>

             <div className="text-center">
               <h3 className="text-lg font-black text-text mb-1">{formData.name || 'جاري التحميل...'}</h3>
               <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <div className={`w-2 h-2 rounded-full ${store.status === 'APPROVED' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`} />
                  <span className="text-[10px] font-black text-text-dim uppercase tracking-wider">
                    {store.status === 'APPROVED' ? 'حساب معتمد' : 'تحت المراجعة'}
                  </span>
               </div>
             </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className={`p-6 rounded-[2rem] border ${store.status === 'APPROVED' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${store.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                {store.status === 'APPROVED' ? <CheckCircle2 size={24} /> : <HelpCircle size={24} />}
              </div>
              <div>
                <h4 className={`text-sm font-black ${store.status === 'APPROVED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {store.status === 'APPROVED' ? 'متجر نشط وجاهز' : 'طلب قيد المراجعة'}
                </h4>
                <p className="text-[10px] font-bold text-text-dim mt-1 leading-relaxed">
                  {store.status === 'APPROVED' 
                    ? 'متجرك الآن يظهر لجميع مستخدمي تطبيق الزقازيق.'
                    : 'نقوم حالياً بمراجعة بيانات متجرك، سيصلك إشعار فور الاعتماد.'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Forms Section */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-xl bg-bg2/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-black text-text">معلومات التواصل والموقع</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim mr-1 flex items-center gap-2">
                  <Store size={12} /> اسم المتجر
                </label>
                <input 
                  type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-bg/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-text focus:border-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim mr-1 flex items-center gap-2">
                  <Phone size={12} /> رقم الهاتف
                </label>
                <input 
                  type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-bg/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-text focus:border-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim mr-1 flex items-center gap-2">
                  <MessageCircle size={12} /> واتساب (للكوبونات)
                </label>
                <input 
                  type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="2010XXXXXXXX"
                  className="w-full bg-bg/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-text focus:border-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-dim mr-1 flex items-center gap-2">
                  <Smartphone size={12} /> رابط الخريطة
                </label>
                <div className="relative">
                  <input 
                    type="text" value={formData.locationUrl} onChange={e => setFormData({ ...formData, locationUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="w-full bg-bg/50 border border-white/5 rounded-2xl py-4 px-5 pl-12 text-sm font-bold text-text focus:border-primary outline-none transition-all shadow-inner"
                  />
                  {formData.locationUrl && (
                    <a href={formData.locationUrl} target="_blank" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform">
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-text-dim mr-1 flex items-center gap-2">
                  <MapPin size={12} /> العنوان بالتفصيل
                </label>
                <textarea 
                  value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-bg/50 border border-white/5 rounded-2xl py-4 px-5 text-sm font-bold text-text focus:border-primary outline-none transition-all min-h-[100px] resize-none shadow-inner"
                />
              </div>
            </div>
          </motion.div>

          {/* Photo Gallery Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-xl bg-bg2/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                  <ImageIcon size={20} />
                </div>
                <h3 className="text-lg font-black text-text">معرض الصور</h3>
              </div>
              <button onClick={() => document.getElementById('gallery-upload')?.click()} className="bg-white/5 hover:bg-white/10 text-text px-4 py-2 rounded-xl text-[10px] font-black border border-white/10 transition-all flex items-center gap-2">
                <Plus size={14} /> إضافة صور
              </button>
              <input type="file" id="gallery-upload" className="hidden" accept="image/*" multiple onChange={async (e) => {
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(store.images || []).map((img: string, idx: number) => (
                <div key={idx} className="aspect-square rounded-3xl overflow-hidden border border-white/5 relative group bg-bg shadow-lg">
                  <img src={resolveImageUrl(img)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <button onClick={() => setImageToDelete(idx)} className="bg-red-500 text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => document.getElementById('gallery-upload')?.click()} className="aspect-square rounded-3xl border-2 border-dashed border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-text-dimmer group">
                 <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all">
                    <Camera size={22} />
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest">أضف صورة</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-emerald-500 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3">
              <CheckCircle2 size={24} />
              <span className="text-sm font-black tracking-tight">تم تحديث بيانات المتجر بنجاح</span>
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
