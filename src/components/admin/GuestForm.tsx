import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPinIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Guest } from '@/data/mockGuests';
import SimpleLocationPicker from './SimpleLocationPicker';
import { reverseGeocode } from '@/utils/geocoding';

interface GuestFormProps {
  guest?: Guest;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => void;
}

const GuestForm = ({ guest, isOpen, onClose, onSubmit }: GuestFormProps) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    address: guest?.address || '',
    city: guest?.city || '',
    province: guest?.province || '',
    postal_code: guest?.postal_code || '',
    guest_count: guest?.guest_count || 1,
    invitation_type: guest?.invitation_type || 'both' as const,
    attendance_status: guest?.attendance_status || 'pending' as const,
    message: guest?.message || '',
    rsvp_date: guest?.rsvp_date || '',
    latitude: guest?.latitude,
    longitude: guest?.longitude
  });

  const handleLocationSelect = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      console.log('Guest location selected:', lat, lng);
      const geocodeResult = await reverseGeocode(lat, lng);
      
      if (geocodeResult) {
        console.log('Geocoding result:', geocodeResult);
        setFormData(prev => ({
          ...prev,
          address: geocodeResult.address || prev.address,
          city: geocodeResult.city || prev.city,
          province: geocodeResult.province || prev.province,
          postal_code: geocodeResult.postalCode || prev.postal_code,
          latitude: lat,
          longitude: lng
        }));
      } else {
        // Fallback if geocoding fails
        console.log('Geocoding failed, using coordinates only');
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
      }
    } catch (error) {
      console.error('Error getting location info:', error);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    } finally {
      setIsLoadingLocation(false);
      setShowLocationPicker(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postal_code,
      guest_count: formData.guest_count,
      invitation_type: formData.invitation_type,
      attendance_status: formData.attendance_status,
      message: formData.message,
      rsvp_date: formData.rsvp_date,
      latitude: formData.latitude,
      longitude: formData.longitude
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showLocationPicker) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pilih Lokasi Tamu</DialogTitle>
            <DialogDescription>
              Klik pada peta untuk memilih lokasi alamat tamu
            </DialogDescription>
          </DialogHeader>
          
          <SimpleLocationPicker
            initialPosition={formData.latitude && formData.longitude ? [formData.latitude, formData.longitude] : undefined}
            onLocationSelect={handleLocationSelect}
            onClose={() => setShowLocationPicker(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            {guest ? 'Edit Tamu' : 'Tambah Tamu Baru'}
          </DialogTitle>
          <DialogDescription>
            {guest ? 'Perbarui informasi tamu' : 'Tambahkan tamu baru ke daftar undangan'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nama lengkap tamu"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guest_count">Jumlah Tamu</Label>
              <Input
                id="guest_count"
                type="number"
                min="1"
                max="10"
                value={formData.guest_count}
                onChange={(e) => handleInputChange('guest_count', parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+62 812-3456-7890"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Alamat Tamu</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLocationPicker(true)}
                disabled={isLoadingLocation}
              >
                <MapPinIcon className="h-4 w-4 mr-2" />
                {formData.latitude && formData.longitude ? 'Ubah Lokasi' : 'Pilih dari Peta'}
              </Button>
            </div>

            {formData.latitude && formData.longitude && (
              <div className="p-2 bg-muted/50 rounded text-sm">
                <p className="text-muted-foreground">
                  Koordinat: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Alamat lengkap tamu"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Nama kota"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Input
                  id="province"
                  value={formData.province}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  placeholder="Nama provinsi"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postal_code">Kode Pos</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invitation_type">Jenis Undangan</Label>
              <Select value={formData.invitation_type} onValueChange={(value) => handleInputChange('invitation_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Akad & Resepsi</SelectItem>
                  <SelectItem value="akad">Akad Saja</SelectItem>
                  <SelectItem value="resepsi">Resepsi Saja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attendance_status">Status Kehadiran</Label>
              <Select value={formData.attendance_status} onValueChange={(value) => handleInputChange('attendance_status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Belum Konfirmasi</SelectItem>
                  <SelectItem value="attending">Hadir</SelectItem>
                  <SelectItem value="not_attending">Tidak Hadir</SelectItem>
                  <SelectItem value="maybe">Mungkin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Pesan/Catatan</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Pesan atau catatan khusus"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoadingLocation}>
              {isLoadingLocation ? 'Memuat...' : guest ? 'Perbarui' : 'Tambah'} Tamu
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GuestForm;
