import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { PaymentPage } from './pages/PaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { Toast } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { ReportsPage } from './pages/ReportsPage';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { token, user, checkAuth, initTheme, isSidebarCollapsed, fetchSettings } = useStore();

  const [activeTab, setActiveTab] = React.useState('orders'); // corrected by role in effect below
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  React.useEffect(() => {
    checkAuth();
    initTheme();
    fetchSettings();
  }, [checkAuth, initTheme, fetchSettings]);

  // Set correct initial tab once user is known
  React.useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'WAITER' ? 'orders' : 'dashboard');
    }
  }, [user?.role]);

  if (!token) {
    return <LoginPage />;
  }

  const isWaiter = user?.role === 'WAITER';
  const isAdmin = user?.role === 'ADMIN';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // Guard: waiters cannot see dashboard
        if (isWaiter) return <OrdersPage />;
        return <DashboardPage onSetTab={setActiveTab} />;
      case 'orders':
        return <OrdersPage />;
      case 'menu':
        // Guard: waiters cannot see menu
        if (isWaiter) return <OrdersPage />;
        return <MenuPage />;
      case 'payments':
        return <PaymentPage />;
      case 'staff':
        if (!isAdmin) return <OrdersPage />;
        return <StaffManagementPage />;
      case 'reports':
        if (!isAdmin) return <OrdersPage />;
        return <ReportsPage />;
      case 'settings':
        if (!isAdmin) return <OrdersPage />;
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return isWaiter ? <OrdersPage /> : <DashboardPage />;
    }
  };


  return (
    <div className="flex min-h-screen bg-luxury-black font-sans text-luxury-text overflow-x-hidden">
      {/* Sidebar - fixed and responsive handling */}
      <Sidebar
        activeId={activeTab}
        onSetTab={(id) => { setActiveTab(id); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area - Reactive Padding */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <Topbar
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          onToggleSidebar={toggleSidebar}
        />

        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
      <Toast />
      <ConfirmModal />
    </div>
  );
};

export default App;
