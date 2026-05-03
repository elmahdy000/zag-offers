'use client';
import { Search, Filter, Download, UserCheck } from 'lucide-react';

export default function CouponsLogPage() {
  const redemptions = [
    { id: 1, user: 'محمد السيد', offer: 'خصم 50% بيتزا', code: 'ZAG-882', status: 'ناجح', time: '10:30 ص' },
    { id: 2, user: 'سارة أحمد', offer: 'وجبة التوفير', code: 'ZAG-114', status: 'ناجح', time: '09:15 ص' },
    { id: 3, user: 'إبراهيم علي', offer: 'خصم 50% بيتزا', code: 'ZAG-009', status: 'فاشل', time: 'أمس' },
  ];

  return (
    <div className="p-8 dir-rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black">سجل الكوبونات</h1>
          <p className="text-gray-500">تابع عمليات الخصم اللي تمت في محلك</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
          <Download size={18} />
          تصدير Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-gray-50 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="ابحث باسم العميل أو الكود..." className="w-full bg-gray-50 border-none rounded-xl py-2.5 pr-10 outline-none" />
        </div>
        <button className="px-4 py-2 bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900"><Filter size={20} /></button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">العميل</th>
              <th className="p-4">العرض المستخدم</th>
              <th className="p-4">الكود</th>
              <th className="p-4">الوقت</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {redemptions.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                    {log.user[0]}
                  </div>
                  {log.user}
                </td>
                <td className="p-4 text-gray-600">{log.offer}</td>
                <td className="p-4 font-mono font-bold text-gray-900">{log.code}</td>
                <td className="p-4 text-gray-400 text-sm">{log.time}</td>
                <td className="p-4">
                  <div className={`flex items-center gap-1 font-bold text-xs ${log.status === 'ناجح' ? 'text-green-600' : 'text-red-600'}`}>
                    <UserCheck size={14} />
                    {log.status}
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
