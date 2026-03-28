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
    <div className="flex min-h-screen bg-luxury-black font-sans text-gray-200">
      <Sidebar activeId={activeTab} onSetTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
        
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
