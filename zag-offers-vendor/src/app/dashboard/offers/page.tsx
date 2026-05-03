'use client';
import { Tag, Edit3, Trash2, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default function OffersListPage() {
  const offers = [
    { id: 1, title: 'خصم 50% على البيتزا الكبيرة', status: 'نشط', views: 1240, redemptions: 45, date: '2026-05-01' },
    { id: 2, title: 'اشتري قطعة واحصل على الثانية مجاناً', status: 'مرفوض', views: 0, redemptions: 0, date: '2026-04-30' },
    { id: 3, title: 'وجبة التوفير العائلية', status: 'قيد المراجعة', views: 450, redemptions: 12, date: '2026-04-28' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'نشط') return 'bg-green-100 text-green-700';
    if (status === 'مرفوض') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="p-8 dir-rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black">إدارة العروض</h1>
          <p className="text-gray-500">تحكم في عروضك وتابع أداءها</p>
        </div>
        <Link href="/dashboard/offers/new" className="bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-700 transition-all">
          <Plus size={20} />
          إضافة عرض
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">العرض</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">المشاهدات</th>
              <th className="p-4">الاستخدام</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {offers.map((offer) => (
              <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-bold">{offer.title}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(offer.status)}`}>
                    {offer.status}
                  </span>
                </td>
                <td className="p-4 flex items-center gap-2 text-gray-500">
                  <Eye size={16} /> {offer.views}
                </td>
                <td className="p-4 text-orange-600 font-bold">{offer.redemptions}</td>
                <td className="p-4 text-gray-400 text-sm">{offer.date}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
