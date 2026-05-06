'use client';
import { useState, useEffect } from 'react';
import { Upload, ArrowRight, Save, Info, Calendar, Percent, Loader2, Tag, LayoutDashboard, Sparkles, Image as ImageIcon, ChevronLeft, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, getVendorStoreId, resolveImageUrl } from '@/lib/api';
import { DashboardSkeleton } from '@/components/Skeleton';

export default function EditOfferPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    originalPrice: '',
    expiryDate: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    vendorApi().get(`/offers/${id}`)
      .then(res => {
        const o = res.data;
        setFormData({
          title: o.title || '',
          description: o.description || '',
          discount: o.discount || '',
          originalPrice: o.originalPrice?.toString() || '',
          expiryDate: o.endDate ? new Date(o.endDate).toISOString().split('T')[0] : '',
        });
        if (o.images?.length > 0) {
          setExistingImages(o.images);
          setImagePreview(resolveImageUrl(o.images[0]));
        }
      })
      .catch(err => {
        console.error(err);
        setSubmitError('تعذر تحميل بيانات العرض');
      })
      .finally(() => setLoading(false));
  }, [id]);

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

    setSubmitting(true);
    try {
      let imageUrls = [...existingImages];
      
      // If new image selected, upload it and replace the first image
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        const uploadRes = await vendorApi().post('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.url) {
          imageUrls = [uploadRes.data.url]; // For now, we only support 1 image in vendor app
        }
      }

      await vendorApi().patch(`/offers/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim() || formData.title.trim(),
        discount: formData.discount.includes('%') ? formData.discount : `${formData.discount}%`,
        endDate: new Date(formData.expiryDate).toISOString(),
        images: imageUrls,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
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

  if (loading) return <DashboardSkeleton />;

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
               تعديل العرض <Sparkles className="text-primary" size={24} />
            </h1>
            <p className="text-text-dim mt-1 font-bold text-sm">قم بتحديث بيانات العرض وسيتم مراجعته وتفعيله فوراً</p>
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
              {/* Image Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon size={14} /> صورة العرض
                  </label>
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
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                          <Upload className="text-text-dim" size={32} />
                        </div>
                        <p className="text-sm font-black text-text">اضغط لرفع صورة جديدة</p>
                      </div>
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
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all"
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
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">السعر الأصلي</label>
                  <div className="relative group">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-dim">EGP</span>
                    <input
                      type="number"
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm font-black text-text outline-none focus:border-primary/50 transition-all"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] mr-2">تفاصيل العرض</label>
                  <textarea
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-3xl py-4 px-6 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black text-center">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-primary-lt active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Preview Area */}
        <div className="xl:col-span-4 space-y-8">
           <div className="flex items-center gap-2 text-text-dimmer text-[11px] font-black uppercase tracking-widest px-2">
             <Info size={14} className="text-primary" /> معاينة العرض
           </div>

           <div className="glass rounded-[3rem] p-6 border border-white/5 inner-shadow relative">
              <div className="aspect-[4/5] rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden relative">
                 {imagePreview && (
                   <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                 )}
                 <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 rounded-2xl text-[12px] font-black">
                   {formData.discount || '0%'} خصم
                 </div>
              </div>

              <div className="mt-6 space-y-4">
                 <h3 className="text-xl font-black text-text leading-tight">{formData.title || 'عنوان العرض'}</h3>
                 <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                       {formData.originalPrice && (
                         <span className="text-xs text-text-dimmer line-through">EGP {formData.originalPrice}</span>
                       )}
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-text">
                            {formData.originalPrice && formData.discount
                              ? `EGP ${(Number(formData.originalPrice) * (1 - parseFloat(formData.discount) / 100)).toFixed(0)}`
                              : '0.00'}
                          </span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
