
export interface Backup {
  id: string;
  name: string;
  size: string;
  created_at: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'in_progress' | 'failed';
}

export const mockBackups: Backup[] = [
  {
    id: '1',
    name: 'Auto Backup - 29 Jul 2025',
    size: '12.5 MB',
    created_at: '2025-07-29T10:30:00Z',
    type: 'auto',
    status: 'completed'
  },
  {
    id: '2',
    name: 'Manual Backup - 28 Jul 2025',
    size: '11.8 MB',
    created_at: '2025-07-28T15:45:00Z',
    type: 'manual',
    status: 'completed'
  },
  {
    id: '3',
    name: 'Auto Backup - 27 Jul 2025',
    size: '11.2 MB',
    created_at: '2025-07-27T10:30:00Z',
    type: 'auto',
    status: 'completed'
  },
  {
    id: '4',
    name: 'Auto Backup - 26 Jul 2025',
    size: '10.9 MB',
    created_at: '2025-07-26T10:30:00Z',
    type: 'auto',
    status: 'failed'
  },
];
