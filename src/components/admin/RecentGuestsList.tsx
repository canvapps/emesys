import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Guest } from '@/data/mockGuests';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface RecentGuestsListProps {
  guests: Guest[];
  onViewGuest: (guest: Guest) => void;
  onEditGuest: (guest: Guest) => void;
}

export const RecentGuestsList = ({ guests, onViewGuest, onEditGuest }: RecentGuestsListProps) => {
  const getStatusVariant = (status: string) => {
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

  const recentGuests = guests
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return (
    <Card className="elegant-card">
      <CardHeader>
        <CardTitle>Tamu Terbaru</CardTitle>
        <CardDescription>Konfirmasi dan update terbaru dari tamu</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentGuests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Belum ada data tamu</p>
          ) : (
            recentGuests.map((guest) => (
              <div 
                key={guest.id} 
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-muted-foreground">{guest.email || 'Tidak ada email'}</p>
                    </div>
                    <Badge variant={getStatusVariant(guest.attendance_status)}>
                      {getStatusText(guest.attendance_status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diperbarui: {new Date(guest.updated_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewGuest(guest)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditGuest(guest)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};