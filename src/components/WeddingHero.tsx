
import { Button } from '@/components/ui/button';
import { HeartIcon, CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useWeddingHero } from '@/hooks/useWeddingHero';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const WeddingHero = () => {
  const { settings, isLoading, error } = useWeddingHero();

  // Show loading state
  if (isLoading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-rose-gold/15 to-accent/20" />
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-lg text-muted-foreground">Memuat data pernikahan...</p>
        </div>
      </section>
    );
  }

  // Show error state
  if (error || !settings) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-rose-gold/15 to-accent/20" />
        <div className="relative z-10 text-center">
          <HeartIcon className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {error || 'Data pernikahan tidak ditemukan'}
          </p>
        </div>
      </section>
    );
  }

  // Parse wedding date and time
  const weddingDate = new Date(`${settings.wedding_date}T${settings.wedding_time}`);
  const formattedDate = format(weddingDate, 'd MMMM yyyy', { locale: id });
  const formattedTime = format(weddingDate, 'HH:mm', { locale: id });
  
  // Calculate countdown
  const now = new Date();
  const timeUntilWedding = weddingDate.getTime() - now.getTime();
  const days = Math.floor(timeUntilWedding / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeUntilWedding % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilWedding % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeUntilWedding % (1000 * 60)) / 1000);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-rose-gold/15 to-accent/20 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-tl from-background/60 via-transparent to-primary/30 opacity-80" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-gold/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>
        {settings.hero_background_image && (
          <img 
            src={settings.hero_background_image} 
            alt="Wedding Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background/60 dark:from-background/70 dark:via-background/30 dark:to-background/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Floating Heart Icon with pulse */}
          <div className="floating mb-12">
            <div className="relative">
              <HeartIcon className="h-20 w-20 text-primary mx-auto mb-8 drop-shadow-lg" />
              <div className="absolute inset-0 h-20 w-20 mx-auto animate-ping">
                <HeartIcon className="h-20 w-20 text-primary/30" />
              </div>
            </div>
          </div>

          {/* Main Heading with Enhanced Typography */}
          <div className="mb-12">
            <h1 className="text-7xl md:text-9xl font-bold mb-8 fade-in-up">
              <span className="text-gradient block mb-4 hover:scale-105 transition-transform duration-300">
                {settings.groom_name}
              </span>
              <div className="flex items-center justify-center my-8">
                <div className="h-1 w-16 bg-gradient-premium rounded-full mx-4" />
                <HeartIcon className="h-8 w-8 text-rose-gold floating" />
                <div className="h-1 w-16 bg-gradient-premium rounded-full mx-4" />
              </div>
              <span className="text-gradient block hover:scale-105 transition-transform duration-300">
                {settings.bride_name}
              </span>
            </h1>
          </div>

          {/* Enhanced Subtitle */}
          <div className="mb-12 fade-in-up delay-200">
            <p className="text-2xl md:text-3xl text-muted-foreground mb-4 font-light">
              {settings.hero_subtitle}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
              {settings.hero_description}
            </p>
          </div>

          {/* Wedding Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12 fade-in-up delay-300">
            {/* Date & Time Card */}
            <div className="elegant-card bg-card/90 backdrop-blur-md rounded-2xl p-8 border border-primary/20 group hover:border-primary/40 transition-all duration-300">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-primary block">Tanggal Pernikahan</span>
                  <span className="text-xs text-muted-foreground">Save the Date</span>
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                {formattedDate}
              </p>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <ClockIcon className="h-5 w-5" />
                <span className="text-lg">{format(weddingDate, 'EEEE', { locale: id })}, {formattedTime} WIB</span>
              </div>
            </div>

            {/* Location Card */}
            <div className="elegant-card bg-card/90 backdrop-blur-md rounded-2xl p-8 border border-rose-gold/20 group hover:border-rose-gold/40 transition-all duration-300">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-3 rounded-full bg-rose-gold/10 group-hover:bg-rose-gold/20 transition-colors">
                  <MapPinIcon className="h-8 w-8 text-rose-gold" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-rose-gold block">Lokasi Acara</span>
                  <span className="text-xs text-muted-foreground">Wedding Venue</span>
                </div>
              </div>
              <p className="text-xl font-bold text-rose-gold mb-2">
                {settings.ceremony_venue_name}
              </p>
              <p className="text-muted-foreground">
                {settings.ceremony_venue_address}
              </p>
            </div>
          </div>

          {/* CTA Buttons with Enhanced Effects */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center fade-in-up delay-400 mb-16">
            <Button variant="premium" size="xl" className="min-w-56 group relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                <HeartIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Lihat Undangan Lengkap
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-glow to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            <Button variant="elegant" size="xl" className="min-w-56 group relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Konfirmasi Kehadiran
              </span>
            </Button>
          </div>

          {/* Wedding Countdown */}
          {settings.countdown_enabled && timeUntilWedding > 0 && (
            <div className="elegant-card bg-card/80 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto mb-12 fade-in-up delay-500">
              <h3 className="text-xl font-semibold text-gradient mb-6">Menuju Hari Bahagia</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-primary">{Math.max(0, days)}</div>
                  <div className="text-xs text-muted-foreground">Hari</div>
                </div>
                <div className="bg-rose-gold/10 rounded-lg p-4">
                  <div className="text-2xl font-bold text-rose-gold">{Math.max(0, hours)}</div>
                  <div className="text-xs text-muted-foreground">Jam</div>
                </div>
                <div className="bg-accent/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-foreground">{Math.max(0, minutes)}</div>
                  <div className="text-xs text-muted-foreground">Menit</div>
                </div>
                <div className="bg-secondary/40 rounded-lg p-4">
                  <div className="text-2xl font-bold text-foreground">{Math.max(0, seconds)}</div>
                  <div className="text-xs text-muted-foreground">Detik</div>
                </div>
              </div>
            </div>
          )}

          {/* Scroll Indicator with enhanced animation */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 fade-in-up delay-600">
            <div className="flex flex-col items-center gap-3 text-muted-foreground group cursor-pointer">
              <span className="text-sm font-medium group-hover:text-primary transition-colors">
                Scroll untuk melanjutkan
              </span>
              <div className="relative">
                <div className="w-1 h-12 bg-primary/30 rounded-full">
                  <div className="w-1 h-6 bg-primary rounded-full animate-bounce" />
                </div>
                <div className="absolute inset-0 w-1 h-12 bg-primary/10 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 opacity-30">
        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
      </div>
      <div className="absolute top-40 right-32 opacity-30">
        <div className="w-3 h-3 bg-rose-gold rounded-full animate-pulse" />
      </div>
      <div className="absolute bottom-40 left-32 opacity-30">
        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
      </div>
    </section>
  );
};
