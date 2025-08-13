
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClockIcon, MapPinIcon, CameraIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useWeddingContent } from '@/hooks/useWeddingContent';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const WeddingDetails = () => {
  const { events, importantInfo, isLoading, error } = useWeddingContent();

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

  // Filter and sort events for timeline display
  const timelineEvents = events
    .filter(event => event.show_on_timeline)
    .sort((a, b) => a.display_order - b.display_order);

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
          <CalendarIcon className="h-12 w-12 text-primary mx-auto mb-6 floating" />
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Timeline Acara
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mari bergabung dalam momen bahagia kami
          </p>
          <div className="flex items-center justify-center mt-8">
            <div className="h-1 w-20 bg-gradient-premium rounded-full" />
            <HeartIcon className="h-6 w-6 text-rose-gold mx-4" />
            <div className="h-1 w-20 bg-gradient-elegant rounded-full" />
          </div>
        </div>

        {/* Timeline Section */}
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
                                  <p className="font-semibold">{event.venue_name}</p>
                                  <p className="text-muted-foreground text-sm">{event.venue_address}</p>
                                </div>
                              </div>
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
                                  <p className="font-semibold">{event.venue_name}</p>
                                  <p className="text-muted-foreground text-sm">{event.venue_address}</p>
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

        {/* Action Buttons */}
        <div className="text-center space-x-4 fade-in-up delay-600">
          {timelineEvents.map((event, index) => (
            <Button 
              key={event.id}
              variant={index % 2 === 0 ? "premium" : "elegant"} 
              size="lg" 
              className="smoke-effect shadow-glow"
              onClick={() => {
                if (event.venue_latitude && event.venue_longitude) {
                  window.open(`https://www.google.com/maps?q=${event.venue_latitude},${event.venue_longitude}`, '_blank');
                }
              }}
            >
              <MapPinIcon className="h-5 w-5 mr-2" />
              Lihat Lokasi {event.title}
            </Button>
          ))}
        </div>

        {/* Additional Info */}
        {importantInfo && importantInfo.is_visible && (
          <div className="mt-16 fade-in-up delay-800">
            <div className="elegant-card bg-card/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 max-w-4xl mx-auto border border-primary/10">
              <h3 className="text-2xl md:text-3xl font-bold text-gradient mb-8 text-center">
                {importantInfo.title}
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary text-lg mb-3 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    {importantInfo.dress_code_title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {importantInfo.dress_code_description}
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-primary text-lg mb-3 flex items-center">
                    <HeartIcon className="h-5 w-5 mr-2" />
                    {importantInfo.health_protocol_title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {importantInfo.health_protocol_description}
                  </p>
                </div>
              </div>
              {importantInfo.download_invitation_enabled && (
                <div className="mt-8 text-center">
                  <Button 
                    variant="gold" 
                    size="xl" 
                    className="smoke-effect shadow-glow"
                    onClick={() => {
                      // Generate and download invitation
                      toast({
                        title: "Download dimulai",
                        description: "E-invitation sedang dipersiapkan untuk diunduh",
                      });
                    }}
                  >
                    <CameraIcon className="h-5 w-5 mr-2" />
                    {importantInfo.download_invitation_text}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
