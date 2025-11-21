import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  Package
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, currentCompany, companies, setCurrentCompany, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/quotes', icon: FileText, label: 'Quotes' },
    { path: '/invoices', icon: FileText, label: 'Invoices' },
    { path: '/proforma', icon: FileText, label: 'Proforma' },
    { path: '/delivery-notes', icon: FileText, label: 'Delivery Notes' },
    { path: '/receipts', icon: FileText, label: 'Receipts' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/companies', icon: Building2, label: 'Companies' },
    { path: '/subscription', icon: CreditCard, label: 'Subscription' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-card/50 backdrop-blur-xl border-r border-border z-50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              {currentCompany?.logo_url ? (
                <img
                  src={currentCompany.logo_url}
                  alt={currentCompany.name}
                  className="w-10 h-10 object-contain rounded-lg border border-border bg-background/50 p-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                  Quotation Maker
                </h1>
                {currentCompany && (
                  <p className="text-xs text-muted-foreground truncate">{currentCompany.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 ${isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border bg-card/30">
            <div className="mb-4 px-2">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.fullName}</p>
            </div>

            {companies.length > 1 && (
              <select
                value={currentCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value);
                  if (company) setCurrentCompany(company);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg mb-4 glass-input outline-none focus:ring-2 focus:ring-primary/50"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-card p-2 rounded-lg shadow-lg border border-border"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="fixed inset-y-0 left-0 w-64 bg-background/95 backdrop-blur-xl shadow-2xl z-50 border-r border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h1 className="text-xl font-bold text-primary">Quotation Maker</h1>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-primary/5'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

