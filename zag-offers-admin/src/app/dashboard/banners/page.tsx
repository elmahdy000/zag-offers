'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import { useSocketContext } from '@/components/SocketProvider';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';
import { adminApi, resolveImageUrl } from '@/lib/api';

type BannerItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  tag?: string | null;
  image?: string | null;
  isActive: boolean;
  priority: number;
};

const initialForm = {
  title: '',
  subtitle: '',
  tag: '',
  image: '',
  priority: 0,
  isActive: true,
};

export default function BannersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { socket } = useSocketContext();

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<BannerItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!socket) return;
    const onUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    };
    socket.on('banners_updated', onUpdated);
    return () => {
      socket.off('banners_updated', onUpdated);
    };
  }, [socket, queryClient]);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const res = await adminApi().get<BannerItem[]>('/admin/banners');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        tag: form.tag || undefined,
        image: form.image || undefined,
        priority: Number(form.priority || 0),
        isActive: form.isActive,
      };

      return editing
        ? adminApi().patch(`/admin/banners/${editing.id}`, payload)
        : adminApi().post('/admin/banners', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      showToast(editing ? 'تم تحديث البانر بنجاح' : 'تم إضافة البانر بنجاح');
      setIsOpen(false);
      setEditing(null);
      setForm(initialForm);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'فشل حفظ البانر', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi().delete(`/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      showToast('تم حذف البانر');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'فشل حذف البانر', 'error');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setIsOpen(true);
  };

  const openEdit = (banner: BannerItem) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      tag: banner.tag || '',
      image: banner.image || '',
      priority: banner.priority || 0,
      isActive: banner.isActive,
    });
    setIsOpen(true);
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await adminApi().post('/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image: response.data.url }));
      showToast('تم رفع الصورة بنجاح');
    } catch {
      showToast('فشل رفع الصورة', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 font-cairo">
      <PageHeader title="إدارة البانرات" subtitle="بانرات الصفحة الرئيسية في تطبيق العميل" icon={ImageIcon}>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white"
        >
          <Plus size={18} />
          <span>إضافة بانر</span>
        </button>
      </PageHeader>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-3xl bg-slate-100" />
            ))
          : banners.map((banner) => (
              <div key={banner.id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="h-32 overflow-hidden rounded-2xl bg-slate-100">
                  {banner.image ? (
                    <img src={resolveImageUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">No image</div>
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900">{banner.title}</div>
                  <div className="text-xs text-slate-500">{banner.subtitle || '-'}</div>
                  <div className="mt-2 text-xs text-slate-400">Priority: {banner.priority} | {banner.isActive ? 'Active' : 'Inactive'}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(banner)} className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700">
                    <Pencil size={14} className="inline ml-1" /> تعديل
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(banner.id)}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-rose-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold">{editing ? 'تعديل بانر' : 'إضافة بانر'}</h3>
            <div className="space-y-3">
              <input className="w-full rounded-xl border px-3 py-2" placeholder="العنوان" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="الوصف" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="التاج" value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} />
              <input className="w-full rounded-xl border px-3 py-2" type="number" placeholder="الأولوية" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
              <label className="block text-xs font-bold text-slate-500">الصورة</label>
              <input type="file" accept="image/*" onChange={uploadImage} />
              {isUploading && <Loader2 className="animate-spin text-orange-600" size={16} />}
              {form.image ? <img src={resolveImageUrl(form.image)} alt="preview" className="h-24 w-full rounded-xl object-cover" /> : null}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                <span>نشط</span>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setIsOpen(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold">إلغاء</button>
              <button onClick={() => upsertMutation.mutate()} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white">
                {upsertMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
