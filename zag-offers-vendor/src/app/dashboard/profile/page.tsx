'use client';
import { useState, useEffect } from 'react';
import { Store, MapPin, Phone, Mail, Camera, Save, Loader2, CheckCircle2 } from 'lucide-react';
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
    address: '',
    email: '', // User's email from owner relation
  });

  // React Query hooks
  const { data: store, isLoading } = useVendorStore();
  const { mutate: updateStore, isPending: updating } = useUpdateStore();

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        phone: store.phone || '',
        address: store.address || '',
        email: store.owner?.email || '',
      });
    }
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    
    // تحقق من البيانات
    if (!formData.name.trim()) {
      alert('اسم المتجر مطلوب');
      return;
    }
    
    if (formData.phone && !/^[0-9]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      alert('رقم الهاتف غير صالح');
      return;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('البريد الإلكتروني غير صالح');
      return;
    }
    
    setSaving(true);
    setSuccess(false);

    // Use React Query mutation
    updateStore(
      {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
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
      <div className="mb-10">
        <h1 className="text-3xl font-black text-text tracking-tight">إعدادات المتجر</h1>
        <p className="text-text-dim mt-2 font-bold text-xs uppercase tracking-widest">إدارة الهوية والمعلومات العامة</p>
      </div>

      <div className="space-y-8">
        {/* Logo Section */}
        <div className="glass p-10 rounded-[3rem] border border-white/5 flex flex-col items-center inner-shadow relative overflow-hidden bg-white/[0.01]">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="relative group">
            <div className="w-36 h-36 bg-bg border-4 border-white/5 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-2xl transition-all group-hover:scale-105 group-hover:border-primary/50">
              {store.logo ? (
                <img src={resolveImageUrl(store.logo)} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store size={48} className="text-white/10" />
              )}
            </div>
            <button className="absolute -bottom-2 -left-2 bg-primary text-white p-3 rounded-2xl shadow-xl shadow-primary/40 hover:scale-110 active:scale-95 transition-all">
              <Camera size={20} />
            </button>
          </div>
          <div className="text-center mt-6">
            <h2 className="font-black text-lg text-text">لوجو المحل</h2>
            <p className="text-text-dim text-[11px] font-bold mt-1">يظهر للعملاء في الصفحة الرئيسية وقائمة المتاجر</p>
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

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 hover:bg-primary-lt active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
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
