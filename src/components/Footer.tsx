
import { HeartIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useWeddingContent } from '@/hooks/useWeddingContent';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const Footer = () => {
  const { footerContent, isLoading, error } = useWeddingContent();

  if (isLoading) {
    return (
      <footer className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat footer...</p>
        </div>
      </footer>
    );
  }

  if (error || !footerContent) {
    return (
      <footer className="relative overflow-hidden">
        <div className="container mx-auto px-6 py-16 text-center">
          <HeartIcon className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {error || 'Footer content tidak ditemukan'}
          </p>
        </div>
      </footer>
    );
  }

  const weddingDate = new Date(footerContent.wedding_date);
  const formattedDate = format(weddingDate, 'd MMMM yyyy', { locale: id });

  return (
    <footer className="relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-rose-gold/20 to-accent/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,theme(colors.primary/20),transparent_50%)] animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.rose-gold/20),transparent_50%)] animate-pulse animation-delay-2000"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,theme(colors.accent/20),transparent_50%)] animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Moving Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[slide-gradient_8s_ease-in-out_infinite]"></div>
      
      <div className="relative bg-gradient-to-t from-card/95 via-card/90 to-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-16">
          {/* Main Footer Content */}
          <div className="grid lg:grid-cols-4 gap-8 mb-12">
            {/* Couple Information */}
            <div className="lg:col-span-2 text-center lg:text-left">
              <div className="mb-6">
                <HeartIcon className="h-16 w-16 text-primary mx-auto lg:mx-0 mb-4 floating" />
                <h3 className="text-4xl font-bold text-gradient mb-2">
                  {footerContent.couple_names}
                </h3>
                <p className="text-xl text-muted-foreground mb-4">
                  {formattedDate}
                </p>
                <div className="flex items-center justify-center lg:justify-start">
                  <div className="h-1 w-16 bg-gradient-premium rounded-full" />
                  <HeartIcon className="h-4 w-4 text-rose-gold mx-3" />
                  <div className="h-1 w-16 bg-gradient-elegant rounded-full" />
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
                {footerContent.footer_description}
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center lg:text-left">
              <h4 className="text-lg font-semibold text-primary mb-6 flex items-center justify-center lg:justify-start">
                <MapPinIcon className="h-5 w-5 mr-2" />
                Navigasi Cepat
              </h4>
              <div className="space-y-3">
                <a href="#hero" className="block text-muted-foreground hover:text-primary transition-colors duration-300 hover-glow">
                  Beranda
                </a>
                <a href="#couple" className="block text-muted-foreground hover:text-primary transition-colors duration-300 hover-glow">
                  Mempelai
                </a>
                <a href="#details" className="block text-muted-foreground hover:text-primary transition-colors duration-300 hover-glow">
                  Detail Acara
                </a>
                <a href="#rsvp" className="block text-muted-foreground hover:text-primary transition-colors duration-300 hover-glow">
                  RSVP
                </a>
              </div>
            </div>

            {/* Contact Information */}
            <div className="text-center lg:text-left">
              <h4 className="text-lg font-semibold text-primary mb-6 flex items-center justify-center lg:justify-start">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Hubungi Kami
              </h4>
              <div className="space-y-4">
                {footerContent.contact_phone && (
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-muted-foreground hover:text-primary transition-colors duration-300 group">
                    <PhoneIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>{footerContent.contact_phone}</span>
                  </div>
                )}
                {footerContent.contact_email && (
                  <div className="flex items-center justify-center lg:justify-start gap-3 text-muted-foreground hover:text-primary transition-colors duration-300 group">
                    <EnvelopeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>{footerContent.contact_email}</span>
                  </div>
                )}
                {footerContent.contact_address && (
                  <div className="flex items-start justify-center lg:justify-start gap-3 text-muted-foreground hover:text-primary transition-colors duration-300 group">
                    <MapPinIcon className="h-5 w-5 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div>
                      <p>{footerContent.contact_address}</p>
                      <p className="text-sm">Event Organizer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thank You Section */}
          <div className="elegant-card bg-card/60 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-primary/10 hover:border-primary/20 transition-all duration-500">
            <div className="text-center">
              <h4 className="text-2xl font-bold text-gradient mb-4">
                {footerContent.thank_you_title}
              </h4>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-6">
                {footerContent.thank_you_message}
              </p>
              
              {/* Social Actions */}
              <div className="flex flex-wrap justify-center gap-4">
                {footerContent.social_buttons.map((button, index) => (
                  <Button 
                    key={index}
                    variant={index % 3 === 0 ? "premium" : index % 3 === 1 ? "elegant" : "gold"} 
                    size="sm" 
                    className="smoke-effect"
                    onClick={() => {
                      switch (button.action) {
                        case 'whatsapp':
                          if (footerContent.contact_phone) {
                            window.open(`https://wa.me/${footerContent.contact_phone.replace(/[^0-9]/g, '')}`, '_blank');
                          }
                          break;
                        case 'email':
                          if (footerContent.contact_email) {
                            window.open(`mailto:${footerContent.contact_email}`, '_blank');
                          }
                          break;
                        case 'location':
                          // Share current page URL
                          navigator.share?.({
                            title: `${footerContent.couple_names} Wedding`,
                            url: window.location.href
                          }).catch(() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast({
                              title: "Link disalin",
                              description: "Link undangan telah disalin ke clipboard",
                            });
                          });
                          break;
                      }
                    }}
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground">
                  {footerContent.copyright_text}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Designed with ❤️ using Lovable & Premium Design System
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-xs text-muted-foreground">
                  <p>Made with ❤️ & 🎨</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs hover-glow">
                  Privacy Policy
                </Button>
                <Button variant="ghost" size="sm" className="text-xs hover-glow">
                  Terms of Service
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
