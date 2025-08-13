
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  guest_count: number;
  invitation_type: 'both' | 'akad' | 'resepsi';
  attendance_status: 'pending' | 'attending' | 'not_attending' | 'maybe';
  message: string;
  rsvp_date: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export const mockGuests: Guest[] = [
  {
    id: '1',
    name: 'Ahmad Rizki',
    email: 'ahmad.rizki@email.com',
    phone: '+62 812-3456-7890',
    address: 'Jl. Sudirman No. 123',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '10110',
    guest_count: 2,
    invitation_type: 'both',
    attendance_status: 'attending',
    message: 'Selamat untuk kalian berdua!',
    rsvp_date: '2024-01-15',
    latitude: -6.2088,
    longitude: 106.8456,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@email.com',
    phone: '+62 813-4567-8901',
    address: 'Jl. Thamrin No. 456',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '10230',
    guest_count: 1,
    invitation_type: 'akad',
    attendance_status: 'pending',
    message: '',
    rsvp_date: '',
    latitude: -6.1944,
    longitude: 106.8229,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    phone: '+62 814-5678-9012',
    address: 'Jl. Gatot Subroto No. 789',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '12930',
    guest_count: 3,
    invitation_type: 'resepsi',
    attendance_status: 'not_attending',
    message: 'Maaf tidak bisa hadir, semoga lancar acaranya',
    rsvp_date: '2024-01-20',
    latitude: -6.2297,
    longitude: 106.8067,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-20T14:20:00Z'
  },
  {
    id: '4',
    name: 'Dewi Kartika',
    email: 'dewi.kartika@email.com',
    phone: '+62 815-6789-0123',
    address: 'Jl. Kuningan Raya No. 321',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '12940',
    guest_count: 2,
    invitation_type: 'both',
    attendance_status: 'maybe',
    message: 'Akan coba datang kalau tidak ada halangan',
    rsvp_date: '',
    latitude: -6.2382,
    longitude: 106.8306,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  },
  {
    id: '5',
    name: 'Andi Wijaya',
    email: 'andi.wijaya@email.com',
    phone: '+62 816-7890-1234',
    address: 'Jl. Rasuna Said No. 654',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '12950',
    guest_count: 4,
    invitation_type: 'both',
    attendance_status: 'attending',
    message: 'Tidak sabar untuk merayakan hari bahagia kalian!',
    rsvp_date: '2024-01-18',
    latitude: -6.2219,
    longitude: 106.8269,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-18T16:45:00Z'
  }
];
