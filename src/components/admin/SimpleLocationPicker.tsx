
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleLocationPickerProps {
  initialPosition?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}

const SimpleLocationPicker = ({ initialPosition, onLocationSelect, onClose }: SimpleLocationPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(initialPosition || null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(initialPosition || null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

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
          console.log('Got user location:', userLocation);
          setCurrentPosition(userLocation);
          setSelectedPosition(userLocation);
          
          // Pan map to current location and update marker
          if (mapRef.current) {
            mapRef.current.setView(userLocation, 15);
            updateMarker(userLocation);
          }
          
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to accurate Jakarta coordinates
          const fallbackLocation: [number, number] = [-6.2088, 106.8456];
          console.log('Using fallback location:', fallbackLocation);
          setCurrentPosition(fallbackLocation);
          setSelectedPosition(fallbackLocation);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      // Fallback to accurate Jakarta coordinates
      const fallbackLocation: [number, number] = [-6.2088, 106.8456];
      console.log('Geolocation not supported, using fallback:', fallbackLocation);
      setCurrentPosition(fallbackLocation);
      setSelectedPosition(fallbackLocation);
      setIsGettingLocation(false);
    }
  };

  const updateMarker = (position: [number, number]) => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = L.marker(position, { draggable: true })
      .addTo(mapRef.current)
      .on('dragend', function(e) {
        const marker = e.target;
        const newPosition = marker.getLatLng();
        const newPos: [number, number] = [newPosition.lat, newPosition.lng];
        console.log('Marker dragged to:', newPos);
        setSelectedPosition(newPos);
      });

    markerRef.current = marker;
  };

  const initializeMap = () => {
    if (!mapContainerRef.current || isMapInitialized) return;
    
    const position = currentPosition || initialPosition;
    if (!position) return;

    try {
      console.log('Initializing map at position:', position);
      
      // Initialize map with specific container
      const map = L.map(mapContainerRef.current, {
        center: position,
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomSnap: 0.1,
        zoomDelta: 0.5,
        wheelDebounceTime: 100,
        wheelPxPerZoomLevel: 200
      });
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Wait for map to be ready before adding event listeners
      map.whenReady(() => {
        console.log('Map is ready, adding click handler');
        
        // Add click handler with proper event handling
        map.on('click', (e: L.LeafletMouseEvent) => {
          console.log('Map clicked at:', e.latlng);
          const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
          setSelectedPosition(newPosition);
          updateMarker(newPosition);
          
          // Prevent event bubbling
          L.DomEvent.stopPropagation(e);
        });

        // Add initial marker
        updateMarker(position);
        setIsMapInitialized(true);
      });

      mapRef.current = map;
      setMapError(null);

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Gagal memuat peta');
    }
  };

  // Initialize map when component mounts and container is ready
  useEffect(() => {
    // If no initial position and no current position, get current location first
    if (!initialPosition && !currentPosition) {
      getCurrentLocation();
      return;
    }

    // Add a small delay to ensure dialog is fully rendered
    const timer = setTimeout(() => {
      initializeMap();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [currentPosition, initialPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log('Cleaning up map');
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
      setIsMapInitialized(false);
    };
  }, []);

  const handleConfirm = () => {
    if (selectedPosition) {
      console.log('Location confirmed:', selectedPosition);
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
            onClick={() => {
              setMapError(null);
              setIsMapInitialized(false);
              setTimeout(() => initializeMap(), 100);
            }}
            variant="outline"
          >
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPosition && !initialPosition) {
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
          <strong>Klik pada peta</strong> atau seret marker untuk memilih lokasi
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
      
      {/* Map container with higher z-index to ensure proper layering */}
      <div className="h-96 w-full rounded-lg overflow-hidden border relative" style={{ zIndex: 1 }}>
        <div
          ref={mapContainerRef}
          className="h-full w-full cursor-crosshair"
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative'
          }}
        />
        
        {/* Loading overlay */}
        {!isMapInitialized && (currentPosition || initialPosition) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Memuat peta...</p>
            </div>
          </div>
        )}
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

export default SimpleLocationPicker;
