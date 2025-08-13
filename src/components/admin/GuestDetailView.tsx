
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { Guest } from '@/data/mockGuests';

interface GuestDetailViewProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
}

const GuestDetailView = ({ guest, isOpen, onClose }: GuestDetailViewProps) => {
  if (!guest) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'attending': return 'default';
      case 'not_attending': return 'destructive';
      case 'maybe': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'attending': return 'Hadir';
      case 'not_attending': return 'Tidak Hadir';
      case 'maybe': return 'Mungkin';
      default: return 'Pending';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Detail Tamu
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap tamu undangan
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{guest.name}</h3>
              <div className="flex gap-2">
                <Badge variant={getStatusBadgeVariant(guest.attendance_status)}>
                  {getStatusText(guest.attendance_status)}
                </Badge>
                <Badge variant="outline">
                  {guest.invitation_type === 'both' ? 'Akad & Resepsi' :
                   guest.invitation_type === 'akad' ? 'Akad' : 'Resepsi'}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Jumlah Tamu:</span>
                <span>{guest.guest_count} orang</span>
              </div>
              
              {guest.email && (
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{guest.email}</span>
                </div>
              )}
              
              {guest.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Telepon:</span>
                  <span>{guest.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address Info */}
          {(guest.address || guest.city || guest.province) && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                Alamat
              </h4>
              <div className="bg-muted/30 p-3 rounded-lg space-y-1">
                {guest.address && <p className="text-sm">{guest.address}</p>}
                {guest.city && guest.province && (
                  <p className="text-sm text-muted-foreground">
                    {guest.city}, {guest.province}
                  </p>
                )}
                {guest.postal_code && (
                  <p className="text-sm text-muted-foreground">
                    Kode Pos: {guest.postal_code}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* RSVP Info */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Informasi RSVP
            </h4>
            <div className="bg-muted/30 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Tanggal Dibuat:</span>
                <span>{new Date(guest.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              
              {guest.rsvp_date && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Tanggal RSVP:</span>
                  <span>{new Date(guest.rsvp_date).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="font-medium">Terakhir Diperbarui:</span>
                <span>{new Date(guest.updated_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          {guest.message && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                Pesan
              </h4>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm italic">"{guest.message}"</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestDetailView;
