
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'venue' | 'accommodation' | 'other';
  description?: string;
}

interface MapDisplayProps {
  center: [number, number];
  locations: Location[];
  selectedEventId: string;
}

const MapDisplay = ({ center, locations, selectedEventId }: MapDisplayProps) => {
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Set a timeout to detect if map fails to load
    timeoutId = setTimeout(() => {
      if (!isMapReady) {
        setMapError("Map failed to load within timeout");
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isMapReady]);

  useEffect(() => {
    if (mapRef.current && isMapReady) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 100);
    }
  }, [selectedEventId, isMapReady]);

  const handleMapReady = () => {
    setIsMapReady(true);
    setMapError(null);
  };

  const filteredLocations = locations.filter(
    location => location.id === selectedEventId || location.type !== 'venue'
  );

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted">
        <div className="text-center p-6">
          <div className="mb-4 text-muted-foreground">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground mb-4">Peta tidak dapat dimuat</p>
          <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
          <button 
            onClick={() => {
              setMapError(null);
              setIsMapReady(false);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {!isMapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Memuat peta...</p>
          </div>
        </div>
      )}
      
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full rounded-lg"
        ref={mapRef}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapReady}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
          >
            <Popup>
              <div className="min-w-48">
                <h3 className="font-medium text-base mb-1">{location.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{location.address}</p>
                {location.description && (
                  <p className="text-sm text-muted-foreground">{location.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
