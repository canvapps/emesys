
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import SimpleLocationPicker from './SimpleLocationPicker';
import { reverseGeocode } from '@/utils/geocoding';

interface LocationData {
  name: string;
  address: string;
  type: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationFormWithMapProps {
  initialData?: LocationData;
  onSubmit: (data: LocationData & { latitude: number; longitude: number }) => void;
  onCancel: () => void;
}

const LocationFormWithMap = ({ initialData, onSubmit, onCancel }: LocationFormWithMapProps) => {
  const [showMap, setShowMap] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    type: initialData?.type || 'venue',
    description: initialData?.description || '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude
  });
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    
    try {
      // Get address from coordinates
      const geocodeResult = await reverseGeocode(lat, lng);
      
      if (geocodeResult) {
        setLocationData(prev => ({
          ...prev,
          name: geocodeResult.name,
          address: geocodeResult.address,
          latitude: lat,
          longitude: lng
        }));
      } else {
        // Fallback if geocoding fails
        setLocationData(prev => ({
          ...prev,
          name: prev.name || 'Lokasi Terpilih',
          address: prev.address || `Lokasi: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          latitude: lat,
          longitude: lng
        }));
      }
    } catch (error) {
      console.error('Error getting location data:', error);
      setLocationData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
    } finally {
      setIsLoadingAddress(false);
      setShowMap(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationData.latitude || !locationData.longitude) {
      return;
    }

    onSubmit({
      name: locationData.name,
      address: locationData.address,
      type: locationData.type,
      description: locationData.description,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
  };

  const hasSelectedLocation = locationData.latitude && locationData.longitude;

  if (showMap) {
    return (
      <SimpleLocationPicker
        initialPosition={hasSelectedLocation ? [locationData.latitude!, locationData.longitude!] : undefined}
        onLocationSelect={handleLocationSelect}
        onClose={() => setShowMap(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Map Selection Button or Location Info */}
      {!hasSelectedLocation ? (
        <div className="space-y-2">
          <Label>Pilih Lokasi</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full h-20 border-dashed border-2"
            onClick={() => setShowMap(true)}
          >
            <div className="flex flex-col items-center gap-2">
              <MapPinIcon className="h-6 w-6" />
              <span>Klik untuk memilih lokasi di peta</span>
            </div>
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Lokasi Terpilih</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMap(true)}
            >
              <MapPinIcon className="h-4 w-4 mr-1" />
              Ubah
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Koordinat: {locationData.latitude?.toFixed(6)}, {locationData.longitude?.toFixed(6)}</p>
          </div>
        </div>
      )}

      {/* Location Name Input */}
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lokasi</Label>
        <div className="relative">
          <Input
            id="name"
            value={locationData.name}
            onChange={(e) => setLocationData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={hasSelectedLocation ? "Nama akan terisi otomatis setelah memilih lokasi" : "Pilih lokasi di peta terlebih dahulu"}
            disabled={isLoadingAddress}
            required
          />
          {isLoadingAddress && (
            <ArrowPathIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
          )}
        </div>
      </div>

      {/* Address Input */}
      <div className="space-y-2">
        <Label htmlFor="address">Alamat</Label>
        <Textarea
          id="address"
          value={locationData.address}
          onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
          placeholder={hasSelectedLocation ? "Alamat akan terisi otomatis setelah memilih lokasi" : "Pilih lokasi di peta terlebih dahulu"}
          disabled={isLoadingAddress}
          required
        />
      </div>

      {/* Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="type">Tipe Lokasi</Label>
        <Select 
          value={locationData.type} 
          onValueChange={(value) => setLocationData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih tipe lokasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="venue">Venue Acara</SelectItem>
            <SelectItem value="accommodation">Akomodasi</SelectItem>
            <SelectItem value="other">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={locationData.description}
          onChange={(e) => setLocationData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Deskripsi lokasi (opsional)"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={!hasSelectedLocation || isLoadingAddress}
        >
          {isLoadingAddress ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              Memuat...
            </>
          ) : (
            <>
              <MapPinIcon className="h-4 w-4 mr-2" />
              Simpan Lokasi
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default LocationFormWithMap;
