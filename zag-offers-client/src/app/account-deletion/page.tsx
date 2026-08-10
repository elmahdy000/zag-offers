import Link from 'next/link';
import { ChevronLeft, Mail, ShieldAlert, Smartphone } from 'lucide-react';

export default function AccountDeletionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          aria-label="العودة إلى الصفحة الرئيسية"
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft size={24} className="rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="text-[#FF6B00]" size={24} />
            حذف حساب Zag Offers
          </h1>
          <p className="text-sm text-white/60 mt-1">خطوات حذف الحساب والبيانات المرتبطة به</p>
        </div>
      </div>

      <div className="glass rounded-[32px] p-6 sm:p-10 space-y-8 text-white/80">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#FF6B00] flex items-center gap-2">
            <Smartphone size={20} /> الحذف من التطبيق
          </h2>
          <ol className="list-decimal list-inside text-sm font-semibold leading-8">
            <li>سجّل الدخول إلى تطبيق العميل أو تطبيق التاجر.</li>
            <li>افتح الملف الشخصي.</li>
            <li>اختر «حذف الحساب نهائياً» وأكّد الطلب.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#FF6B00] flex items-center gap-2">
            <Mail size={20} /> إذا تعذر الدخول
          </h2>
          <p className="text-sm font-semibold leading-7">
            أرسل طلباً من البريد أو رقم الهاتف المسجل إلى{' '}
            <a className="text-[#FF6B00] underline" href="mailto:support@zagoffers.online?subject=طلب حذف حساب Zag Offers">
              support@zagoffers.online
            </a>
            . قد نطلب تحققاً بسيطاً من الملكية قبل تنفيذ الطلب لحماية الحساب.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#FF6B00]">البيانات التي تُحذف</h2>
          <p className="text-sm font-semibold leading-7">
            تُحذف بيانات الملف الشخصي، الجلسات، المفضلة، الكوبونات، التقييمات، الإشعارات والبيانات المرتبطة بالحساب.
            بالنسبة لحساب التاجر، تُحذف كذلك بيانات المتجر والعروض التابعة له. قد نحتفظ فقط بما يفرضه القانون أو يلزم
            لمنع الاحتيال وتسوية المعاملات، ثم نحذفه عند انتهاء مدة الاحتفاظ النظامية.
          </p>
        </section>

        <p className="text-xs text-white/50">الحذف نهائي ولا يمكن استرجاع الحساب أو البيانات بعد اكتماله.</p>
      </div>
    </div>
  );
}
