
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPinIcon, GlobeAltIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import SimpleMapDisplay from './SimpleMapDisplay';

interface LocationDetailModalProps {
  location: {
    id: string;
    name: string;
    address: string;
    type: string;
    latitude?: number;
    longitude?: number;
    description?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const LocationDetailModal = ({ location, isOpen, onClose }: LocationDetailModalProps) => {
  if (!location) return null;

  const hasCoordinates = location.latitude && location.longitude;

  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case 'venue':
        return <Badge variant="default">Venue Acara</Badge>;
      case 'accommodation':
        return <Badge variant="secondary">Akomodasi</Badge>;
      default:
        return <Badge variant="outline">Lainnya</Badge>;
    }
  };

  const openInGoogleMaps = () => {
    if (hasCoordinates) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BuildingOfficeIcon className="h-5 w-5" />
            Detail Lokasi
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap lokasi dan peta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{location.name}</h3>
              <div className="flex gap-2">
                {getLocationTypeBadge(location.type)}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Alamat:</p>
                  <p className="text-muted-foreground">{location.address}</p>
                </div>
              </div>
              
              {hasCoordinates && (
                <div className="flex items-center gap-2 text-sm">
                  <GlobeAltIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Koordinat:</span>
                  <span className="text-muted-foreground">
                    {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                  </span>
                </div>
              )}
            </div>

            {location.description && (
              <div className="space-y-2">
                <p className="font-medium text-sm">Deskripsi:</p>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  {location.description}
                </p>
              </div>
            )}
          </div>

          {/* Map Display */}
          {hasCoordinates ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Peta Lokasi</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInGoogleMaps}
                >
                  <GlobeAltIcon className="h-4 w-4 mr-2" />
                  Buka di Google Maps
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <SimpleMapDisplay
                  latitude={location.latitude!}
                  longitude={location.longitude!}
                  name={location.name}
                  height="300px"
                />
              </div>
            </div>
          ) : (
            <div className="bg-muted/30 p-6 rounded-lg text-center">
              <MapPinIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                Koordinat tidak tersedia untuk lokasi ini
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationDetailModal;
