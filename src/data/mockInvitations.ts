
export interface Invitation {
  id: string;
  guest_id: string;
  invitation_code: string;
  sent_date?: string;
  opened_date?: string;
  status: 'draft' | 'sent' | 'opened' | 'responded';
  email_subject?: string;
  email_content?: string;
  created_at: string;
  updated_at: string;
}

export const mockInvitations: Invitation[] = [
  {
    id: '1',
    guest_id: '1',
    invitation_code: 'INV-001-BUDI',
    sent_date: '2024-01-20T08:00:00Z',
    opened_date: '2024-01-20T10:15:00Z',
    status: 'responded',
    email_subject: 'Undangan Pernikahan Dhika & Sari',
    email_content: 'Dengan hormat mengundang kehadiran Bapak/Ibu dalam acara pernikahan kami...',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    guest_id: '2',
    invitation_code: 'INV-002-SITI',
    sent_date: '2024-01-20T08:00:00Z',
    opened_date: '2024-01-22T13:30:00Z',
    status: 'responded',
    email_subject: 'Undangan Pernikahan Dhika & Sari',
    email_content: 'Dengan hormat mengundang kehadiran Bapak/Ibu dalam acara pernikahan kami...',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-22T14:15:00Z'
  },
  {
    id: '3',
    guest_id: '3',
    invitation_code: 'INV-003-AHMAD',
    sent_date: '2024-01-20T08:00:00Z',
    opened_date: '2024-01-18T09:00:00Z',
    status: 'responded',
    email_subject: 'Undangan Pernikahan Dhika & Sari',
    email_content: 'Dengan hormat mengundang kehadiran Bapak/Ibu dalam acara pernikahan kami...',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-18T09:45:00Z'
  },
  {
    id: '4',
    guest_id: '4',
    invitation_code: 'INV-004-DEWI',
    sent_date: '2024-01-20T08:00:00Z',
    opened_date: '2024-01-25T15:45:00Z',
    status: 'responded',
    email_subject: 'Undangan Pernikahan Dhika & Sari',
    email_content: 'Dengan hormat mengundang kehadiran Bapak/Ibu dalam acara pernikahan kami...',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-25T16:20:00Z'
  },
  {
    id: '5',
    guest_id: '5',
    invitation_code: 'INV-005-RUDI',
    sent_date: '2024-01-20T08:00:00Z',
    status: 'sent',
    email_subject: 'Undangan Pernikahan Dhika & Sari',
    email_content: 'Dengan hormat mengundang kehadiran Bapak/Ibu dalam acara pernikahan kami...',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z'
  }
];
