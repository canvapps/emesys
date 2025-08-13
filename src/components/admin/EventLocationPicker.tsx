
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import SimpleLocationPicker from './SimpleLocationPicker';
import { reverseGeocode } from '@/utils/geocoding';

interface EventLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

const EventLocationPicker = ({ latitude, longitude, onLocationChange }: EventLocationPickerProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: latitude || 0, lng: longitude || 0 });
  const [locationInfo, setLocationInfo] = useState<{ name: string; address: string } | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const hasSelectedLocation = coordinates.lat !== 0 && coordinates.lng !== 0;

  const handleLocationSelect = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    setCoordinates({ lat, lng });
    onLocationChange(lat, lng);
    
    try {
      // Get address from coordinates
      const geocodeResult = await reverseGeocode(lat, lng);
      
      if (geocodeResult) {
        setLocationInfo({
          name: geocodeResult.name,
          address: geocodeResult.address
        });
      } else {
        setLocationInfo({
          name: 'Lokasi Terpilih',
          address: `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      }
    } catch (error) {
      console.error('Error getting location info:', error);
      setLocationInfo({
        name: 'Lokasi Terpilih',
        address: `Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    } finally {
      setIsLoadingAddress(false);
      setIsPickerOpen(false);
    }
  };

  const handleManualInput = (field: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newCoords = { ...coordinates, [field]: numValue };
      setCoordinates(newCoords);
      onLocationChange(newCoords.lat, newCoords.lng);
      
      // Clear location info when manually editing coordinates
      if (locationInfo) {
        setLocationInfo(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Selection Button or Location Info */}
      {!hasSelectedLocation ? (
        <div className="space-y-2">
          <Label>Pilih Lokasi Acara</Label>
          <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 border-dashed border-2"
              >
                <div className="flex flex-col items-center gap-2">
                  <MapPinIcon className="h-6 w-6" />
                  <span>Klik untuk memilih lokasi di peta</span>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pilih Lokasi Acara</DialogTitle>
                <DialogDescription>
                  Klik pada peta untuk memilih lokasi acara
                </DialogDescription>
              </DialogHeader>
              
              <SimpleLocationPicker
                initialPosition={undefined}
                onLocationSelect={handleLocationSelect}
                onClose={() => setIsPickerOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Lokasi Acara Terpilih</Label>
              <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Ubah
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Pilih Lokasi Acara</DialogTitle>
                    <DialogDescription>
                      Klik pada peta untuk memilih lokasi acara
                    </DialogDescription>
                  </DialogHeader>
                  
                  <SimpleLocationPicker
                    initialPosition={[coordinates.lat, coordinates.lng]}
                    onLocationSelect={handleLocationSelect}
                    onClose={() => setIsPickerOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            {isLoadingAddress ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Memuat informasi lokasi...</span>
              </div>
            ) : locationInfo ? (
              <div className="space-y-1">
                <p className="font-medium text-sm">{locationInfo.name}</p>
                <p className="text-sm text-muted-foreground">{locationInfo.address}</p>
                <p className="text-xs text-muted-foreground">
                  Koordinat: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Koordinat: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Manual Coordinate Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Koordinat Manual (Opsional)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="latitude" className="text-xs text-muted-foreground">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={coordinates.lat}
              onChange={(e) => handleManualInput('lat', e.target.value)}
              placeholder="Latitude"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="longitude" className="text-xs text-muted-foreground">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={coordinates.lng}
              onChange={(e) => handleManualInput('lng', e.target.value)}
              placeholder="Longitude"
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventLocationPicker;
