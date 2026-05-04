'use client';

import { useState } from 'react';
import {
  Loader2,
  Plus,
  Search,
  ListFilter,
  X,
  Trash2,
  Pencil,
  AlertTriangle,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '@/lib/api';

// Components
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

interface Category {
  id: string;
  name: string;
  _count: { stores: number };
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [deleteModal, setDeleteModal] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminApi().get<Category[]>('/admin/categories');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi().post('/admin/categories', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('تم إضافة التصنيف بنجاح');
      closeModal();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل إضافة التصنيف', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      adminApi().patch(`/admin/categories/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('تم تحديث التصنيف بنجاح');
      closeModal();
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل تحديث التصنيف', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      showToast('تم حذف التصنيف بنجاح');
      setDeleteModal(null);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'فشل حذف التصنيف', 'error');
    }
  });

  const filteredCategories = Array.isArray(categories)
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, name: categoryName });
    } else {
      createMutation.mutate(categoryName);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <PageHeader
          title="إدارة التصنيفات"
          description="إضافة وتعديل تصنيفات المتاجر لتسهيل عملية التصفح والبحث للعملاء"
          icon={ListFilter}
        />
        <button
          onClick={() => openModal()}
          className="h-12 px-6 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-900/10 hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} /> إضافة تصنيف جديد
        </button>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن تصنيف محدد..."
          className="h-[48px] w-full rounded-xl border border-slate-200 bg-white pr-11 pl-4 text-sm font-medium shadow-sm focus:border-orange-500 focus:outline-none transition-all"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse bg-white rounded-2xl border border-slate-100 shadow-sm" />)}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <LayoutGrid size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-bold">لا يوجد تصنيفات حالياً</p>
          <p className="text-sm font-medium mt-1">ابدأ بإضافة تصنيفات جديدة للمنصة</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group flex flex-col justify-between p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-orange-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{category.name}</h3>
                  <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center gap-1.5">
                    <LayoutGrid size={12} className="text-orange-500" /> {category._count?.stores || 0} متجر مشترك
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openModal(category)} className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if ((category._count?.stores || 0) > 0) {
                        showToast(`لا يمكن حذف "${category.name}" لوجود ${category._count?.stores} متجر مرتبط به`, 'error');
                      } else {
                        setDeleteModal(category);
                      }
                    }}
                    className="h-8 w-8 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">{editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h2>
                <button onClick={closeModal} className="rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mr-1">اسم التصنيف</label>
                  <input
                    autoFocus
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="مثلاً: ملابس وأزياء، مطاعم، إلخ..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold focus:border-orange-500 focus:bg-white focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 h-12 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-200 hover:bg-orange-600 transition-all flex items-center justify-center"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin" size={20} /> : (editingCategory ? 'حفظ التعديلات' : 'إضافة التصنيف')}
                  </button>
                  <button type="button" onClick={closeModal} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold hover:bg-slate-200 transition-all">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-6"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900">حذف التصنيف؟</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">هل أنت متأكد من حذف تصنيف "{deleteModal.name}"؟ قد يؤثر ذلك على المتاجر المرتبطة به.</p>
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => deleteMutation.mutate(deleteModal.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/10"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'نعم، احذف'}
                </button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
