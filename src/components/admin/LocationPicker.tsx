
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  initialPosition?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

// Component to handle map click events
const LocationMarker = ({ position, onLocationSelect }: { 
  position: [number, number] | null; 
  onLocationSelect: (lat: number, lng: number) => void; 
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(position);
  
  useMapEvents({
    click(e) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      setMarkerPosition(newPosition);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return markerPosition ? (
    <Marker 
      position={markerPosition}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const newPosition = marker.getLatLng();
          const newPos: [number, number] = [newPosition.lat, newPosition.lng];
          setMarkerPosition(newPos);
          onLocationSelect(newPosition.lat, newPosition.lng);
        }
      }}
    />
  ) : null;
};

const LocationPicker = ({ initialPosition, onLocationSelect, onClose }: LocationPickerProps) => {
  const mapRef = useRef<any>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(initialPosition || null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(initialPosition || null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setCurrentPosition(userLocation);
          setSelectedPosition(userLocation);
          
          // Pan map to current location
          if (mapRef.current) {
            mapRef.current.setView(userLocation, 15);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Jakarta coordinates
          const fallbackLocation: [number, number] = [-6.2088, 106.8456];
          setCurrentPosition(fallbackLocation);
          setSelectedPosition(fallbackLocation);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      // Fallback to Jakarta coordinates
      const fallbackLocation: [number, number] = [-6.2088, 106.8456];
      setCurrentPosition(fallbackLocation);
      setSelectedPosition(fallbackLocation);
      setIsGettingLocation(false);
    }
  };

  // Get current location on component mount if no initial position
  useEffect(() => {
    if (!initialPosition) {
      getCurrentLocation();
    }
  }, [initialPosition]);

  const handleLocationSelect = (lat: number, lng: number) => {
    const newPosition: [number, number] = [lat, lng];
    setSelectedPosition(newPosition);
  };

  const handleConfirm = () => {
    if (selectedPosition) {
      onLocationSelect(selectedPosition[0], selectedPosition[1]);
    }
  };

  if (mapError) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">Peta tidak dapat dimuat</p>
          <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
          <Button 
            onClick={() => setMapError(null)}
            variant="outline"
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPosition) {
    return (
      <div className="h-96 w-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            {isGettingLocation ? 'Mendapatkan lokasi...' : 'Memuat peta...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Klik atau seret marker untuk memilih lokasi
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Lokasi Saya
        </Button>
      </div>
      
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={currentPosition}
          zoom={15}
          className="h-full w-full"
          ref={mapRef}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker 
            position={selectedPosition} 
            onLocationSelect={handleLocationSelect}
          />
        </MapContainer>
      </div>
      
      {selectedPosition && (
        <div className="p-3 bg-muted/50 rounded-lg text-sm">
          <p className="font-medium mb-1">Lokasi Terpilih:</p>
          <p className="text-muted-foreground">
            Lat: {selectedPosition[0].toFixed(6)}, Lng: {selectedPosition[1].toFixed(6)}
          </p>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={!selectedPosition}
          className="bg-primary hover:bg-primary/90"
        >
          <MapPinIcon className="h-4 w-4 mr-2" />
          Pilih Lokasi
        </Button>
      </div>
    </div>
  );
};

export default LocationPicker;
