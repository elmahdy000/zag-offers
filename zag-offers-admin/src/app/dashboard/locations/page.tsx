'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, MapPinned, Plus, RefreshCw } from 'lucide-react';
import { adminApi, getApiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';

type Area = { id: string; name: string; isActive: boolean; priority: number };
type City = { id: string; name: string; isActive: boolean; priority: number; areas: Area[]; _count: { stores: number; branches: number } };

export default function LocationsPage() {
  const [cityName, setCityName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [cityId, setCityId] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const locations = useQuery({ queryKey: ['admin-locations'], queryFn: async () => (await adminApi().get<City[]>('/admin/locations')).data });
  const addCity = useMutation({ mutationFn: () => adminApi().post('/admin/locations/cities', { name: cityName }), onSuccess: () => { setCityName(''); void queryClient.invalidateQueries({ queryKey: ['admin-locations'] }); showToast('تمت إضافة المدينة'); }, onError: e => showToast(getApiErrorMessage(e, 'تعذر إضافة المدينة'), 'error') });
  const addArea = useMutation({ mutationFn: () => adminApi().post('/admin/locations/areas', { name: areaName, cityId }), onSuccess: () => { setAreaName(''); void queryClient.invalidateQueries({ queryKey: ['admin-locations'] }); showToast('تمت إضافة المنطقة'); }, onError: e => showToast(getApiErrorMessage(e, 'تعذر إضافة المنطقة'), 'error') });
  const toggleCity = useMutation({ mutationFn: (city: City) => adminApi().patch(`/admin/locations/cities/${city.id}`, { isActive: !city.isActive }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-locations'] }) });
  const toggleArea = useMutation({ mutationFn: (area: Area) => adminApi().patch(`/admin/locations/areas/${area.id}`, { isActive: !area.isActive }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-locations'] }) });
  const submitCity = (e: FormEvent) => { e.preventDefault(); if (cityName.trim()) addCity.mutate(); };
  const submitArea = (e: FormEvent) => { e.preventDefault(); if (cityId && areaName.trim()) addArea.mutate(); };

  return <div className="space-y-6 p-5 sm:p-6 lg:p-10">
    <PageHeader title="المدن والمناطق" description="إدارة نطاق تغطية Zag Offers وتجهيز التوسع الجغرافي" icon={MapPinned} />
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={submitCity} className="admin-panel flex gap-2 p-4"><input value={cityName} onChange={e => setCityName(e.target.value)} placeholder="اسم المدينة" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-500"/><button disabled={addCity.isPending} className="flex h-11 items-center gap-2 rounded-xl bg-orange-600 px-4 text-xs font-bold text-white"><Plus size={16}/>إضافة مدينة</button></form>
      <form onSubmit={submitArea} className="admin-panel grid gap-2 p-4 sm:grid-cols-[1fr_1fr_auto]"><select value={cityId} onChange={e => setCityId(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"><option value="">اختر المدينة</option>{locations.data?.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select><input value={areaName} onChange={e => setAreaName(e.target.value)} placeholder="اسم المنطقة" className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-orange-500"/><button disabled={addArea.isPending} className="flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white"><Plus size={16}/>إضافة منطقة</button></form>
    </div>
    {locations.isLoading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-orange-600"/></div> : locations.isError ? <button onClick={() => locations.refetch()} className="mx-auto flex gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white"><RefreshCw size={16}/>إعادة المحاولة</button> :
      <div className="grid gap-4 lg:grid-cols-2">{locations.data?.map(city => <section key={city.id} className="admin-panel overflow-hidden">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><MapPinned size={18}/></span><div className="flex-1"><h2 className="text-sm font-black text-slate-900">{city.name}</h2><p className="text-[11px] text-slate-500">{city._count.stores} متجر · {city._count.branches} فرع</p></div><button onClick={() => toggleCity.mutate(city)} className={`rounded-lg px-3 py-2 text-[11px] font-bold ${city.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{city.isActive ? 'نشطة' : 'موقوفة'}</button></header>
        <div className="divide-y divide-slate-100">{city.areas.map(area => <div key={area.id} className="flex items-center gap-3 px-5 py-3"><MapPin size={15} className="text-slate-400"/><span className="flex-1 text-sm font-bold text-slate-700">{area.name}</span><button onClick={() => toggleArea.mutate(area)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold ${area.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{area.isActive ? 'متاحة' : 'موقوفة'}</button></div>)}{city.areas.length === 0 && <p className="p-5 text-xs text-slate-400">لم تُضف مناطق بعد.</p>}</div>
      </section>)}</div>}
  </div>;
}
