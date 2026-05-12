'use client';
import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Mail, Camera, Save, Loader2, CheckCircle2, MessageCircle, Trash2, Plus, ArrowUpRight } from 'lucide-react';
import { vendorApi, getVendorStoreId, resolveImageUrl } from '@/lib/api';
import { useVendorStore, useUpdateStore } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoreProfilePage() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
    locationUrl: '',
    email: '',
  });

  // React Query hooks
  const { data: store, isLoading } = useVendorStore();
  const { mutate: updateStore, isPending: updating } = useUpdateStore();

  useEffect(() => {
    if (store) {
      setTimeout(() => {
        setFormData({
          name: store.name || '',
          phone: store.phone || '',
          whatsapp: store.whatsapp || '',
          address: store.address || '',
          locationUrl: store.locationUrl || '',
          email: store.owner?.email || '',
        });
      }, 0);
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
    
    if (!formData.name.trim()) {
      alert('اسم المتجر مطلوب');
      return;
    }
    
    setSaving(true);
    setSuccess(false);

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
        onError: () => {
          alert('حدث خطأ أثناء حفظ التعديلات');
        },
        onSettled: () => {
          setSaving(false);
        },
      }
    );
  };

  if (isLoading) return <DashboardSkeleton />;
  if (!store) return <div className="p-8 text-center text-text-dim">لم يتم العثور على بيانات المتجر.</div>;

  return (
    <div className="p-4 sm:p-8 dir-rtl max-w-4xl mx-auto animate-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-text tracking-tighter">إعدادات المتجر</h1>
          <p className="text-text-dim mt-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            إدارة الهوية والمعلومات العامة
          </p>
        </div>
        <a 
          href={`https://zagoffers.online/stores/${store.id}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass px-6 py-3 rounded-2xl flex items-center gap-3 text-text-dim hover:text-primary hover:border-primary/30 transition-all group border border-white/5"
        >
          <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-all">
            <ArrowUpRight size={16} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">معاينة المتجر المباشر</span>
        </a>
      </div>

      <div className="space-y-10">
        {/* Profile Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-[3.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative glass p-10 rounded-[3rem] border border-white/10 flex flex-col items-center inner-shadow bg-bg/80 backdrop-blur-xl">
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-bg border-4 border-white/10 rounded-[3rem] flex items-center justify-center overflow-hidden shadow-2xl transition-all group-hover:border-primary/50">
                {store.logo ? (
                  <img src={resolveImageUrl(store.logo)} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <Store size={48} className="text-white/10" />
                )}
                {(saving || updating) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-primary" size={32} />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                id="logo-input" 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <button 
                onClick={() => document.getElementById('logo-input')?.click()}
                className="absolute -bottom-2 -left-2 bg-primary text-white p-4 rounded-[1.5rem] shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all z-20 border-4 border-bg"
              >
                <Camera size={20} />
              </button>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-black text-text mb-2 tracking-tight">{formData.name || 'اسم المتجر'}</h2>
              <div className="flex items-center justify-center gap-2 text-text-dimmer font-bold text-[10px] uppercase tracking-[0.2em]">
                <MapPin size={12} />
                {formData.address || 'لم يتم تحديد عنوان'}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="glass p-8 sm:p-10 rounded-[3rem] border border-white/5 space-y-8 inner-shadow bg-white/[0.01]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">اسم المتجر</label>
              <div className="relative group">
                <Store className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">رقم الموبايل للتواصل</label>
              <div className="relative group">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">رقم الواتساب (لإرسال الكوبونات)</label>
              <div className="relative group">
                <MessageCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="tel" 
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="2010XXXXXXXX"
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">رابط جوجل ماب (الموقع)</label>
              <div className="relative group">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="url" 
                  value={formData.locationUrl}
                  onChange={e => setFormData({ ...formData, locationUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest">العنوان بالتفصيل</label>
            <div className="relative group">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-bg border border-white/5 rounded-2xl py-4 pr-12 focus:border-primary outline-none transition-all text-sm font-bold text-text shadow-inner" 
              />
            </div>
          </div>

          <div className="space-y-2.5 opacity-60 grayscale pointer-events-none">
            <label className="text-[10px] font-black text-text-dim mr-1 uppercase tracking-widest flex items-center gap-2">
              البريد الإلكتروني الأساسي
              <span className="bg-white/5 px-2 py-0.5 rounded text-[8px] tracking-tight">غير قابل للتغيير</span>
            </label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
              <input 
                type="email" 
                value={formData.email}
                readOnly
                className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pr-12 text-sm font-bold text-text-dim outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="glass p-8 sm:p-10 rounded-[3rem] border border-white/5 space-y-6 bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg text-text">معرض صور المحل</h2>
              <p className="text-text-dim text-[11px] font-bold mt-1">أضف صوراً توضح جمال ومميزات محلك للزبائن</p>
            </div>
            <button 
              onClick={() => document.getElementById('gallery-input')?.click()}
              className="bg-white/5 hover:bg-white/10 text-text px-4 py-2 rounded-xl text-[10px] font-black border border-white/10 transition-all flex items-center gap-2"
            >
              <Plus size={14} /> إضافة صورة
            </button>
            <input 
              type="file" id="gallery-input" className="hidden" accept="image/*" multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                setSaving(true);
                const currentImages = store.images || [];
                const newImages = [...currentImages];

                for (const file of files) {
                  const uploadFormData = new FormData();
                  uploadFormData.append('file', file);
                  try {
                    const res = await vendorApi().post('/upload', uploadFormData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    if (res.data?.url) newImages.push(res.data.url);
                  } catch (err) {}
                }

                updateStore({ images: newImages }, {
                  onSuccess: () => {
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                  },
                  onSettled: () => setSaving(false)
                });
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(store.images || []).map((img: string, idx: number) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group shadow-lg">
                <img src={resolveImageUrl(img)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                <button 
                  onClick={() => {
                    const filtered = (store.images || []).filter((_: string, i: number) => i !== idx);
                    updateStore({ images: filtered });
                  }}
                  className="absolute top-2 left-2 bg-red-500/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button 
              onClick={() => document.getElementById('gallery-input')?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-text-dimmer hover:text-primary group"
            >
              <Camera size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">إضافة صورة</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleSave}
            disabled={saving || updating}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 hover:bg-primary-lt active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {(saving || updating) ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            حفظ التغييرات
          </button>
          
          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 text-secondary font-black text-sm"
              >
                <CheckCircle2 size={18} />
                تم حفظ التغييرات بنجاح!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
