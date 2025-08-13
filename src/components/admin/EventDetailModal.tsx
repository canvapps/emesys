import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event } from '@/hooks/useEvents';
import { 
  MapPinIcon, 
  ClockIcon, 
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: Event) => void;
}

export const EventDetailModal = ({ event, isOpen, onClose, onEdit }: EventDetailModalProps) => {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {event.title}
          </DialogTitle>
          <DialogDescription>
            Detail informasi acara pernikahan
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="flex items-center justify-between">
            <Badge variant={event.event_type === 'akad' ? 'default' : 'secondary'}>
              {event.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ID: {event.id}
            </span>
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <InformationCircleIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Deskripsi</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">{event.description}</p>
            </div>
          )}

          {/* Location Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Lokasi</span>
            </div>
            <div className="pl-6 space-y-1">
              <p className="font-medium">{event.venue_name}</p>
              <p className="text-sm text-muted-foreground">{event.venue_address}</p>
              <p className="text-sm text-muted-foreground">{event.venue_city}, {event.venue_province}</p>
              <p className="text-xs text-muted-foreground">
                Koordinat: {event.venue_latitude.toFixed(6)}, {event.venue_longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Waktu</span>
            </div>
            <div className="pl-6 space-y-1">
              <p className="font-medium">
                {new Date(event.event_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.start_time} - {event.end_time} WIB
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {event.dress_code && (
              <div className="space-y-1">
                <span className="font-medium text-sm">Dress Code</span>
                <p className="text-sm text-muted-foreground">{event.dress_code}</p>
              </div>
            )}
            
            {event.contact_person && (
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Contact Person</span>
                </div>
                <p className="text-sm text-muted-foreground">{event.contact_person}</p>
                {event.contact_phone && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{event.contact_phone}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t space-y-1">
            <p className="text-xs text-muted-foreground">
              Dibuat: {new Date(event.created_at).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground">
              Diperbarui: {new Date(event.updated_at).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button onClick={() => onEdit(event)}>
              Edit Acara
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};