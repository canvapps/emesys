import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Event } from '@/hooks/useEvents';
import { MapPinIcon, ClockIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface EventsListProps {
  events: Event[];
  onViewEvent: (event: Event) => void;
  onEditEvent: (event: Event) => void;
}

export const EventsList = ({ events, onViewEvent, onEditEvent }: EventsListProps) => {
  const upcomingEvents = events
    .filter(event => new Date(event.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  return (
    <Card className="elegant-card">
      <CardHeader>
        <CardTitle>Acara Mendatang</CardTitle>
        <CardDescription>Informasi acara yang akan datang</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Belum ada acara yang dijadwalkan</p>
          ) : (
            upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{event.title}</h3>
                  <Badge variant={event.event_type === 'akad' ? 'default' : 'secondary'}>
                    {event.event_type === 'akad' ? 'Akad Nikah' : 'Resepsi'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{event.venue_name}, {event.venue_city}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>
                      {new Date(event.event_date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} • {event.start_time} - {event.end_time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewEvent(event)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEditEvent(event)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
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