import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useDataSync } from '@/hooks/useDataSync';
import { 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useGuests } from '@/hooks/useGuests';
import { useEvents } from '@/hooks/useEvents';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { RecentGuestsList } from '@/components/admin/RecentGuestsList';
import { EventsList } from '@/components/admin/EventsList';
import { Guest, mockGuests } from '@/data/mockGuests';
import { Event } from '@/hooks/useEvents';
import { mockInvitations } from '@/data/mockInvitations';
import { mockEvents } from '@/data/mockEvents';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lastSync, isSyncing, error } = useDataSync();
  
  // Hooks for data management
  const { guests, getGuestStats } = useGuests();
  const { events } = useEvents();
  
  // Statistics
  const guestStats = getGuestStats();
  const totalInvitations = mockInvitations.length;

  // Handlers for guest actions
  const handleViewGuest = (guest: Guest) => {
    navigate(`/admin/guests?view=${guest.id}`);
  };

  const handleEditGuest = (guest: Guest) => {
    navigate(`/admin/guests?edit=${guest.id}`);
  };

  const handleViewEvent = (event: Event) => {
    navigate(`/admin/events?view=${event.id}`);
  };

  const handleEditEvent = (event: Event) => {
    navigate(`/admin/events?edit=${event.id}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Sync Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <p>Kelola undangan pernikahan Anda</p>
            {error && (
              <div className="flex items-center gap-2 text-red-500">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span className="text-sm">Sync Error</span>
              </div>
            )}
            {lastSync && !error && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="text-sm">Synced</span>
              </div>
            )}
          </div>
        </div>
        <Button variant="premium" className="smoke-effect" onClick={() => navigate('/admin/guests')}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Tamu
        </Button>
      </div>

      {/* Sync Status Card */}
      {(isSyncing || error) && (
        <Card className="elegant-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {isSyncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Menyinkronkan data dengan frontend...</span>
                </>
              ) : error ? (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500">Gagal sinkronisasi: {error}</span>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <DashboardStats 
        guestStats={guestStats} 
        eventCount={events.length}
        invitationCount={totalInvitations}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guests">Tamu</TabsTrigger>
          <TabsTrigger value="invitations">Undangan</TabsTrigger>
          <TabsTrigger value="events">Acara</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Guests */}
            <RecentGuestsList 
              guests={guests}
              onViewGuest={handleViewGuest}
              onEditGuest={handleEditGuest}
            />

            {/* Event Info */}
            <EventsList 
              events={events}
              onViewEvent={handleViewEvent}
              onEditEvent={handleEditEvent}
            />
          </div>
        </TabsContent>

        <TabsContent value="guests" className="space-y-6">
          <Card className="elegant-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manajemen Tamu</CardTitle>
                  <CardDescription>Kelola daftar tamu undangan</CardDescription>
                </div>
                <Button variant="premium" onClick={() => navigate('/admin/guests')}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tambah Tamu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGuests.slice(0, 5).map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{guest.name}</p>
                          <p className="text-sm text-muted-foreground">{guest.email}</p>
                        </div>
                        <Badge variant={
                          guest.attendance_status === 'attending' ? 'default' :
                          guest.attendance_status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {guest.attendance_status === 'attending' ? 'Hadir' :
                           guest.attendance_status === 'pending' ? 'Pending' :
                           guest.attendance_status === 'maybe' ? 'Mungkin' : 'Tidak Hadir'}
                        </Badge>
                        <Badge variant="outline">
                          {guest.invitation_type === 'both' ? 'Akad & Resepsi' :
                           guest.invitation_type === 'akad' ? 'Akad' : 'Resepsi'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewGuest(guest)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditGuest(guest)}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <Card className="elegant-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manajemen Undangan</CardTitle>
                  <CardDescription>Kelola pengiriman undangan</CardDescription>
                </div>
                <Button variant="premium">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Kirim Undangan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInvitations.slice(0, 5).map((invitation) => {
                  const guest = mockGuests.find(g => g.id === invitation.guest_id);
                  return (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{guest?.name}</p>
                            <p className="text-sm text-muted-foreground">{invitation.invitation_code}</p>
                          </div>
                          <Badge variant={
                            invitation.status === 'sent' ? 'secondary' :
                            invitation.status === 'opened' ? 'default' :
                            invitation.status === 'responded' ? 'default' :
                            'outline'
                          }>
                            {invitation.status === 'sent' ? 'Terkirim' :
                             invitation.status === 'opened' ? 'Dibuka' :
                             invitation.status === 'responded' ? 'Dijawab' : 'Draft'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <EnvelopeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card className="elegant-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Manajemen Acara</CardTitle>
                  <CardDescription>Kelola detail acara pernikahan</CardDescription>
                </div>
                <Button variant="premium">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Tambah Acara
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <p className="text-muted-foreground">{event.description}</p>
                      </div>
                      <Badge>{event.event_type}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Tanggal & Waktu</p>
                        <p className="text-sm text-muted-foreground">{event.date} • {event.start_time} - {event.end_time}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Lokasi</p>
                        <p className="text-sm text-muted-foreground">{event.venue_name}</p>
                        <p className="text-sm text-muted-foreground">{event.venue_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                      <Button size="sm" variant="outline">
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Lokasi
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="elegant-card">
            <CardHeader>
              <CardTitle>Pengaturan Aplikasi</CardTitle>
              <CardDescription>Konfigurasi tema dan pengaturan lainnya</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Tema & Desain</h3>
                  <Button variant="premium" className="w-full" onClick={() => navigate('/admin/theme')}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Buka Theme Editor
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Konfigurasi Email</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/email')}>
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Template Email
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Pengaturan SMTP
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Peta & Lokasi</h3>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/map')}>
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Konfigurasi Mapbox
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
