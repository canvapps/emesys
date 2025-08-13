import { Button } from '@/components/ui/button';
import { HeartIcon, UserIcon, CameraIcon, AcademicCapIcon, BriefcaseIcon, SparklesIcon, UsersIcon, StarIcon } from '@heroicons/react/24/outline';
import { useEventContent } from '@/hooks/useEventContent';

interface ParticipantsSectionProps {
  eventType?: string;
}

export const ParticipantsSection = ({ eventType = 'wedding' }: ParticipantsSectionProps) => {
  const { participants, isLoading, error, eventType: currentEventType } = useEventContent(eventType);

  if (isLoading) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat informasi peserta...</p>
        </div>
      </section>
    );
  }

  if (error || participants.length === 0) {
    return (
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <UsersIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {error || 'Informasi peserta tidak ditemukan'}
          </p>
        </div>
      </section>
    );
  }

  // Get appropriate icons and titles based on event type
  const getEventConfig = () => {
    switch (currentEventType) {
      case 'wedding':
        return {
          icon: HeartIcon,
          title: 'Mempelai',
          description: 'Dua hati yang bersatu dalam cinta dan komitmen, siap membangun masa depan bersama',
          participantLabels: { primary: 'Mempelai Utama', secondary: 'Keluarga' }
        };
      case 'conference':
        return {
          icon: UsersIcon,
          title: 'Pembicara',
          description: 'Para ahli dan pemimpin industri yang akan berbagi pengetahuan dan pengalaman',
          participantLabels: { primary: 'Keynote Speaker', secondary: 'Pembicara' }
        };
      case 'birthday':
        return {
          icon: StarIcon,
          title: 'Bintang Acara',
          description: 'Orang-orang spesial yang merayakan momen berharga ini bersama kita',
          participantLabels: { primary: 'Yang Berulang Tahun', secondary: 'Tamu Kehormatan' }
        };
      default:
        return {
          icon: SparklesIcon,
          title: 'Peserta Utama',
          description: 'Orang-orang penting yang membuat acara ini istimewa',
          participantLabels: { primary: 'Peserta Utama', secondary: 'Peserta' }
        };
    }
  };

  const eventConfig = getEventConfig();
  const EventIcon = eventConfig.icon;

  // Group participants by type
  const primaryParticipants = participants.filter(p => p.participant_type === 'primary');
  const secondaryParticipants = participants.filter(p => p.participant_type === 'secondary' || p.participant_type === 'organizer');

  // Get role-specific styling for wedding
  const getRoleConfig = (participant: any) => {
    if (currentEventType === 'wedding') {
      const isGroom = participant.participant_role === 'groom';
      return {
        gradient: isGroom ? 'bg-gradient-premium' : 'bg-gradient-elegant',
        border: isGroom ? 'border-primary/10 hover:border-primary/30' : 'border-rose-gold/10 hover:border-rose-gold/30',
        shadow: isGroom ? 'hover:shadow-primary/10' : 'hover:shadow-rose-gold/10',
        accent: isGroom ? 'bg-primary/5 group-hover:bg-primary/10' : 'bg-rose-gold/5 group-hover:bg-rose-gold/10',
        accentText: isGroom ? 'text-primary' : 'text-rose-gold',
        symbol: isGroom ? '♂' : '♀',
        symbolBg: isGroom ? 'bg-rose-gold' : 'bg-primary',
        relationLabel: isGroom ? 'Putra dari' : 'Putri dari',
        iconColor: isGroom ? 'text-primary' : 'text-rose-gold'
      };
    }

    // Default styling for other event types
    return {
      gradient: 'bg-gradient-premium',
      border: 'border-primary/10 hover:border-primary/30',
      shadow: 'hover:shadow-primary/10',
      accent: 'bg-primary/5 group-hover:bg-primary/10',
      accentText: 'text-primary',
      symbol: '★',
      symbolBg: 'bg-primary',
      relationLabel: 'Informasi',
      iconColor: 'text-primary'
    };
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-gold/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <EventIcon className="h-16 w-16 text-primary mx-auto mb-8 floating drop-shadow-lg" />
          <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
            {eventConfig.title}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {eventConfig.description}
          </p>
          <div className="flex items-center justify-center mt-8">
            <div className="h-1 w-20 bg-gradient-premium rounded-full" />
            <EventIcon className="h-6 w-6 text-rose-gold mx-4" />
            <div className="h-1 w-20 bg-gradient-elegant rounded-full" />
          </div>
        </div>

        {/* Primary Participants */}
        {primaryParticipants.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-7xl mx-auto mb-16">
            {primaryParticipants.map((participant, index) => {
              const roleConfig = getRoleConfig(participant);
              
              return (
                <div key={participant.id} className="group">
                  <div className={`elegant-card bg-card/95 backdrop-blur-sm rounded-3xl p-10 md:p-12 text-center border ${roleConfig.border} transition-all duration-500 hover:shadow-2xl ${roleConfig.shadow}`}>
                    {/* Profile Image */}
                    <div className="relative mb-8 mx-auto w-40 h-40">
                      <div className={`absolute inset-0 ${roleConfig.gradient} rounded-full animate-pulse opacity-20`} />
                      <div className={`relative w-full h-full ${roleConfig.gradient} rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-premium overflow-hidden`}>
                        {participant.participant_image_url ? (
                          <img 
                            src={participant.participant_image_url} 
                            alt={participant.participant_full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-20 w-20 text-primary-foreground drop-shadow-lg" />
                        )}
                      </div>
                      <div className={`absolute -top-2 -right-2 w-12 h-12 ${roleConfig.symbolBg} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-sm">{roleConfig.symbol}</span>
                      </div>
                    </div>

                    <h3 className="text-4xl md:text-5xl font-bold text-gradient mb-6 group-hover:scale-105 transition-transform duration-300">
                      {participant.participant_full_name}
                    </h3>
                    
                    {/* Family/Organization Information */}
                    {participant.participant_parents && (
                      <div className={`${roleConfig.accent} rounded-2xl p-6 mb-8 transition-colors`}>
                        <p className={`text-lg font-semibold ${roleConfig.accentText} mb-2`}>{roleConfig.relationLabel}</p>
                        <p className="text-muted-foreground text-lg">
                          {participant.participant_parents}
                        </p>
                      </div>
                    )}

                    {/* Personal Information */}
                    <div className="space-y-4 mb-8">
                      {participant.participant_profession && (
                        <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4 group-hover:bg-muted/70 transition-colors">
                          <BriefcaseIcon className={`h-6 w-6 ${roleConfig.iconColor} flex-shrink-0`} />
                          <div className="text-left">
                            <p className="font-semibold">{participant.participant_profession}</p>
                            <p className="text-sm text-muted-foreground">Profesi</p>
                          </div>
                        </div>
                      )}
                      {participant.participant_education && (
                        <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4 group-hover:bg-muted/70 transition-colors">
                          <AcademicCapIcon className={`h-6 w-6 ${roleConfig.iconColor} flex-shrink-0`} />
                          <div className="text-left">
                            <p className="font-semibold">{participant.participant_education}</p>
                            <p className="text-sm text-muted-foreground">Pendidikan</p>
                          </div>
                        </div>
                      )}
                      {participant.participant_hobbies && (
                        <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4 group-hover:bg-muted/70 transition-colors">
                          <CameraIcon className={`h-6 w-6 ${roleConfig.iconColor} flex-shrink-0`} />
                          <div className="text-left">
                            <p className="font-semibold">Hobi</p>
                            <p className="text-sm text-muted-foreground">{participant.participant_hobbies}</p>
                          </div>
                        </div>
                      )}
                      {participant.participant_description && (
                        <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4 group-hover:bg-muted/70 transition-colors">
                          <SparklesIcon className={`h-6 w-6 ${roleConfig.iconColor} flex-shrink-0`} />
                          <div className="text-left">
                            <p className="font-semibold">Deskripsi</p>
                            <p className="text-sm text-muted-foreground">{participant.participant_description}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant={index % 2 === 0 ? "premium" : "elegant"} 
                      size="lg" 
                      className="w-full smoke-effect group-hover:shadow-glow transition-all duration-300"
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      Lihat Profil Lengkap
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Secondary Participants */}
        {secondaryParticipants.length > 0 && (
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
                {eventConfig.participantLabels.secondary}
              </h3>
              <div className="h-1 w-16 bg-gradient-elegant rounded-full mx-auto" />
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {secondaryParticipants.map((participant) => (
                <div key={participant.id} className="group">
                  <div className="elegant-card bg-card/90 backdrop-blur-sm rounded-2xl p-6 text-center border border-accent/10 hover:border-accent/30 transition-all duration-500 hover:shadow-xl">
                    <div className="relative mb-6 mx-auto w-24 h-24">
                      <div className="relative w-full h-full bg-gradient-to-br from-accent/30 to-accent/50 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        {participant.participant_image_url ? (
                          <img 
                            src={participant.participant_image_url} 
                            alt={participant.participant_full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-12 w-12 text-accent-foreground" />
                        )}
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-gradient mb-2">
                      {participant.participant_full_name}
                    </h4>
                    
                    {participant.participant_profession && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {participant.participant_profession}
                      </p>
                    )}

                    <Button variant="outline" size="sm" className="w-full">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plugin Badge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-muted/30 backdrop-blur-sm text-muted-foreground px-4 py-2 rounded-full text-sm">
            <SparklesIcon className="h-4 w-4" />
            <span>Event Type: {currentEventType}</span>
          </div>
        </div>
      </div>
    </section>
  );
};