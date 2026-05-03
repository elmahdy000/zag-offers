'use client';
import { Store, MapPin, Phone, Mail, Camera, Save } from 'lucide-react';

export default function StoreProfilePage() {
  return (
    <div className="p-8 dir-rtl max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-8">إعدادات المتجر</h1>

      <div className="space-y-8">
        {/* Logo Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
              <Store size={48} className="text-gray-300" />
            </div>
            <button className="absolute bottom-0 left-0 bg-orange-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all">
              <Camera size={20} />
            </button>
          </div>
          <h2 className="mt-4 font-bold text-lg">لوجو المحل</h2>
          <p className="text-gray-400 text-sm">يظهر للعملاء في الصفحة الرئيسية</p>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 mr-1">اسم المتجر</label>
              <div className="relative">
                <Store className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" defaultValue="بيتزا الزقازيق الأصلية" className="w-full bg-gray-50 border-none rounded-xl py-3.5 pr-12 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 mr-1">رقم الموبايل للتواصل</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="tel" defaultValue="01012345678" className="w-full bg-gray-50 border-none rounded-xl py-3.5 pr-12 focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mr-1">العنوان بالتفصيل</label>
            <div className="relative">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" defaultValue="الزقازيق - القومية - شارع المحافظة" className="w-full bg-gray-50 border-none rounded-xl py-3.5 pr-12 focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 mr-1">البريد الإلكتروني (للفواتير)</label>
            <div className="relative">
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="email" defaultValue="store@zagoffers.com" className="w-full bg-gray-50 border-none rounded-xl py-3.5 pr-12 focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>
        </div>

        <button className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
          <Save size={24} />
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}
