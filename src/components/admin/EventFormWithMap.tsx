
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowPathIcon, CalendarIcon } from '@heroicons/react/24/outline';
import EventLocationPicker from './EventLocationPicker';
import { reverseGeocode } from '@/utils/geocoding';

interface EventData {
  title: string;
  event_type: 'akad' | 'resepsi';
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_province: string;
  venue_latitude?: number;
  venue_longitude?: number;
  event_date: string;
  start_time: string;
  end_time: string;
  description?: string;
  dress_code?: string;
  contact_person?: string;
  contact_phone?: string;
}

interface EventFormWithMapProps {
  initialData?: EventData & { 
    id?: string; 
    created_at?: string; 
    updated_at?: string;
    venue_latitude?: number;
    venue_longitude?: number;
  };
  onSubmit: (data: EventData & { venue_latitude: number; venue_longitude: number }) => void;
  onCancel: () => void;
}

const EventFormWithMap = ({ initialData, onSubmit, onCancel }: EventFormWithMapProps) => {
  const [eventData, setEventData] = useState<EventData>({
    title: initialData?.title || '',
    event_type: initialData?.event_type || 'akad',
    venue_name: initialData?.venue_name || '',
    venue_address: initialData?.venue_address || '',
    venue_city: initialData?.venue_city || '',
    venue_province: initialData?.venue_province || '',
    venue_latitude: initialData?.venue_latitude,
    venue_longitude: initialData?.venue_longitude,
    event_date: initialData?.event_date || '',
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    description: initialData?.description || '',
    dress_code: initialData?.dress_code || '',
    contact_person: initialData?.contact_person || '',
    contact_phone: initialData?.contact_phone || ''
  });

  const handleLocationChange = async (lat: number, lng: number) => {
    // Set coordinates first
    setEventData(prev => ({
      ...prev,
      venue_latitude: lat,
      venue_longitude: lng
    }));

    // Try to auto-fill venue details from reverse geocoding
    try {
      const info = await reverseGeocode(lat, lng);
      if (info) {
        setEventData(prev => ({
          ...prev,
          venue_latitude: lat,
          venue_longitude: lng,
          venue_name: prev.venue_name || info.name,
          venue_address: info.address,
          venue_city: info.city || prev.venue_city,
          venue_province: info.province || prev.venue_province,
        }));
      }
    } catch (err) {
      // Silent fail, user can edit manually
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventData.venue_latitude || !eventData.venue_longitude) {
      return;
    }

    onSubmit({
      ...eventData,
      venue_latitude: eventData.venue_latitude,
      venue_longitude: eventData.venue_longitude
    });
  };

  const hasSelectedLocation = eventData.venue_latitude && eventData.venue_longitude;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Judul Acara *</Label>
          <Input
            id="title"
            value={eventData.title}
            onChange={(e) => setEventData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Akad Nikah / Resepsi"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_type">Tipe Acara *</Label>
          <Select 
            value={eventData.event_type} 
            onValueChange={(value: 'akad' | 'resepsi') => setEventData(prev => ({ ...prev, event_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe acara" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="akad">Akad Nikah</SelectItem>
              <SelectItem value="resepsi">Resepsi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Picker */}
      <EventLocationPicker
        latitude={eventData.venue_latitude}
        longitude={eventData.venue_longitude}
        onLocationChange={handleLocationChange}
      />

      {/* Venue Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="venue_name">Nama Venue *</Label>
          <Input
            id="venue_name"
            value={eventData.venue_name}
            onChange={(e) => setEventData(prev => ({ ...prev, venue_name: e.target.value }))}
            placeholder={hasSelectedLocation ? "Nama akan terisi otomatis setelah memilih lokasi" : "Pilih lokasi di peta terlebih dahulu"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="venue_address">Alamat Venue *</Label>
          <Textarea
            id="venue_address"
            value={eventData.venue_address}
            onChange={(e) => setEventData(prev => ({ ...prev, venue_address: e.target.value }))}
            placeholder={hasSelectedLocation ? "Alamat akan terisi otomatis setelah memilih lokasi" : "Pilih lokasi di peta terlebih dahulu"}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="venue_city">Kota *</Label>
            <Input
              id="venue_city"
              value={eventData.venue_city}
              onChange={(e) => setEventData(prev => ({ ...prev, venue_city: e.target.value }))}
              placeholder="Nama kota"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue_province">Provinsi *</Label>
            <Input
              id="venue_province"
              value={eventData.venue_province}
              onChange={(e) => setEventData(prev => ({ ...prev, venue_province: e.target.value }))}
              placeholder="Nama provinsi"
              required
            />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">Tanggal Acara *</Label>
          <Input
            id="event_date"
            type="date"
            value={eventData.event_date}
            onChange={(e) => setEventData(prev => ({ ...prev, event_date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Waktu Mulai *</Label>
          <Input
            id="start_time"
            type="time"
            value={eventData.start_time}
            onChange={(e) => setEventData(prev => ({ ...prev, start_time: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">Waktu Selesai *</Label>
          <Input
            id="end_time"
            type="time"
            value={eventData.end_time}
            onChange={(e) => setEventData(prev => ({ ...prev, end_time: e.target.value }))}
            required
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={eventData.description}
            onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Deskripsi acara"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dress_code">Dress Code</Label>
            <Input
              id="dress_code"
              value={eventData.dress_code}
              onChange={(e) => setEventData(prev => ({ ...prev, dress_code: e.target.value }))}
              placeholder="Formal / Semi Formal / Casual"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person">Contact Person</Label>
            <Input
              id="contact_person"
              value={eventData.contact_person}
              onChange={(e) => setEventData(prev => ({ ...prev, contact_person: e.target.value }))}
              placeholder="Nama contact person"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Nomor Telepon Contact</Label>
          <Input
            id="contact_phone"
            value={eventData.contact_phone}
            onChange={(e) => setEventData(prev => ({ ...prev, contact_phone: e.target.value }))}
            placeholder="+62 812-3456-7890"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={!hasSelectedLocation}
          variant="premium"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Simpan Acara
        </Button>
      </div>
    </form>
  );
};

export default EventFormWithMap;
