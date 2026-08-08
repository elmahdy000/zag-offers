import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6" dir="rtl">
      <section className="max-w-md text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600/15 text-orange-500"><WifiOff size={30} /></span>
        <h1 className="text-2xl font-black">لا يوجد اتصال بالإنترنت</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">أعد الاتصال ثم حاول فتح لوحة الإدارة مرة أخرى. لا يتم حفظ بيانات الإدارة الحساسة على الجهاز.</p>
        <Link href="/dashboard" className="mt-7 inline-flex h-11 items-center rounded-xl bg-orange-600 px-6 text-sm font-black hover:bg-orange-500">إعادة المحاولة</Link>
      </section>
    </main>
  );
}
