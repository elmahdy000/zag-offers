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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      setSubmitError('الحد الأقصى هو 5 صور فقط');
      return;
    }

    if (files.length > 0) {
      const newFiles = [...selectedFiles, ...files];
      setSelectedFiles(newFiles);
      
      const filePreviews = new Array(files.length);
      let loadedCount = 0;

      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            filePreviews[index] = reader.result;
            loadedCount++;
            if (loadedCount === files.length) {
              setImagePreviews(prev => [...prev, ...filePreviews]);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    // Reset input value to allow re-selecting same file
    const input = document.getElementById('imageInput') as HTMLInputElement;
    if (input) input.value = '';
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
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(async (file) => {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          const uploadRes = await vendorApi().post('/upload', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return uploadRes.data.url;
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      const formattedDiscount = /^\d+$/.test(formData.discount.trim()) 
        ? `${formData.discount.trim()}%` 
        : formData.discount.trim();

      await vendorApi().post('/offers', {
        title: formData.title.trim(),
        description: formData.description.trim() || formData.title.trim(),
        discount: formattedDiscount,
        startDate: new Date().toISOString(),
        endDate: new Date(formData.expiryDate).toISOString(),
        storeId,
        images: imageUrls,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      });

      router.push('/dashboard/offers');
    } catch (error: any) {
      console.error('Submit Error:', error);
      const msg = error.response?.data?.message;
      setSubmitError(
        Array.isArray(msg) ? msg.join(' | ') : 
        msg || 'حدث خطأ في الخادم. تأكد من أن جميع الحقول صحيحة.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isNumericDiscount = /^\d+(\.\d+)?%?$/.test(formData.discount);
  const discountValue = parseFloat(formData.discount) || 0;
  const discountedPrice = (Number(formData.originalPrice) * (1 - discountValue / 100)).toFixed(0);
  const showDiscountedPrice = Boolean(formData.originalPrice) && isNumericDiscount && discountValue > 0;

  return (
    <div className="min-h-screen bg-bg p-4 sm:p-8 dir-rtl animate-in max-w-7xl mx-auto relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />

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
        <div className="xl:col-span-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-[2.5rem] border border-white/5 p-8 sm:p-10 inner-shadow relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <div className="space-y-10">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon size={14} /> صور العرض (حتى 5 صور)
                  </label>
                  <span className="text-[10px] font-bold text-primary/60">يفضل أبعاد 1:1</span>
                </div>
                
                <div
                  className="relative min-h-[200px] rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.02] p-4 flex flex-wrap gap-4 items-center justify-center cursor-pointer group transition-all hover:border-primary/30"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <AnimatePresence mode="popLayout">
                    {imagePreviews.length > 0 ? (
                      imagePreviews.map((preview, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-white/10 group/img shadow-xl"
                        >
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                          >
                            <span className="text-xs font-black">×</span>
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div 
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-8"
                      >
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                          <Upload className="text-text-dim group-hover:text-primary transition-colors" size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-text group-hover:text-primary transition-colors">اضغط لإضافة صور (حتى 5)</p>
                          <p className="text-[10px] font-bold text-text-dimmer mt-1">يمكنك إضافة الصور واحدة تلو الأخرى</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <input id="imageInput" type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
                </div>

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

        <div className="xl:col-span-4 space-y-8">
           <div className="flex items-center gap-2 text-text-dimmer text-[11px] font-black uppercase tracking-widest px-2">
             <Info size={14} className="text-primary" /> معاينة مباشرة (موبايل)
           </div>

           <div className="glass rounded-[3rem] p-6 border border-white/5 inner-shadow relative">
              <div className="aspect-[4/5] rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden relative group">
                 {imagePreviews.length > 0 ? (
                    <img src={imagePreviews[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-dimmer opacity-20">
                      <ImageIcon size={64} strokeWidth={1} />
                      <p className="mt-4 text-[10px] font-black">انتظار الصورة...</p>
                    </div>
                  )}
                  
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
                       {Boolean(formData.originalPrice) && (
                         <span className="text-xs text-text-dimmer line-through">EGP {formData.originalPrice}</span>
                       )}
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-text tracking-tighter">
                            {showDiscountedPrice 
                              ? `EGP ${!isNaN(discountedPrice) ? discountedPrice : '0.00'}` 
                              : (formData.discount ? formData.discount : '0.00')}
                          </span>
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
