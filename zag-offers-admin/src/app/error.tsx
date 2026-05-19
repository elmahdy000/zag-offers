'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">حدث خطأ غير متوقع</h2>
        <p className="text-gray-500 mb-6">{error.message}</p>
        <button onClick={reset} className="px-6 py-2 bg-orange-600 text-white rounded-lg">إعادة المحاولة</button>
      </div>
    </div>
  );
}
