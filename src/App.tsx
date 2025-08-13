
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/AuthProvider';

// Public pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

// Admin pages
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import GuestManagement from '@/pages/admin/GuestManagement';
import EventManagementFixed from '@/pages/admin/EventManagementFixed';
import Analytics from '@/pages/admin/Analytics';
import Settings from '@/pages/admin/Settings';
import Login from '@/pages/admin/Login';
import UserManagementFixed from '@/components/admin/UserManagementFixed';
import HeroManagement from '@/pages/admin/HeroManagement';
import ThemeManagement from '@/pages/admin/ThemeManagement';
import CoupleManagement from '@/pages/admin/CoupleManagement';
import LoveStoryManagement from '@/pages/admin/LoveStoryManagement';
import ContentManagement from '@/pages/admin/ContentManagement';

// Admin components
import EmailBlastManager from '@/components/admin/EmailBlastManager';
import MapManager from '@/components/admin/MapManager';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              
              {/* Admin routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="guests" element={<GuestManagement />} />
                <Route path="events" element={<EventManagementFixed />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="users" element={<UserManagementFixed />} />
                <Route path="hero" element={<HeroManagement />} />
                <Route path="theme" element={<ThemeManagement />} />
                <Route path="couple" element={<CoupleManagement />} />
                <Route path="love-story" element={<LoveStoryManagement />} />
                <Route path="content" element={<ContentManagement />} />
                <Route path="email" element={<EmailBlastManager />} />
                <Route path="map" element={<MapManager />} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
