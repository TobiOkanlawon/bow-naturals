import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import {
  LayoutDashboard, Users, Package, Truck, ShoppingCart, CheckSquare,
  MessageSquare, Receipt, BarChart3, Settings, LogOut,
  Menu, X, ChevronDown, Calendar, TrendingUp
} from 'lucide-react';

export type Page = 'dashboard' | 'staff' | 'products' | 'logistics' | 'crm' | 'tasks' | 'chat' | 'expenses' | 'analytics' | 'settings' | 'followups' | 'sales';

interface LayoutProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  children: React.ReactNode;
}

const ceoLinks: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'crm', label: 'Orders', icon: <ShoppingCart size={20} /> },
  { page: 'products', label: 'Products', icon: <Package size={20} /> },
  { page: 'logistics', label: 'Logistics', icon: <Truck size={20} /> },
  { page: 'followups', label: 'Follow-ups', icon: <Calendar size={20} /> },
  { page: 'staff', label: 'Staff', icon: <Users size={20} /> },
  { page: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { page: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
  { page: 'expenses', label: 'Expenses', icon: <Receipt size={20} /> },
  { page: 'sales', label: 'Sales Tracker', icon: <TrendingUp size={20} /> },
  { page: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { page: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const staffLinks: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'crm', label: 'Orders', icon: <ShoppingCart size={20} /> },
  { page: 'logistics', label: 'Logistics', icon: <Truck size={20} /> },
  { page: 'followups', label: 'Follow-ups', icon: <Calendar size={20} /> },
  { page: 'tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { page: 'chat', label: 'Chat', icon: <MessageSquare size={20} /> },
  { page: 'expenses', label: 'Expenses', icon: <Receipt size={20} /> },
];

export default function Layout({ currentPage, onPageChange, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { brand } = useBrand();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isCEO = user?.role === 'ceo';
  const links = isCEO ? ceoLinks : staffLinks;

  const pageTitle = links.find(l => l.page === currentPage)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: `linear-gradient(180deg, ${brand.sidebarGradientFrom} 0%, ${brand.sidebarGradientTo} 100%)`,
        }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt={brand.name} className="w-9 h-9 rounded-lg object-cover" />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: brand.primaryColor }}
            >
              {brand.logoEmoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm truncate">{brand.name}</h1>
            <p className="text-white/50 text-[10px] truncate">{brand.tagline}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(link => (
            <button
              key={link.page}
              onClick={() => {
                onPageChange(link.page);
                setSidebarOpen(false);
              }}
              className={`sidebar-link w-full ${
                currentPage === link.page ? 'sidebar-link-active' : 'sidebar-link-inactive'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-white/50 text-xs truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 flex-1">{pageTitle}</h2>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-3 py-1.5 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  {isCEO && (
                    <button
                      onClick={() => { onPageChange('settings'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings size={16} /> Settings
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
