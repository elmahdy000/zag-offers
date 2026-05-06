'use client';
import { useState } from 'react';
import { Upload, ArrowRight, Save, Info, Calendar, Percent, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
        if (typeof result === 'string') {
          setImagePreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!formData.title.trim()) {
      setSubmitError('برجاء إدخال عنوان العرض');
      return;
    }
    if (!formData.discount.trim()) {
      setSubmitError('برجاء إدخال نسبة الخصم');
      return;
    }
    if (!formData.expiryDate) {
      setSubmitError('برجاء اختيار تاريخ انتهاء العرض');
      return;
    }

    const storeId = getVendorStoreId();
    if (!storeId) {
      setSubmitError('لم يتم ربط متجر بحسابك. تواصل مع الإدارة.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];

      // 1. Upload image if selected
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        
        const uploadRes = await vendorApi().post('/upload', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data.url) {
          imageUrls.push(uploadRes.data.url);
        }
      }

      // 2. Create offer with images
      await vendorApi().post('/offers', {
        title: formData.title.trim(),
        description: formData.description.trim() || formData.title.trim(),
        discount: `${formData.discount}%`,
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
    <div className="min-h-screen bg-[#f8f9fa] p-8 dir-rtl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-all"
      >
        <ArrowRight size={20} />
        العودة للوحة التحكم
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Container */}
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-black mb-8">إضافة عرض جديد 🏷️</h1>

            {submitError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl">
                {submitError}
              </div>
            )}

            <div className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">صورة العرض</label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-orange-500 transition-all cursor-pointer bg-gray-50 group"
                  onClick={() => document.getElementById('imageInput')?.click()}
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-xl shadow-sm" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="text-orange-600" size={32} />
                      </div>
                      <p className="text-sm text-gray-500">اضغط هنا أو اسحب الصورة لرفعها</p>
                      <p className="text-xs text-gray-400 mt-1">يفضل أن تكون الأبعاد مربعة (1:1)</p>
                    </div>
                  )}
                  <input id="imageInput" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </div>
              </div>

              {/* Title & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">عنوان العرض *</label>
                  <input
                    type="text"
                    placeholder="مثلاً: خصم 50% على البيتزا الكبيرة"
                    className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">تاريخ الانتهاء *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">وصف العرض</label>
                <textarea
                  placeholder="اشرح تفاصيل العرض للعملاء..."
                  rows={4}
                  className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Discount & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">نسبة الخصم (%) *</label>
                  <div className="relative">
                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="20"
                      className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">السعر الأصلي (اختياري)</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Save size={24} />
                  )}
                  {submitting ? 'جاري الإرسال...' : 'نشر العرض الآن'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="w-full lg:w-96">
          <div className="sticky top-8 space-y-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Info size={16} />
              معاينة العرض كما سيظهر في تطبيق الموبايل
            </div>

            <div className="bg-white rounded-[2.5rem] p-4 shadow-2xl border border-gray-100 w-full max-w-[320px] mx-auto">
              <div className="aspect-square bg-gray-100 rounded-3xl mb-4 overflow-hidden flex items-center justify-center relative">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <Upload className="text-gray-300" size={48} />
                )}
                {formData.discount && (
                  <div className="absolute top-4 right-4 bg-orange-600 text-white text-xs font-black px-3 py-1.5 rounded-full">
                    {formData.discount}% خصم
                  </div>
                )}
              </div>
              <div className="px-2 pb-2">
                <h3 className="font-bold text-lg line-clamp-1">
                  {formData.title || 'عنوان العرض يظهر هنا'}
                </h3>
                <p className="text-gray-400 text-sm mt-1">اسم متجرك المميز</p>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    {formData.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        EGP {formData.originalPrice}
                      </span>
                    )}
                    <span className="font-black text-orange-600">
                      {formData.originalPrice && formData.discount
                        ? `EGP ${(Number(formData.originalPrice) * (1 - Number(formData.discount) / 100)).toFixed(0)}`
                        : formData.discount
                        ? `خصم ${formData.discount}%`
                        : 'السعر بعد الخصم'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <p className="text-blue-800 text-xs leading-relaxed">
                سيتم مراجعة العرض من قبل إدارة <b>Zag Offers</b> والموافقة عليه في خلال ساعة لضمان جودة الصور والعروض.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
