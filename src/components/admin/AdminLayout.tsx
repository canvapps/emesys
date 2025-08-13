import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useDataSync } from '@/hooks/useDataSync';
import { useTheme } from '@/context/ThemeContext';
import { 
  HomeIcon,
  UsersIcon,
  HeartIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MapPinIcon,
  CogIcon,
  ChartBarIcon,
  CalendarIcon,
  PaintBrushIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user, isLoading, logout } = useAdminAuth();
  const { currentTheme } = useTheme();
  const { lastSync, isSyncing, syncData } = useDataSync();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Manajemen Tamu', href: '/admin/guests', icon: UsersIcon },
    { name: 'Manajemen Mempelai', href: '/admin/couple', icon: UsersIcon },
    { name: 'Kisah Cinta', href: '/admin/love-story', icon: HeartIcon },
    { name: 'Konten Website', href: '/admin/content', icon: DocumentTextIcon },
    { name: 'Email Blast', href: '/admin/email', icon: EnvelopeIcon },
    { name: 'Peta & Lokasi', href: '/admin/map', icon: MapPinIcon },
    { name: 'Acara', href: '/admin/events', icon: CalendarIcon },
    { name: 'Hero Section', href: '/admin/hero', icon: PaintBrushIcon },
    { name: 'Theme Editor', href: '/admin/theme', icon: PaintBrushIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'User Management', href: '/admin/users', icon: UsersIcon },
    { name: 'Pengaturan', href: '/admin/settings', icon: CogIcon },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="h-full bg-card/95 backdrop-blur-sm border-r border-border/50 shadow-elegant">
          {/* Sidebar Header */}
          <div className={cn(
            "flex items-center justify-between h-16 px-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-rose-gold/5",
            sidebarCollapsed && "justify-center px-2"
          )}>
            {!sidebarCollapsed && (
              <h2 className="text-xl font-bold text-gradient">Admin Panel</h2>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex hover-glow"
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon className="h-5 w-5" />
                ) : (
                  <ChevronLeftIcon className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden hover-glow"
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-4 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-gradient-premium text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-rose-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  
                  <item.icon className={cn(
                    "flex-shrink-0 transition-transform group-hover:scale-110 duration-300",
                    sidebarCollapsed ? "h-6 w-6" : "h-5 w-5 mr-3"
                  )} />
                  
                  {!sidebarCollapsed && (
                    <span className="truncate relative z-10">{item.name}</span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section at bottom */}
          <div className="absolute bottom-4 left-2 right-2">
            <Link
              to="/"
              className={cn(
                "flex items-center px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground rounded-xl transition-all duration-300 group",
                sidebarCollapsed && "justify-center"
              )}
            >
              <HomeIcon className={cn(
                "flex-shrink-0 transition-transform group-hover:scale-110 duration-300",
                sidebarCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
              )} />
              {!sidebarCollapsed && <span>Kembali ke Website</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Glassmorphic Header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-elegant">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden hover-glow"
              >
                <Bars3Icon className="h-6 w-6" />
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-gradient">
                  Dhika & Sari Wedding Admin
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Professional Wedding Management System</span>
                  {lastSync && (
                    <span className="text-xs">
                      • Last sync: {lastSync.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Data Sync Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={syncData}
                disabled={isSyncing}
                className="hover-glow"
              >
                <ArrowPathIcon className={cn(
                  "h-4 w-4",
                  isSyncing && "animate-spin"
                )} />
              </Button>

              <ThemeToggle />
              
              {/* User Menu */}
              <div className="flex items-center gap-3">
                <Link
                  to="/admin/profile"
                  className="group flex items-center gap-3 hover:bg-muted/60 rounded-full px-3 py-2 transition-all duration-300"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-premium">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover-glow"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-muted/5 to-background">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
