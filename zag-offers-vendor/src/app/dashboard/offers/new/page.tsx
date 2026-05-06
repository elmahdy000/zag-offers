'use client';
import { useState } from 'react';
import { Upload, ArrowRight, Save, Info, Calendar, Percent, Loader2, Tag, LayoutDashboard, Sparkles, Image as ImageIcon, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, getVendorStoreId } from '@/lib/api';

export default function NewOfferPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    originalPrice: '',
    expiryDate: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!formData.title.trim()) return setSubmitError('برجاء إدخال عنوان العرض');
    if (!formData.discount.trim()) return setSubmitError('برجاء إدخال نسبة الخصم');
    if (!formData.expiryDate) return setSubmitError('برجاء اختيار تاريخ انتهاء العرض');

    const storeId = getVendorStoreId();
    if (!storeId) return setSubmitError('لم يتم ربط متجر بحسابك. تواصل مع الإدارة.');

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        const uploadRes = await vendorApi().post('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.url) imageUrls.push(uploadRes.data.url);
      }

      await vendorApi().post('/offers', {
        title: formData.title.trim(),
        description: formData.description.trim() || formData.title.trim(),
        discount: formData.discount.includes('%') ? formData.discount : `${formData.discount}%`,
        startDate: new Date().toISOString(),
        endDate: new Date(formData.expiryDate).toISOString(),
        storeId,
        images: imageUrls,
      });

      router.push('/dashboard/offers');
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'حصل خطأ أثناء إرسال العرض. حاول تاني.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg p-4 sm:p-8 dir-rtl animate-in max-w-7xl mx-auto relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-text-dim hover:text-primary hover:border-primary/30 transition-all border border-white/5"
          >
            <ArrowRight size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-text tracking-tight flex items-center gap-3">
               إضافة عرض مميز <Sparkles className="text-primary" size={24} />
            </h1>
            <p className="text-text-dim mt-1 font-bold text-sm">قم بتجهيز عرضك الجديد ليصل لآلاف العملاء في الزقازيق</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Form Area */}
        <div className="xl:col-span-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] border border-white/5 p-8 sm:p-10 inner-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <div className="space-y-10">
              {/* Image Upload - Reimagined */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon size={14} /> صورة العرض الرئيسية
                  </label>
                  <span className="text-[10px] font-bold text-primary/60">يفضل أبعاد 1:1</span>
                </div>
                
                <div
                  className="relative aspect-video sm:aspect-[21/9] rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center cursor-pointer group overflow-hidden transition-all hover:border-primary/30"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <AnimatePresence mode="wait">
                    {imagePreview ? (
                      <motion.div 
                        key="preview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0"
                      >
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
                        <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black text-white border border-white/10">
                           تغيير الصورة
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                          <Upload className="text-text-dim group-hover:text-primary transition-colors" size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-text group-hover:text-primary transition-colors">اسحب الصورة هنا أو اضغط للرفع</p>
                          <p className="text-[10px] font-bold text-text-dimmer mt-1">يدعم JPG, PNG بجودة عالية</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input id="imageInput" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">عنوان العرض</label>
                  <div className="relative group">
                    <Tag className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="مثلاً: خصم 50% على الملابس"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">تاريخ الانتهاء</label>
                  <div className="relative group">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all appearance-none"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">نسبة الخصم</label>
                  <div className="relative group">
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="50%"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">السعر الأصلي (اختياري)</label>
                  <div className="relative group">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-dim">EGP</span>
                    <input
                      type="number"
                      placeholder="100"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">تفاصيل العرض</label>
                  <textarea
                    placeholder="اكتب هنا تفاصيل العرض والشروط..."
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-3xl py-4 px-6 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {submitError && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black text-center">
                  {submitError}
                </motion.div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary-lt active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 group"
              >
                {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
                {submitting ? 'جاري تجهيز العرض...' : 'نشر العرض الآن'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Preview */}
        <div className="xl:col-span-4 space-y-8">
           <div className="flex items-center gap-2 text-text-dimmer text-[11px] font-black uppercase tracking-widest px-2">
             <Info size={14} className="text-primary" /> معاينة مباشرة (موبايل)
           </div>

           <div className="glass rounded-[3rem] p-6 border border-white/5 inner-shadow relative">
              <div className="aspect-[4/5] rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden relative group">
                 {imagePreview ? (
                   <img src={imagePreview} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Preview" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-text-dimmer opacity-20">
                     <ImageIcon size={64} strokeWidth={1} />
                     <p className="mt-4 text-[10px] font-black">انتظار الصورة...</p>
                   </div>
                 )}
                 
                 {/* Floating Discount Tag */}
                 <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 rounded-2xl text-[12px] font-black shadow-2xl shadow-primary/40">
                   {formData.discount || '0%'} خصم
                 </div>
              </div>

              <div className="mt-6 space-y-4">
                 <div>
                    <h3 className="text-xl font-black text-text leading-tight line-clamp-2">
                      {formData.title || 'عنوان العرض يظهر هنا'}
                    </h3>
                    <p className="text-primary font-black text-[11px] mt-2 flex items-center gap-2">
                      <LayoutDashboard size={12} /> اسم متجرك المميز
                    </p>
                 </div>

                 <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                       {formData.originalPrice && (
                         <span className="text-xs text-text-dimmer line-through">EGP {formData.originalPrice}</span>
                       )}
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-text tracking-tighter">
                            {formData.originalPrice && formData.discount
                              ? `EGP ${(Number(formData.originalPrice) * (1 - parseFloat(formData.discount) / 100)).toFixed(0)}`
                              : formData.discount
                              ? `عرض حصري`
                              : '0.00'}
                          </span>
                          <span className="text-[10px] font-black text-text-dimmer uppercase">EGP</span>
                       </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                       <ChevronLeft className="text-white" />
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10 flex items-start gap-4">
              <ShieldCheck className="text-primary shrink-0" size={24} />
              <p className="text-[11px] font-black text-text-dim leading-relaxed">
                سيتم مراجعة هذا العرض من قبل فريق <span className="text-primary font-black">Zag Offers</span> لضمان الجودة وسيتم تفعيله خلال ساعة بحد أقصى.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
