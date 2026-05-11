'use client';
import { useState, useEffect } from 'react';
import { Upload, ArrowRight, Save, Info, Calendar, Percent, Loader2, Tag, LayoutDashboard, Sparkles, Image as ImageIcon, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorApi, resolveImageUrl } from '@/lib/api';
import { useUpdateOffer, useDeleteOffer } from '@/hooks/use-vendor-api';
import { compressImage } from '@/lib/image-utils';
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
  const [offerImages, setOfferImages] = useState<{ url: string; file?: File }[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // React Query hooks
  const { mutate: updateOffer, isPending: submittingQuery } = useUpdateOffer();
  const [isUploading, setIsUploading] = useState(false);
  const submitting = submittingQuery || isUploading;
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
          setOfferImages(o.images.map((img: string) => ({ url: resolveImageUrl(img) })));
        }
      })
      .catch(err => {
        console.error(err);
        setSubmitError('تعذر تحميل بيانات العرض');
      });
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (offerImages.length + files.length > 5) {
      setSubmitError('الحد الأقصى هو 5 صور فقط');
      return;
    }

    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const newImage = { url: reader.result, file };
            setOfferImages(prev => [...prev, newImage]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setOfferImages(prev => prev.filter((_, i) => i !== index));
    const input = document.getElementById('imageInput') as HTMLInputElement;
    if (input) input.value = '';
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
    let imageUrls: string[] = [];
    setIsUploading(true);
    
    try {
      const uploadPromises = offerImages.map(async (img) => {
        // If it already has a URL (and no file), it's an existing image
        if (!img.file && (img.url.startsWith('http') || img.url.startsWith('/'))) {
          // Extract the path from the full URL if needed, 
          // or just keep it as is if the backend handles full URLs
          // For consistency with create, let's try to get just the filename if it's from our server
          return img.url.split('/').pop() || img.url;
        }
        
        // If it has a file, upload it
        if (img.file) {
          let fileToUpload = img.file;
          
          // إذا كانت الصورة أكبر من 1 ميجا، نقوم بضغطها تلقائياً
          if (fileToUpload.size > 1 * 1024 * 1024) {
            try {
              fileToUpload = await compressImage(fileToUpload);
            } catch (e) {
              console.error('Compression failed, using original', e);
            }
          }

          // إذا بعد الضغط لسه أكبر من 5 ميجا (صعبة جداً)، نرفضها
          if (fileToUpload.size > 5 * 1024 * 1024) {
            throw new Error(`حجم الصورة ${fileToUpload.name} كبير جداً حتى بعد الضغط`);
          }

          const uploadFormData = new FormData();
          uploadFormData.append('file', fileToUpload);
          const uploadRes = await vendorApi().post('/upload', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
          });
          return uploadRes.data.url;
        }
        
        return null;
      });

      const results = await Promise.all(uploadPromises);
      imageUrls = results.filter((url): url is string => url !== null);
    } catch (error: unknown) {
      setIsUploading(false);
      return setSubmitError('فشل معالجة الصور. حاول مرة أخرى.');
    }

    if (imageUrls.length === 0) {
      setIsUploading(false);
      return setSubmitError('يجب وجود صورة واحدة على الأقل للعرض');
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
          setIsUploading(false);
          router.push('/dashboard/offers');
        },
        onError: (error: unknown) => {
          console.error('Submit Error:', error);
          const axiosErr = error as { response?: { data?: { message?: string | string[] }, status?: number } };
          const msg = axiosErr.response?.data?.message;
          const status = axiosErr.response?.status;
          
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
          setIsUploading(false);
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
                    <ImageIcon size={14} /> صور العرض (الصورة الأولى هي الرئيسية)
                  </label>
                  <span className="text-[10px] font-bold text-primary/60">يمكنك رفع حتى 5 صور</span>
                </div>
                
                <div
                  className="relative min-h-[200px] rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.02] p-4 flex flex-wrap gap-4 items-center justify-center cursor-pointer group transition-all hover:border-primary/30"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  <AnimatePresence mode="popLayout">
                    {offerImages.length > 0 ? (
                      offerImages.map((img, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border ${index === 0 ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10'} group/img shadow-xl`}
                        >
                          <img src={img.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                          {index === 0 && (
                            <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg">رئيسية</div>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                          >
                            <span className="text-[10px] font-black">×</span>
                          </button>
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
                 {offerImages.length > 0 ? (
                    <img src={offerImages[0].url} className="w-full h-full object-cover" alt="Preview" />
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

              {offerImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {offerImages.map((img, i) => (
                    <div key={i} className={`w-12 h-12 rounded-xl border-2 shrink-0 overflow-hidden ${i === 0 ? 'border-primary' : 'border-white/10'}`}>
                      <img src={img.url} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

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
