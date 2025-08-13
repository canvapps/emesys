
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapDisplayProps {
  latitude: number;
  longitude: number;
  name: string;
  height?: string;
}

const SimpleMapDisplay = ({ latitude, longitude, name, height = "300px" }: SimpleMapDisplayProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Initialize map
      const map = L.map(mapContainerRef.current).setView([latitude, longitude], 15);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Add marker
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>`);

      mapRef.current = map;
      setIsMapReady(true);
      setMapError(null);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Gagal memuat peta');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, name]);

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted" style={{ height }}>
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
    <div className="h-full w-full relative" style={{ height }}>
      {!isMapReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Memuat peta...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapContainerRef}
        className="h-full w-full rounded-lg"
        style={{ height }}
      />
    </div>
  );
};

export default SimpleMapDisplay;
