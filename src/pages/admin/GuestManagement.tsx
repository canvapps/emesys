
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useGuests } from '@/hooks/useGuests';
import { useToast } from '@/hooks/use-toast';
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import GuestDetailView from '@/components/admin/GuestDetailView';
import GuestForm from '@/components/admin/GuestForm';
import { Guest } from '@/data/mockGuests';

const GuestManagement = () => {
  const { guests, isLoading, addGuest, updateGuest, deleteGuest, getGuestStats } = useGuests();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  
  // Filter guests based on search term
  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone?.includes(searchTerm) ||
    guest.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = getGuestStats();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attending':
        return <Badge variant="default">Hadir</Badge>;
      case 'not_attending':
        return <Badge variant="destructive">Tidak Hadir</Badge>;
      case 'maybe':
        return <Badge variant="secondary">Mungkin</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getInvitationTypeBadge = (type: string) => {
    switch (type) {
      case 'both':
        return <Badge variant="default">Akad & Resepsi</Badge>;
      case 'akad':
        return <Badge variant="secondary">Akad</Badge>;
      case 'resepsi':
        return <Badge variant="secondary">Resepsi</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const handleViewDetail = (guest: Guest) => {
    setSelectedGuest(guest);
    setIsDetailViewOpen(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setIsFormOpen(true);
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tamu ini?')) {
      try {
        await deleteGuest(guestId);
      } catch (error) {
        console.error('Error deleting guest:', error);
      }
    }
  };

  const handleFormSubmit = async (guestData: Omit<Guest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingGuest) {
        await updateGuest(editingGuest.id, guestData);
        toast({
          title: "Tamu diperbarui",
          description: "Data tamu berhasil diperbarui.",
        });
      } else {
        await addGuest(guestData);
        toast({
          title: "Tamu ditambahkan",
          description: "Tamu baru berhasil ditambahkan.",
        });
      }
      setIsFormOpen(false);
      setEditingGuest(null);
    } catch (error) {
      console.error('Error saving guest:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data tamu.",
        variant: "destructive",
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGuest(null);
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    setSelectedGuest(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guest Management</h1>
          <p className="text-muted-foreground">Kelola daftar tamu undangan pernikahan</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Tambah Tamu
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tamu</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menghadiri</CardTitle>
            <UsersIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Konfirmasi</CardTitle>
            <UsersIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tidak Hadir</CardTitle>
            <UsersIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.notAttending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Tamu</CardTitle>
          <CardDescription>
            Kelola dan pantau status RSVP tamu undangan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari tamu berdasarkan nama, email, atau kota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Guest List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Memuat data tamu...</p>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Tidak ada tamu yang ditemukan' : 'Belum ada tamu yang ditambahkan'}
                </p>
              </div>
            ) : (
              filteredGuests.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{guest.name}</h3>
                      {getStatusBadge(guest.attendance_status)}
                      {getInvitationTypeBadge(guest.invitation_type)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {guest.email && <p>📧 {guest.email}</p>}
                      {guest.phone && <p>📞 {guest.phone}</p>}
                      {guest.city && <p>📍 {guest.city}, {guest.province}</p>}
                      <p>👥 {guest.guest_count} orang</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(guest)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditGuest(guest)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteGuest(guest.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guest Detail Modal */}
      <GuestDetailView
        guest={selectedGuest}
        isOpen={isDetailViewOpen}
        onClose={handleCloseDetailView}
      />

      {/* Guest Form Modal */}
      <GuestForm
        guest={editingGuest}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default GuestManagement;
