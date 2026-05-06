import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-bg min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
