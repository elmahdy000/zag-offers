import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-row-reverse">
      {/* Sidebar - Fixed width on Desktop, positioned Right (RTL) */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 min-h-screen lg:mr-[300px] w-full bg-[#F8FAFC]">
        {children}
      </main>
    </div>
  );
}
