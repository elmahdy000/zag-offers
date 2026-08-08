import AdminSidebar from '@/components/AdminSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import ErrorBoundary from '@/components/ErrorBoundary';
import BottomNav from '@/components/BottomNav';
import Providers from '@/components/Providers';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <ErrorBoundary>
        <div className="admin-layout admin-shell min-h-screen flex flex-row-reverse" lang="ar" dir="rtl">
        {/* Sidebar - Fixed width on Desktop, positioned Right (RTL) */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <div className="admin-main flex-1 min-h-screen lg:mr-[270px] w-full min-w-0 flex flex-col">
          <DashboardHeader />
          <main className="admin-content flex-1 p-0 pb-32 lg:pb-8">
            <div className="admin-route">{children}</div>
          </main>
          <BottomNav />
        </div>
        </div>
      </ErrorBoundary>
    </Providers>
  );
}
