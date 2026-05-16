'use client';

import { useState } from 'react';
import {
  Loader2,
  Plus,
  X,
  Trash2,
  ListFilter,
  Image as ImageIcon,
  Edit,
  Store,
  ChevronRight
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, resolveImageUrl } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

interface CategoryItem {
  id: string;
  name: string;
  image?: string | null;
  _count?: {
    stores: number;
  };
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<CategoryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
  });

  // Queries
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminApi().get('/admin/categories');
      return response.data as CategoryItem[];
    },
  });

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: (data: any) => {
      return editingCategory
        ? adminApi().patch(`/admin/categories/${editingCategory.id}`, data)
        : adminApi().post('/admin/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast(editingCategory ? 'تم تحديث الفئة بنجاح' : 'تم إضافة الفئة بنجاح');
      setIsUpsertOpen(false);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'فشل تنفيذ العملية', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('تم حذف الفئة بنجاح');
      setDeleteModal(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'فشل حذف الفئة', 'error');
    }
  });

  // Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await adminApi().post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({ ...prev, image: response.data.url }));
      showToast('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('فشل رفع الصورة', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const openUpsert = (category?: CategoryItem) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: category.image || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', image: '' });
    }
    setIsUpsertOpen(true);
  };

  return (
    <div className="p-6 lg:p-10 font-cairo">
      <PageHeader 
        title="إدارة التصنيفات" 
        subtitle="إضافة وتعديل فئات المتاجر الرئيسية"
        icon={ListFilter}
      >
        <button 
          onClick={() => openUpsert()}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-700 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={20} />
          <span>إضافة فئة جديدة</span>
        </button>
      </PageHeader>

      {/* Categories Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[2.5rem] bg-slate-100 border border-slate-200" />
          ))
        ) : categories?.map((category) => (
          <motion.div 
            layout
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col rounded-[2.5rem] bg-white p-6 border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:border-orange-100"
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-orange-200 transition-all">
                {category.image ? (
                  <img src={resolveImageUrl(category.image)} alt={category.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={24} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{category.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Store size={12} />
                    <span>{category._count?.stores || 0} متجر</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => openUpsert(category)}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-50 text-sm font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-all border border-slate-100"
              >
                <Edit size={14} />
                <span>تعديل</span>
              </button>
              <button 
                onClick={() => setDeleteModal(category)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <button className="absolute top-4 left-4 h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-orange-600">
               <ChevronRight size={16} className="rotate-180" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Upsert Modal */}
      <AnimatePresence>
        {isUpsertOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-cairo">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg rounded-[2.5rem] bg-white p-10 shadow-2xl relative border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    إدارة فئات النظام
                  </p>
                </div>
                <button 
                  onClick={() => setIsUpsertOpen(false)} 
                  className="rounded-xl bg-slate-50 p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  upsertMutation.mutate(formData);
                }}
                className="space-y-6"
              >
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    أيقونة / صورة الفئة
                  </label>
                  <div 
                    className="relative group h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all overflow-hidden"
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin text-orange-600" size={24} />
                    ) : formData.image ? (
                      <>
                        <img src={resolveImageUrl(formData.image)} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-4" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-white text-xs font-bold uppercase tracking-widest">تغيير الصورة</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-slate-300 group-hover:text-orange-400" />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-orange-600 mt-2">رفع صورة الفئة</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      disabled={isUploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
                    اسم الفئة
                  </label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="مثلاً: مطاعم، ملابس..."
                    className="h-12 w-full rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-900 border border-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={upsertMutation.isPending || isUploading}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-xl shadow-slate-200 transition-all hover:bg-orange-600 hover:shadow-orange-200 active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {upsertMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : (editingCategory ? 'تحديث الفئة' : 'إضافة الفئة')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-cairo">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center shadow-2xl border border-slate-100"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-50 text-rose-600 mb-6 border border-rose-100">
                 <Trash2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">حذف الفئة</h3>
              <p className="mt-4 text-sm font-medium text-slate-500 leading-relaxed px-2">
                أنت على وشك حذف فئة "{deleteModal.name}". سيؤثر هذا على جميع المتاجر المرتبطة بها. هل أنت متأكد؟
              </p>
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => deleteMutation.mutate(deleteModal.id)} 
                  disabled={deleteMutation.isPending} 
                  className="flex-[2] h-12 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-lg shadow-rose-900/10 transition-all hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'تأكيد الحذف'}
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
