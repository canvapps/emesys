
export interface WeddingEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'akad' | 'resepsi' | 'other';
  date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_province: string;
  venue_postal_code: string;
  venue_latitude: number;
  venue_longitude: number;
  dress_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const mockEvents: WeddingEvent[] = [
  {
    id: '1',
    title: 'Akad Nikah',
    description: 'Ijab Qabul',
    event_type: 'akad',
    date: '2025-02-15',
    start_time: '08:00',
    end_time: '10:00',
    venue_name: 'Masjid Al-Ikhlas',
    venue_address: 'Jl. Melati No. 123',
    venue_city: 'Jakarta Selatan',
    venue_province: 'DKI Jakarta',
    venue_postal_code: '12345',
    venue_latitude: -6.2615,
    venue_longitude: 106.7810,
    dress_code: 'Formal, warna earth tone',
    notes: 'Mohon hadir tepat waktu untuk prosesi akad nikah',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    title: 'Resepsi Pernikahan',
    description: 'Walimatul Ursy',
    event_type: 'resepsi',
    date: '2025-02-15',
    start_time: '18:00',
    end_time: '22:00',
    venue_name: 'The Grand Ballroom',
    venue_address: 'Hotel Premium Jakarta, Jl. Sudirman No. 45',
    venue_city: 'Jakarta Pusat',
    venue_province: 'DKI Jakarta',
    venue_postal_code: '10110',
    venue_latitude: -6.2088,
    venue_longitude: 106.8456,
    dress_code: 'Formal atau semi-formal, nuansa cream dan gold',
    notes: 'Acara resepsi dengan makan malam dan hiburan',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];
