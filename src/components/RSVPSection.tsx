import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import { useWeddingContent } from '@/hooks/useWeddingContent';

export const RSVPSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { contactInfo } = useWeddingContent();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    toast({
      title: "Konfirmasi Berhasil!",
      description: "Terima kasih atas konfirmasi kehadiran Anda.",
    });
  };

  if (isSubmitted) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="elegant-card bg-card rounded-3xl p-12">
              <CheckCircleIcon className="h-20 w-20 text-primary mx-auto mb-6 floating" />
              <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
                Konfirmasi Diterima!
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Terima kasih telah mengkonfirmasi kehadiran Anda. 
                Kami sangat menantikan kehadiran Anda di hari bahagia kami.
              </p>
              <Button 
                variant="gold" 
                size="lg" 
                onClick={() => setIsSubmitted(false)}
                className="smoke-effect"
              >
                Konfirmasi Lainnya
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <UserGroupIcon className="h-12 w-12 text-primary mx-auto mb-6 floating" />
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Konfirmasi Kehadiran
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Kehadiran Anda sangat berarti bagi kami
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="elegant-card bg-card/80 backdrop-blur-sm rounded-3xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Nama */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-lg font-semibold text-primary">
                  Nama Lengkap *
                </Label>
                <Input
                  id="name"
                  placeholder="Masukkan nama lengkap Anda"
                  required
                  className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-lg font-semibold text-primary">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-lg font-semibold text-primary">
                  Nomor Telepon
                </Label>
                <Input
                  id="phone"
                  placeholder="+62 812-3456-7890"
                  className="h-12 rounded-xl border-2 focus:border-primary transition-colors"
                />
              </div>

              {/* Konfirmasi Kehadiran */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-primary">
                  Konfirmasi Kehadiran *
                </Label>
                <Select required>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Pilih status kehadiran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hadir">✅ Ya, saya akan hadir</SelectItem>
                    <SelectItem value="tidak-hadir">❌ Maaf, saya tidak dapat hadir</SelectItem>
                    <SelectItem value="belum-pasti">❓ Belum pasti</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jumlah Tamu */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-primary">
                  Jumlah Tamu yang Hadir *
                </Label>
                <Select required>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Pilih jumlah tamu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Orang</SelectItem>
                    <SelectItem value="2">2 Orang</SelectItem>
                    <SelectItem value="3">3 Orang</SelectItem>
                    <SelectItem value="4">4 Orang</SelectItem>
                    <SelectItem value="5+">5+ Orang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Acara yang Dihadiri */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-primary">
                  Acara yang Akan Dihadiri
                </Label>
                <Select>
                  <SelectTrigger className="h-12 rounded-xl border-2">
                    <SelectValue placeholder="Pilih acara" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="akad">Akad Nikah</SelectItem>
                    <SelectItem value="resepsi">Resepsi</SelectItem>
                    <SelectItem value="kedua">Akad Nikah & Resepsi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pesan & Doa */}
              <div className="space-y-3">
                <Label htmlFor="message" className="text-lg font-semibold text-primary">
                  Pesan & Doa untuk Mempelai
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tuliskan pesan dan doa terbaik untuk kami..."
                  rows={4}
                  className="rounded-xl border-2 focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="premium" 
                  size="xl" 
                  className="w-full smoke-effect"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Konfirmasi Kehadiran
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="mt-16 text-center">
          {contactInfo && contactInfo.is_visible && (
            <div className="elegant-card bg-card/60 backdrop-blur-sm rounded-2xl p-8 max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-gradient mb-4">
                {contactInfo.help_title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {contactInfo.help_description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {contactInfo.whatsapp_number && (
                  <Button 
                    variant="outline" 
                    className="smoke-effect"
                    onClick={() => {
                      window.open(`https://wa.me/${contactInfo.whatsapp_number.replace(/[^0-9]/g, '')}`, '_blank');
                    }}
                  >
                    {contactInfo.whatsapp_text}: {contactInfo.whatsapp_number}
                  </Button>
                )}
                {contactInfo.email_address && (
                  <Button 
                    variant="outline" 
                    className="smoke-effect"
                    onClick={() => {
                      window.open(`mailto:${contactInfo.email_address}`, '_blank');
                    }}
                  >
                    {contactInfo.email_text}: {contactInfo.email_address}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};