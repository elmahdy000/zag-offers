import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-bg px-5 text-text grid place-items-center" dir="rtl">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <WifiOff size={26} />
        </span>
        <h1 className="mt-5 text-xl font-black">أنت غير متصل بالإنترنت</h1>
        <p className="mt-2 text-sm leading-7 text-text-dim">تحقق من الاتصال ثم أعد المحاولة. العمليات المحفوظة ستتم مزامنتها بعد عودة الإنترنت.</p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white">
          إعادة المحاولة
        </Link>
      </section>
    </main>
  );
}
