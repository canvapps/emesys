
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CalendarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useEvents, Event } from '@/hooks/useEvents';
import EventFormWithMap from '@/components/admin/EventFormWithMap';
import { EventDetailModal } from '@/components/admin/EventDetailModal';

const EventManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Use the custom hook for event management
  const { 
    events, 
    isLoading, 
    addEvent, 
    updateEvent, 
    deleteEvent, 
    getEventById 
  } = useEvents();

  // Handle URL params for direct navigation
  useEffect(() => {
    const viewId = searchParams.get('view');
    const editId = searchParams.get('edit');
    
    if (editId) {
      const event = getEventById(editId);
      if (event) {
        setEditingEvent(event);
        setIsDialogOpen(true);
      }
    }
  }, [searchParams, getEventById]);

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
      await deleteEvent(eventId);
      // Clear URL params if we're viewing/editing the deleted event
      const viewId = searchParams.get('view');
      const editId = searchParams.get('edit');
      if (viewId === eventId || editId === eventId) {
        setSearchParams({});
        setEditingEvent(null);
        setIsDialogOpen(false);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEventSubmit = async (data: Event & { venue_latitude: number; venue_longitude: number }) => {
    const eventData = {
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
    };

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(eventData);
      }

      setIsDialogOpen(false);
      setEditingEvent(null);
      setSearchParams({}); // Clear URL params
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
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
            <Button variant="premium" onClick={handleAddEvent}>
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
                <p className="text-muted-foreground">Tidak ada acara yang ditemukan</p>
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
                        Koordinat: {event.venue_latitude}, {event.venue_longitude}
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
