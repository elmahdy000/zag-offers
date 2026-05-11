'use client';

import { useState } from 'react';
import { Star, Camera, CheckCircle2, User, Image as ImageIcon, Send, Loader2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '@/lib/utils';
import { API_URL } from '@/lib/constants';

interface Review {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  isVerified: boolean;
  createdAt: string;
  customer: {
    name: string;
    avatar?: string;
  };
}

interface ReviewSectionProps {
  offerId: string;
  reviews: Review[];
  onReviewAdded?: () => void;
  isVerifiedUser: boolean; // Based on coupon generation/usage
}

export function ReviewSection({ offerId, reviews, onReviewAdded, isVerifiedUser }: ReviewSectionProps) {
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) {
      setError('الحد الأقصى 4 صور');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('يرجى كتابة تعليق');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      // 1. Upload images first
      const imageUrls: string[] = [];
      for (const img of images) {
        const formData = new FormData();
        formData.append('file', img.file);
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrls.push(data.url);
        }
      }

      // 2. Post review
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          offerId,
          rating,
          comment,
          images: imageUrls
        })
      });

      if (res.ok) {
        setIsWriting(false);
        setComment('');
        setImages([]);
        onReviewAdded?.();
      } else {
        const data = await res.json();
        setError(data.message || 'فشل في إضافة التقييم');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 mt-16 pt-16 border-t border-white/5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
             آراء ومصداقية العملاء <Sparkles className="text-[#FF6B00]" size={24} />
          </h3>
          <p className="text-white/40 font-bold text-sm mt-1">تجارب حقيقية من أشخاص استخدموا العرض بالفعل</p>
        </div>
        {!isWriting && (
          <button 
            onClick={() => setIsWriting(true)}
            className="px-6 py-3 bg-white text-black font-black rounded-2xl text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            أضف تقييمك
          </button>
        )}
      </div>

      <AnimatePresence>
        {isWriting && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass p-8 rounded-[2rem] border border-white/10 overflow-hidden"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-white/60">تقييمك للعرض</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setRating(s)}
                      className={`transition-all ${s <= rating ? 'text-[#FF6B00] scale-110' : 'text-white/10'}`}
                    >
                      <Star size={28} fill={s <= rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                rows={3}
                placeholder="احكِ لنا عن تجربتك مع العرض والمحل..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white/5 rounded-2xl border border-white/5 p-4 text-sm font-bold focus:outline-none focus:border-[#FF6B00]/50 transition-all resize-none"
              />

              <div className="flex flex-wrap gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                    <img src={img.preview} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(i)}
                      className="absolute top-1 left-1 bg-black/60 text-white rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#FF6B00]/30 transition-all text-white/40">
                    <Camera size={20} />
                    <span className="text-[10px] font-black">أضف صور</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                  </label>
                )}
              </div>

              {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}

              <div className="flex gap-4">
                <button 
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="flex-1 py-4 bg-[#FF6B00] text-white font-black rounded-2xl shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="rotate-180" />}
                  نشر التقييم
                </button>
                <button 
                  onClick={() => setIsWriting(false)}
                  className="px-6 py-4 bg-white/5 text-white/40 font-black rounded-2xl hover:text-white transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-[2rem] border border-white/5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                    {review.customer.avatar ? (
                      <img src={resolveImageUrl(review.customer.avatar)} className="h-full w-full object-cover rounded-2xl" />
                    ) : (
                      <User className="text-white/20" size={20} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      {review.customer.name}
                      {review.isVerified && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-black">
                          <CheckCircle2 size={10} /> تجربة موثقة
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] font-bold text-white/30 mt-1">
                      {new Date(review.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={14} 
                      className={s <= review.rating ? 'text-[#FF6B00]' : 'text-white/5'} 
                      fill={s <= review.rating ? "currentColor" : "none"} 
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm font-bold text-white/70 leading-relaxed pr-2">
                {review.comment}
              </p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pr-2">
                  {review.images.map((img, i) => (
                    <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden border border-white/5 shrink-0 bg-white/5">
                      <img src={resolveImageUrl(img)} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-zoom-in" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/5 text-white/10">
              <Star size={40} />
            </div>
            <p className="text-white/30 font-bold">لا توجد تقييمات لهذا العرض بعد. كن أول من يشاركنا تجربته!</p>
          </div>
        )}
      </div>
    </div>
  );
}
