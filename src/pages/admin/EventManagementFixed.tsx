
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  CalendarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import EventFormWithMap from '@/components/admin/EventFormWithMap';
import { EventDetailModal } from '@/components/admin/EventDetailModal';

interface Event {
  id: string;
  title: string;
  event_type: 'akad' | 'resepsi';
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_province: string;
  venue_latitude: number;
  venue_longitude: number;
  event_date: string;
  start_time: string;
  end_time: string;
  description?: string;
  dress_code?: string;
  contact_person?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

const initialEvents: Event[] = [
  {
    id: '1',
    title: 'Akad Nikah',
    event_type: 'akad',
    venue_name: 'Masjid Al-Ikhlas',
    venue_address: 'Jl. Raya Bekasi No. 123, Bekasi Timur',
    venue_city: 'Bekasi',
    venue_province: 'Jawa Barat',
    venue_latitude: -6.2088,
    venue_longitude: 107.0456,
    event_date: '2024-06-15',
    start_time: '08:00',
    end_time: '10:00',
    description: 'Upacara akad nikah',
    dress_code: 'Formal',
    contact_person: 'Bapak Ahmad',
    contact_phone: '+62 812-3456-7890',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    title: 'Resepsi Pernikahan',
    event_type: 'resepsi',
    venue_name: 'Gedung Serbaguna',
    venue_address: 'Jl. Ahmad Yani No. 456, Jakarta Pusat',
    venue_city: 'Jakarta',
    venue_province: 'DKI Jakarta',
    venue_latitude: -6.1751,
    venue_longitude: 106.8650,
    event_date: '2024-06-15',
    start_time: '18:00',
    end_time: '22:00',
    description: 'Resepsi pernikahan',
    dress_code: 'Semi Formal',
    contact_person: 'Ibu Siti',
    contact_phone: '+62 813-7890-1234',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];

const EventManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useLocalStorage<Event[]>('wedding-events', initialEvents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle URL params for direct navigation
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      const event = events.find(e => e.id === editId);
      if (event) {
        setEditingEvent(event);
        setIsDialogOpen(true);
      }
    }
  }, [searchParams, events]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleViewEvent = (event: Event) => {
    setViewingEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setViewingEvent(null);
  };

  const handleEditFromDetail = (event: Event) => {
    setIsDetailModalOpen(false);
    setViewingEvent(null);
    handleEditEvent(event);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const eventToDelete = events.find(e => e.id === eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      // Clear URL params if we're viewing/editing the deleted event
      const viewId = searchParams.get('view');
      const editId = searchParams.get('edit');
      if (viewId === eventId || editId === eventId) {
        setSearchParams({});
        setEditingEvent(null);
        setIsDialogOpen(false);
      }

      toast({
        title: "Event Berhasil Dihapus",
        description: `${eventToDelete?.title} berhasil dihapus`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus event",
        variant: "destructive",
      });
    }
  };

  const validateEventData = (data: any): boolean => {
    if (!data.title?.trim()) {
      toast({
        title: "Error",
        description: "Judul acara harus diisi",
        variant: "destructive",
      });
      return false;
    }
    if (!data.venue_name?.trim()) {
      toast({
        title: "Error", 
        description: "Nama venue harus diisi",
        variant: "destructive",
      });
      return false;
    }
    if (!data.event_date) {
      toast({
        title: "Error",
        description: "Tanggal acara harus diisi",
        variant: "destructive",
      });
      return false;
    }
    if (!data.start_time || !data.end_time) {
      toast({
        title: "Error",
        description: "Waktu mulai dan selesai harus diisi",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleEventSubmit = async (data: Event & { venue_latitude: number; venue_longitude: number }) => {
    if (!validateEventData(data)) return;

    setIsLoading(true);

    try {
      const eventData: Event = {
        id: editingEvent?.id || Date.now().toString(),
        title: data.title,
        event_type: data.event_type,
        venue_name: data.venue_name,
        venue_address: data.venue_address,
        venue_city: data.venue_city,
        venue_province: data.venue_province,
        venue_latitude: data.venue_latitude,
        venue_longitude: data.venue_longitude,
        event_date: data.event_date,
        start_time: data.start_time,
        end_time: data.end_time,
        description: data.description,
        dress_code: data.dress_code,
        contact_person: data.contact_person,
        contact_phone: data.contact_phone,
        created_at: editingEvent?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? eventData : e));
        toast({
          title: "Event Berhasil Diperbarui",
          description: `${eventData.title} berhasil diperbarui`,
        });
      } else {
        setEvents(prev => [eventData, ...prev]);
        toast({
          title: "Event Berhasil Ditambahkan",
          description: `${eventData.title} berhasil ditambahkan`,
        });
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      setSearchParams({}); // Clear URL params
    } catch (error) {
      toast({
        title: "Error",
        description: editingEvent ? "Gagal memperbarui event" : "Gagal menambahkan event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    setSearchParams({});
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Manajemen Acara</h1>
          <p className="text-muted-foreground">Kelola acara pernikahan dan detail pelaksanaannya dengan peta interaktif</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="default" onClick={handleAddEvent}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Tambah Acara
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Edit Acara' : 'Tambah Acara Baru'}
              </DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Perbarui informasi acara' : 'Tambahkan acara baru dengan lokasi peta interaktif'}
              </DialogDescription>
            </DialogHeader>
            
            <EventFormWithMap
              initialData={editingEvent || undefined}
              onSubmit={handleEventSubmit}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="elegant-card">
        <CardContent className="p-4">
          <Input
            placeholder="Cari nama acara atau venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Event List */}
      <Card className="elegant-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Daftar Acara ({filteredEvents.length})
          </CardTitle>
          <CardDescription>
            Kelola semua acara pernikahan dengan lokasi peta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tidak ada acara yang sesuai dengan pencarian' : 'Belum ada acara yang dibuat'}
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.venue_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={event.event_type === 'akad' ? 'default' : 'secondary'}>
                        {event.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Lokasi:</span>
                      </div>
                      <p className="ml-6">{event.venue_address}</p>
                      <p className="ml-6 text-muted-foreground">{event.venue_city}, {event.venue_province}</p>
                      <p className="ml-6 text-xs text-muted-foreground">
                        Koordinat: {event.venue_latitude.toFixed(6)}, {event.venue_longitude.toFixed(6)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Waktu:</span>
                      </div>
                      <p className="ml-6">{new Date(event.event_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                      <p className="ml-6 text-muted-foreground">{event.start_time} - {event.end_time}</p>
                    </div>
                  </div>

                  {event.description && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewEvent(event)}
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditEvent(event)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={viewingEvent}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={handleEditFromDetail}
      />
    </div>
  );
};

export default EventManagement;
