
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LocationFormWithMap from './LocationFormWithMap';
import LocationDetailModal from './LocationDetailModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Location {
  id: string;
  name: string;
  address: string;
  type: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

const defaultLocations: Location[] = [
  {
    id: '1',
    name: 'Grand Ballroom Hotel Mulia',
    address: 'Jl. Asia Afrika No.8, Gelora, Tanah Abang, Jakarta Pusat',
    type: 'venue',
    description: 'Ballroom mewah dengan kapasitas 500 tamu',
    latitude: -6.2088,
    longitude: 106.8456,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Masjid Istiqlal',
    address: 'Jl. Taman Wijaya Kusuma, Pasar Baru, Jakarta Pusat',
    type: 'venue',
    description: 'Masjid terbesar di Asia Tenggara',
    latitude: -6.1701,
    longitude: 106.8294,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const MapManager = () => {
  const [locations, setLocations] = useLocalStorage<Location[]>('wedding-locations', defaultLocations);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  const handleAddLocation = () => {
    setEditingLocation(null);
    setIsFormOpen(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleViewLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsDetailOpen(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) {
      try {
        setIsLoading(true);
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
        
        toast({
          title: "Lokasi dihapus",
          description: "Lokasi berhasil dihapus dari daftar.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Gagal menghapus lokasi.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = async (locationData: any) => {
    try {
      setIsLoading(true);
      
      if (editingLocation) {
        // Update existing location
        setLocations(prev => prev.map(loc => 
          loc.id === editingLocation.id 
            ? { 
                ...loc, 
                ...locationData, 
                updated_at: new Date().toISOString() 
              }
            : loc
        ));
        
        toast({
          title: "Lokasi diperbarui",
          description: "Data lokasi berhasil diperbarui.",
        });
      } else {
        // Add new location
        const newLocation: Location = {
          id: Date.now().toString(),
          ...locationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        setLocations(prev => [...prev, newLocation]);
        
        toast({
          title: "Lokasi ditambahkan",
          description: "Lokasi baru berhasil ditambahkan.",
        });
      }
      
      setIsFormOpen(false);
      setEditingLocation(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan data lokasi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
  };

  const openInGoogleMaps = (location: Location) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, '_blank');
  };

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleFormCancel}>
            ← Kembali
          </Button>
          <h1 className="text-2xl font-bold">
            {editingLocation ? 'Edit Lokasi' : 'Tambah Lokasi Baru'}
          </h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <LocationFormWithMap
              initialData={editingLocation || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Map & Locations</h1>
          <p className="text-muted-foreground">Kelola lokasi dan peta untuk acara pernikahan</p>
        </div>
        <Button onClick={handleAddLocation}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Lokasi
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lokasi</CardTitle>
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venue Acara</CardTitle>
            <MapPinIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {locations.filter(loc => loc.type === 'venue').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Akomodasi</CardTitle>
            <MapPinIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {locations.filter(loc => loc.type === 'accommodation').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lokasi</CardTitle>
          <CardDescription>
            Kelola semua lokasi yang terkait dengan acara pernikahan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Memuat data lokasi...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPinIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Belum ada lokasi yang ditambahkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{location.name}</h3>
                      {getLocationTypeBadge(location.type)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>📍 {location.address}</p>
                      {location.description && <p>📝 {location.description}</p>}
                      <p>🌍 {
                        location.latitude && location.longitude 
                          ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                          : 'Koordinat tidak tersedia'
                      }</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openInGoogleMaps(location)}
                      title="Buka di Google Maps"
                      disabled={!location.latitude || !location.longitude}
                    >
                      <MapPinIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewLocation(location)}
                      title="Lihat Detail"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLocation(location)}
                      title="Edit Lokasi"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                      title="Hapus Lokasi"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Detail Modal */}
      <LocationDetailModal
        location={selectedLocation}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLocation(null);
        }}
      />
    </div>
  );
};

export default MapManager;
