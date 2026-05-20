'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Tag, Store, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
  actionUrl?: string | null;
  isActive: boolean;
  priority: number;
  offer?: { id: string; title: string } | null;
  store?: { id: string; name: string } | null;
};

const initialForm = {
  title: '',
  subtitle: '',
  tag: '',
  image: '',
  actionUrl: '',
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

  // حقول ربط البانر بعرض أو متجر أو رابط خارجي
  const [linkType, setLinkType] = useState<'none' | 'offer' | 'store' | 'url'>('none');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  // جلب العروض والشركات لربط البانر
  const { data: offersData = [] } = useQuery({
    queryKey: ['all-offers-list'],
    queryFn: async () => {
      const res = await adminApi().get('/admin/offers', { params: { limit: 100 } });
      return Array.isArray(res.data.items) ? res.data.items : [];
    },
    enabled: isOpen,
  });

  const { data: storesData = [] } = useQuery({
    queryKey: ['all-stores-list'],
    queryFn: async () => {
      const res = await adminApi().get('/admin/stores', { params: { limit: 100 } });
      return Array.isArray(res.data.items) ? res.data.items : [];
    },
    enabled: isOpen,
  });

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
      let finalActionUrl = null;
      if (linkType === 'offer' && selectedOfferId) {
        finalActionUrl = `offer:${selectedOfferId}`;
      } else if (linkType === 'store' && selectedStoreId) {
        finalActionUrl = `store:${selectedStoreId}`;
      } else if (linkType === 'url' && externalUrl) {
        finalActionUrl = externalUrl;
      }

      const payload = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        tag: form.tag || undefined,
        image: form.image || undefined,
        actionUrl: finalActionUrl,
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
    setLinkType('none');
    setSelectedOfferId('');
    setSelectedStoreId('');
    setExternalUrl('');
    setForm(initialForm);
    setIsOpen(true);
  };

  const openEdit = (banner: BannerItem) => {
    setEditing(banner);
    
    // فك تشفير رابط التوجيه عند التعديل
    const actionUrl = banner.actionUrl || '';
    if (actionUrl.startsWith('offer:')) {
      setLinkType('offer');
      setSelectedOfferId(actionUrl.substring(6));
      setSelectedStoreId('');
      setExternalUrl('');
    } else if (actionUrl.startsWith('store:')) {
      setLinkType('store');
      setSelectedStoreId(actionUrl.substring(6));
      setSelectedOfferId('');
      setExternalUrl('');
    } else if (actionUrl.startsWith('http://') || actionUrl.startsWith('https://')) {
      setLinkType('url');
      setExternalUrl(actionUrl);
      setSelectedOfferId('');
      setSelectedStoreId('');
    } else {
      setLinkType('none');
      setSelectedOfferId('');
      setSelectedStoreId('');
      setExternalUrl('');
    }

    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      tag: banner.tag || '',
      image: banner.image || '',
      actionUrl: banner.actionUrl || '',
      priority: banner.priority || 0,
      isActive: banner.isActive,
    });
    setIsOpen(true);
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت', 'error');
      return;
    }

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
                <div className="mt-3 space-y-1">
                  <div className="text-sm font-bold text-slate-900">{banner.title}</div>
                  <div className="text-xs text-slate-500">{banner.subtitle || '-'}</div>
                  <div className="text-xs text-slate-400">Priority: {banner.priority} | {banner.isActive ? 'Active' : 'Inactive'}</div>
                  
                  {/* وجهة التوجيه */}
                  <div className="mt-2 text-xs pt-1.5 border-t border-slate-50">
                    {banner.offer ? (
                      <Link 
                        href={`/dashboard/offers/${banner.offer.id}`}
                        className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:underline"
                      >
                        <Tag size={12} />
                        <span>عرض: {banner.offer.title}</span>
                      </Link>
                    ) : banner.store ? (
                      <Link 
                        href={`/dashboard/merchants/${banner.store.id}`}
                        className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline"
                      >
                        <Store size={12} />
                        <span>متجر: {banner.store.name}</span>
                      </Link>
                    ) : banner.actionUrl ? (
                      <a 
                        href={banner.actionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                      >
                        <ExternalLink size={12} />
                        <span>رابط خارجي</span>
                      </a>
                    ) : (
                      <span className="text-slate-400">بدون توجيه</span>
                    )}
                  </div>
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
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-bold">{editing ? 'تعديل بانر' : 'إضافة بانر'}</h3>
            <div className="space-y-3">
              <input className="w-full rounded-xl border px-3 py-2" placeholder="العنوان" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="الوصف" value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
              <input className="w-full rounded-xl border px-3 py-2" placeholder="التاج" value={form.tag} onChange={(e) => setForm((p) => ({ ...p, tag: e.target.value }))} />
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نوع رابط التوجيه</label>
                <select 
                  className="w-full rounded-xl border px-3 py-2" 
                  value={linkType} 
                  onChange={(e) => setLinkType(e.target.value as any)}
                >
                  <option value="none">لا يوجد رابط</option>
                  <option value="offer">ربط بعرض (شاشة تفاصيل العرض)</option>
                  <option value="store">ربط بمتجر (شاشة المتجر)</option>
                  <option value="url">رابط خارجي (موقع ويب)</option>
                </select>
              </div>

              {linkType === 'offer' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">اختر العرض</label>
                  <select 
                    className="w-full rounded-xl border px-3 py-2 text-sm" 
                    value={selectedOfferId} 
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                  >
                    <option value="">اختر عرض...</option>
                    {offersData.map((off: any) => (
                      <option key={off.id} value={off.id}>
                        {off.title} {off.store?.name ? `(${off.store.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'store' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">اختر المتجر</label>
                  <select 
                    className="w-full rounded-xl border px-3 py-2 text-sm" 
                    value={selectedStoreId} 
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                  >
                    <option value="">اختر متجر...</option>
                    {storesData.map((st: any) => (
                      <option key={st.id} value={st.id}>
                        {st.name} {st.area ? `(${st.area})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {linkType === 'url' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">الرابط الخارجي</label>
                  <input 
                    className="w-full rounded-xl border px-3 py-2" 
                    dir="ltr" 
                    placeholder="https://example.com" 
                    value={externalUrl} 
                    onChange={(e) => setExternalUrl(e.target.value)} 
                  />
                </div>
              )}

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
