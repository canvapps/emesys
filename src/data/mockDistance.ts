
export interface DistanceCalculation {
  id: string;
  guest_id: string;
  event_id: string;
  guest_latitude: number;
  guest_longitude: number;
  event_latitude: number;
  event_longitude: number;
  distance_km: number;
  travel_time_minutes: {
    motorcycle: number;
    car: number;
    public_transport: number;
  };
  calculated_at: string;
}

export const mockDistanceCalculations: DistanceCalculation[] = [
  {
    id: '1',
    guest_id: '1',
    event_id: '1',
    guest_latitude: -6.2088,
    guest_longitude: 106.8456,
    event_latitude: -6.2615,
    event_longitude: 106.7810,
    distance_km: 12.5,
    travel_time_minutes: {
      motorcycle: 25,
      car: 35,
      public_transport: 45
    },
    calculated_at: '2024-01-20T10:00:00Z'
  },
  {
    id: '2',
    guest_id: '2',
    event_id: '1',
    guest_latitude: -6.9175,
    guest_longitude: 107.6191,
    event_latitude: -6.2615,
    event_longitude: 106.7810,
    distance_km: 150.3,
    travel_time_minutes: {
      motorcycle: 180,
      car: 210,
      public_transport: 300
    },
    calculated_at: '2024-01-22T14:00:00Z'
  },
  {
    id: '3',
    guest_id: '3',
    event_id: '2',
    guest_latitude: -7.2575,
    guest_longitude: 112.7521,
    event_latitude: -6.2088,
    event_longitude: 106.8456,
    distance_km: 665.8,
    travel_time_minutes: {
      motorcycle: 780,
      car: 720,
      public_transport: 900
    },
    calculated_at: '2024-01-18T09:00:00Z'
  }
];
