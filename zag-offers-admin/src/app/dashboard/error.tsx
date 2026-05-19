'use client';
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold mb-4">حدث خطأ</h2>
      <p className="text-gray-500 mb-6">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-orange-600 text-white rounded-lg">إعادة المحاولة</button>
    </div>
  );
}
