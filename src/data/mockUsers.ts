
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@dhikasari.com',
    name: 'Wedding Admin',
    role: 'admin',
    avatar: '/avatars/admin.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    email: 'dhika@example.com',
    name: 'Dhika Pratama',
    role: 'admin',
    avatar: '/avatars/dhika.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '3',
    email: 'sari@example.com',
    name: 'Sari Indah',
    role: 'admin',
    avatar: '/avatars/sari.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];
