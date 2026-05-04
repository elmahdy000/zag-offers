import AdminSidebar from '@/components/AdminSidebar';
import DashboardHeader from '@/components/DashboardHeader';

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
      <div className="flex-1 min-h-screen lg:mr-[300px] w-full flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
