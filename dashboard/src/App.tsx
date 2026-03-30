import React from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const { token, checkAuth } = useStore();
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!token) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onSetTab={setActiveTab} />;
      case 'orders':
        return <OrdersPage />;
      case 'menu':
        return <MenuPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex min-h-screen bg-luxury-black font-sans text-gray-200 overflow-x-hidden">
      {/* Sidebar - fixed and responsive handling */}
      <Sidebar 
        activeId={activeTab} 
        onSetTab={(id) => { setActiveTab(id); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        <Topbar 
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} 
          onToggleSidebar={toggleSidebar}
        />
        
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
