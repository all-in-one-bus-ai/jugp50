import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Ticket,
  ScanLine,
  CalendarDays,
  BarChart3,
  Settings,
  ExternalLink,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ToastProvider } from '@/components/ui/Toast';

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Participants', href: '/admin/participants', icon: Users },
  { label: 'Ticket Management', href: '/admin/tickets', icon: Ticket },
  { label: 'Ticket Verification', href: '/admin/verification', icon: ScanLine },
  { divider: true },
  { label: 'Events', href: '/admin/events', icon: CalendarDays },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
] as const;

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin/login', { replace: true });
      } else {
        setAuthenticated(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/admin/login', { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-jubilee-200 border-t-jubilee-700 rounded-full animate-spin" />
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-jubilee-800 text-white transform transition-transform duration-200 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-jubilee-700">
              <div className="flex items-center justify-between">
                <Link to="/admin" className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-serif font-bold text-sm">
                    50
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">
                      Golden Jubilee 2026
                    </p>
                    <p className="text-[10px] text-jubilee-300">Admin Panel</p>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-jubilee-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {sidebarLinks.map((link, i) =>
                'divider' in link ? (
                  <div key={i} className="my-3 border-t border-jubilee-700" />
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      (link.href === '/admin' && location.pathname === '/admin') ||
                      (link.href !== '/admin' && location.pathname.startsWith(link.href))
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-jubilee-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <link.icon className="w-4.5 h-4.5 shrink-0" />
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            <div className="p-3 border-t border-jubilee-700">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-jubilee-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Website
              </a>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-4 lg:px-6 h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-600 hover:text-gray-900"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 w-64 lg:w-80">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, ticket ID, batch..."
                    className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-medium text-gray-900">Jahangirnagar University</p>
                  <p className="text-[10px] text-gray-500">Savar, Dhaka</p>
                </div>
                <button className="relative p-2 text-gray-500 hover:text-gray-700">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-jubilee-700 flex items-center justify-center text-white text-xs font-medium">
                      A
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium text-gray-900">Admin</p>
                      <p className="text-[10px] text-gray-500">Super Admin</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-slide-down">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
