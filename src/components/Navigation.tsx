import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { HeartIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/80 backdrop-blur-md border-b border-border/50' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <HeartIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gradient">D & S</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Beranda
            </button>
            <button 
              onClick={() => scrollToSection('couple')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Mempelai
            </button>
            <button 
              onClick={() => scrollToSection('details')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Acara
            </button>
            <button 
              onClick={() => scrollToSection('rsvp')}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              RSVP
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:block">
              <Button 
                variant="gold" 
                size="sm"
                onClick={() => scrollToSection('rsvp')}
                className="smoke-effect"
              >
                Konfirmasi
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="py-6 space-y-4">
              <button 
                onClick={() => scrollToSection('hero')}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                Beranda
              </button>
              <button 
                onClick={() => scrollToSection('couple')}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                Mempelai
              </button>
              <button 
                onClick={() => scrollToSection('details')}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                Acara
              </button>
              <button 
                onClick={() => scrollToSection('rsvp')}
                className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
              >
                RSVP
              </button>
              <div className="pt-4">
                <Button 
                  variant="gold" 
                  className="w-full smoke-effect"
                  onClick={() => scrollToSection('rsvp')}
                >
                  Konfirmasi Kehadiran
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};