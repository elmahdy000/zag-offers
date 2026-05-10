'use client';
import { useState, useEffect } from 'react';
import { Upload, ArrowRight, Save, Info, Calendar, Percent, Loader2, Tag, LayoutDashboard, Sparkles, Image as ImageIcon, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useUpdateOffer, useDeleteOffer } from '@/hooks/use-vendor-api';
import { DashboardSkeleton } from '@/components/Skeleton';

export default function EditOfferPage() {
  const router = useRouter();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    originalPrice: '',
    expiryDate: '',
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // React Query hooks
  const { mutate: updateOffer, isPending: submitting } = useUpdateOffer();
  const { mutate: deleteOffer } = useDeleteOffer();

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
        if (o.images && o.images.length > 0) {
          setExistingImages(o.images);
          setImagePreviews(o.images.map((img: string) => resolveImageUrl(img)));
        }
      })
      .catch(err => {
        console.error(err);
        setSubmitError('تعذر تحميل بيانات العرض');
      });
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      setSubmitError('الحد الأقصى هو 5 صور فقط');
      return;
    }

    if (files.length > 0) {
      setSelectedFiles(files);
      const newPreviews: string[] = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            newPreviews.push(result);
            if (newPreviews.length === files.length) {
              setImagePreviews(newPreviews);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    
    // تحقق من البيانات
    if (!formData.title.trim()) return setSubmitError('برجاء إدخال عنوان العرض');
    if (formData.title.trim().length < 5) return setSubmitError('عنوان العرض يجب أن يكون 5 أحرف على الأقل');
    
    if (!formData.discount.trim()) return setSubmitError('برجاء إدخال نسبة الخصم');
    
    // تحقق من صيغة الخصم
    const discountRegex = /^\d+(\.\d+)?%?$/;
    if (!discountRegex.test(formData.discount.trim())) {
      return setSubmitError('صيغة الخصم غير صحيحة. مثال: 50% أو 50');
    }
    
    const discountValue = parseFloat(formData.discount.replace('%', ''));
    if (discountValue <= 0 || discountValue > 100) {
      return setSubmitError('نسبة الخصم يجب أن تكون بين 1% و 100%');
    }
    
    if (!formData.expiryDate) return setSubmitError('برجاء اختيار تاريخ انتهاء العرض');
    
    // تحقق من تاريخ الانتهاء
    const expiryDate = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate <= today) {
      return setSubmitError('تاريخ الانتهاء يجب أن يكون في المستقبل');
    }
    
    // تحقق من السعر الأصلي
    if (formData.originalPrice) {
      const price = parseFloat(formData.originalPrice);
      if (isNaN(price) || price <= 0) {
        return setSubmitError('السعر الأصلي يجب أن يكون رقماً موجباً');
      }
    }

    // تحقق ورفع الصور
    let imageUrls = [...existingImages];
    
    if (selectedFiles.length > 0) {
      // تحقق من حجم الصور
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) {
          return setSubmitError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        }
        if (!file.type.startsWith('image/')) {
          return setSubmitError('يجب رفع صور فقط');
        }
      }
      
      try {
        const uploadPromises = selectedFiles.map(async (file) => {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          const uploadRes = await vendorApi().post('/upload', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
          });
          return uploadRes.data.url;
        });
        imageUrls = await Promise.all(uploadPromises);
      } catch (error: any) {
        return setSubmitError('فشل رفع الصور. حاول مرة أخرى.');
      }
    }

    const formattedDiscount = /^\d+$/.test(formData.discount.trim()) 
      ? `${formData.discount.trim()}%` 
      : formData.discount.trim();

    // Use React Query mutation
    updateOffer(
      { id: id as string, data: {
        title: formData.title.trim(),
        description: formData.description.trim() || formData.title.trim(),
        discount: formattedDiscount,
        endDate: new Date(formData.expiryDate).toISOString(),
        images: imageUrls,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      }},
      {
        onSuccess: () => {
          router.push('/dashboard/offers');
        },
        onError: (error: any) => {
          console.error('Submit Error:', error);
          const msg = error.response?.data?.message;
          const status = error.response?.status;
          
          if (status === 401) {
            setSubmitError('انتهت جلستك، برجاء تسجيل الدخول مرة أخرى');
          } else if (status === 413) {
            setSubmitError('حجم الملفات كبير جداً');
          } else if (msg) {
            setSubmitError(
              Array.isArray(msg) ? msg.join(' | ') : 
              msg || 'حدث خطأ في الخادم. تأكد من أن جميع الحقول صحيحة.'
            );
          } else {
            setSubmitError(`عفواً، حدث خطأ في الخادم (${status || 'Connection Error'}). تأكد من اتصال الإنترنت وحاول مرة أخرى.`);
          }
        },
      }
    );
  };

  if (!id) return <div className="p-8 text-center text-text-dim">لم يتم تحديد العرض.</div>;
  if (submitError && !formData.title) return <DashboardSkeleton />;

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
               تعديل العرض <Sparkles className="text-primary" size={24} />
            </h1>
            <p className="text-text-dim mt-1 font-bold text-sm">قم بتحديث بيانات العرض وسيتم مراجعته وتفعيله فوراً</p>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[11px] font-black text-text-dim uppercase tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon size={14} /> صور العرض (حتى 5 صور)
                  </label>
                  <span className="text-[10px] font-bold text-primary/60">رفع صور جديدة سيستبدل الصور القديمة</span>
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
                          className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border border-white/10 group/img"
                        >
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                             <span className="text-[10px] text-white font-black">تغيير الكل</span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                          <Upload className="text-text-dim" size={32} />
                        </div>
                        <p className="text-sm font-black text-text">اضغط لرفع حتى 5 صور</p>
                      </div>
                    )}
                  </AnimatePresence>
                  <input id="imageInput" type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
                </div>
              </div>

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

        <div className="xl:col-span-4 space-y-8">
           <div className="flex items-center gap-2 text-text-dimmer text-[11px] font-black uppercase tracking-widest px-2">
             <Info size={14} className="text-primary" /> معاينة العرض
           </div>

           <div className="glass rounded-[3rem] p-6 border border-white/5 inner-shadow relative">
              <div className="aspect-[4/5] rounded-[2.5rem] bg-white/5 border border-white/5 overflow-hidden relative">
                 {imagePreviews.length > 0 ? (
                    <div className="w-full h-full relative">
                       <img src={imagePreviews[0]} className="w-full h-full object-cover" alt="Preview" />
                       {imagePreviews.length > 1 && (
                         <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white border border-white/10">
                           + {imagePreviews.length - 1} صور أخرى
                         </div>
                       )}
                    </div>
                  ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-text-dimmer opacity-20">
                     <ImageIcon size={64} strokeWidth={1} />
                     <p className="mt-4 text-[10px] font-black">انتظار الصورة...</p>
                   </div>
                  )}
                  <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 rounded-2xl text-[12px] font-black">
                    {formData.discount || '0%'} خصم
                  </div>
              </div>

              <div className="mt-6 space-y-4">
                 <h3 className="text-xl font-black text-text leading-tight">{formData.title || 'عنوان العرض'}</h3>
                 <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                       {Boolean(formData.originalPrice) && (
                         <span className="text-xs text-text-dimmer line-through">EGP {formData.originalPrice}</span>
                       )}
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-text">
                            {showDiscountedPrice 
                              ? `EGP ${!isNaN(Number(discountedPrice)) ? discountedPrice : '0.00'}` 
                              : (formData.discount ? formData.discount : '0.00')}
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
