import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, CameraIcon, HeartIcon, SparklesIcon, UsersIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useEventContent } from '@/hooks/useEventContent';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface EventDetailsProps {
  eventType?: string;
}

export const EventDetails = ({ eventType = 'wedding' }: EventDetailsProps) => {
  const { events, eventContent, isLoading, error, eventType: currentEventType } = useEventContent(eventType);

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat detail acara...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </section>
    );
  }

  // Get appropriate icon based on event type
  const getEventIcon = () => {
    switch (currentEventType) {
      case 'wedding':
        return HeartIcon;
      case 'conference':
        return UsersIcon;
      case 'birthday':
        return SparklesIcon;
      default:
        return CalendarIcon;
    }
  };

  const EventIcon = getEventIcon();

  // Get timeline title based on event type
  const getTimelineTitle = () => {
    switch (currentEventType) {
      case 'wedding':
        return 'Timeline Acara';
      case 'conference':
        return 'Program Acara';
      case 'birthday':
        return 'Rundown Acara';
      default:
        return 'Jadwal Acara';
    }
  };

  // Get timeline description based on event type  
  const getTimelineDescription = () => {
    switch (currentEventType) {
      case 'wedding':
        return 'Mari bergabung dalam momen bahagia kami';
      case 'conference':
        return 'Bergabunglah dalam program pembelajaran dan networking';
      case 'birthday':
        return 'Rayakan momen spesial bersama kami';
      default:
        return 'Mari bergabung dalam acara ini';
    }
  };

  // Filter and sort events for timeline display (for compatibility, events might be empty)
  const timelineEvents = events.filter(event => event.show_on_timeline).sort((a, b) => a.display_order - b.display_order);

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-rose-gold/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <EventIcon className="h-12 w-12 text-primary mx-auto mb-6 floating" />
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            {getTimelineTitle()}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {getTimelineDescription()}
          </p>
          <div className="flex items-center justify-center mt-8">
            <div className="h-1 w-20 bg-gradient-premium rounded-full" />
            <EventIcon className="h-6 w-6 text-rose-gold mx-4" />
            <div className="h-1 w-20 bg-gradient-elegant rounded-full" />
          </div>
        </div>

        {/* Timeline Section */}
        {timelineEvents.length > 0 ? (
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary via-rose-gold to-primary rounded-full shimmer"></div>
              
              {/* Timeline Items */}
              <div className="space-y-12">
                {timelineEvents.map((event, index) => {
                  const isLeft = index % 2 === 0;
                  const colors = [
                    { bg: 'bg-gradient-premium', border: 'border-primary/20 hover:border-primary/40', dot: 'bg-primary', icon: 'text-primary-foreground' },
                    { bg: 'bg-gradient-elegant', border: 'border-rose-gold/20 hover:border-rose-gold/40', dot: 'bg-rose-gold', icon: 'text-white' },
                    { bg: 'bg-accent/30', border: 'border-accent/20 hover:border-accent/40', dot: 'bg-accent', icon: 'text-foreground' }
                  ];
                  const colorSet = colors[index % colors.length];
                  
                  const eventDate = new Date(event.event_date);
                  const formattedDate = format(eventDate, 'd MMMM yyyy - EEEE', { locale: id });
                  
                  return (
                    <div key={event.id} className={`relative flex items-center fade-in-up delay-${(index + 1) * 200}`}>
                      {isLeft ? (
                        <>
                          <div className="flex-1 pr-8">
                            <div className={`elegant-card bg-card/95 backdrop-blur-sm rounded-3xl p-8 border ${colorSet.border} transition-all duration-500 group`}>
                              <div className="flex items-center mb-6">
                                <div className={`w-16 h-16 ${colorSet.bg} rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                                  <CalendarIcon className={`h-8 w-8 ${colorSet.icon}`} />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-gradient mb-1">{event.title}</h3>
                                  <p className="text-muted-foreground">{event.description}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 text-lg">
                                  <CalendarIcon className="h-5 w-5 text-primary" />
                                  <span className="font-semibold">{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-3 text-lg">
                                  <ClockIcon className="h-5 w-5 text-primary" />
                                  <span>{event.start_time} - {event.end_time} WIB</span>
                                </div>
                                <div className="flex items-start gap-3 text-lg">
                                  <MapPinIcon className="h-5 w-5 text-primary mt-1" />
                                  <div>
                                    <p className="font-semibold">{event.venue_info.name}</p>
                                    <p className="text-muted-foreground text-sm">{event.venue_info.address}</p>
                                  </div>
                                </div>
                                {event.requirements?.dress_code && (
                                  <div className="flex items-start gap-3 text-lg">
                                    <SparklesIcon className="h-5 w-5 text-primary mt-1" />
                                    <div>
                                      <p className="font-semibold">Dress Code</p>
                                      <p className="text-muted-foreground text-sm">{event.requirements.dress_code}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 ${colorSet.dot} rounded-full border-4 border-background shadow-glow floating z-10`}></div>
                          <div className="flex-1 pl-8"></div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 pr-8"></div>
                          <div className={`absolute left-1/2 transform -translate-x-1/2 w-6 h-6 ${colorSet.dot} rounded-full border-4 border-background shadow-elegant floating animation-delay-2000 z-10`}></div>
                          <div className="flex-1 pl-8">
                            <div className={`elegant-card bg-card/95 backdrop-blur-sm rounded-3xl p-8 border ${colorSet.border} transition-all duration-500 group`}>
                              <div className="flex items-center mb-6">
                                <div className={`w-16 h-16 ${colorSet.bg} rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                                  <CameraIcon className={`h-8 w-8 ${colorSet.icon}`} />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-gradient mb-1">{event.title}</h3>
                                  <p className="text-muted-foreground">{event.description}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 text-lg">
                                  <CalendarIcon className="h-5 w-5 text-rose-gold" />
                                  <span className="font-semibold">{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-3 text-lg">
                                  <ClockIcon className="h-5 w-5 text-rose-gold" />
                                  <span>{event.start_time} - {event.end_time} WIB</span>
                                </div>
                                <div className="flex items-start gap-3 text-lg">
                                  <MapPinIcon className="h-5 w-5 text-rose-gold mt-1" />
                                  <div>
                                    <p className="font-semibold">{event.venue_info.name}</p>
                                    <p className="text-muted-foreground text-sm">{event.venue_info.address}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // Empty state when no events are available
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="elegant-card bg-card/80 backdrop-blur-sm rounded-3xl p-12 border border-primary/10">
              <BookOpenIcon className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-4">
                Timeline akan segera tersedia
              </h3>
              <p className="text-muted-foreground">
                Detail jadwal acara sedang disiapkan. Silakan periksa kembali nanti.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {timelineEvents.length > 0 && (
          <div className="text-center space-x-4 fade-in-up delay-600">
            {timelineEvents.map((event, index) => (
              <Button 
                key={event.id}
                variant={index % 2 === 0 ? "premium" : "elegant"} 
                size="lg" 
                className="smoke-effect shadow-glow mb-2"
                onClick={() => {
                  if (event.venue_info.latitude && event.venue_info.longitude) {
                    window.open(`https://www.google.com/maps?q=${event.venue_info.latitude},${event.venue_info.longitude}`, '_blank');
                  } else {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_info.address)}`, '_blank');
                  }
                }}
              >
                <MapPinIcon className="h-5 w-5 mr-2" />
                Lihat Lokasi {event.title}
              </Button>
            ))}
          </div>
        )}

        {/* Additional Event Content */}
        {eventContent.length > 0 && (
          <div className="mt-16 fade-in-up delay-800">
            {eventContent.map((content, index) => (
              <div key={content.id} className="elegant-card bg-card/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 max-w-4xl mx-auto border border-primary/10 mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-gradient mb-8 text-center">
                  {content.title}
                </h3>
                
                {content.content_type === 'instructions' && content.content_data.dress_code && (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-primary text-lg mb-3 flex items-center">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {content.content_data.dress_code.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {content.content_data.dress_code.description}
                      </p>
                    </div>
                    {content.content_data.health_protocol && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-primary text-lg mb-3 flex items-center">
                          <EventIcon className="h-5 w-5 mr-2" />
                          {content.content_data.health_protocol.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {content.content_data.health_protocol.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {content.content_data.download_invitation?.enabled && (
                  <div className="mt-8 text-center">
                    <Button 
                      variant="gold" 
                      size="xl" 
                      className="smoke-effect shadow-glow"
                      onClick={() => {
                        // This will be implemented when download functionality is added
                        console.log('Download invitation feature coming soon');
                      }}
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      {content.content_data.download_invitation.text || 'Download Undangan'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};