
export interface Theme {
  id: string;
  name: string;
  description: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  is_active: boolean;
  preview_image?: string;
  created_at: string;
  updated_at: string;
}

export const mockThemes: Theme[] = [
  {
    id: '1',
    name: 'Classic Gold',
    description: 'Tema klasik dengan sentuhan emas yang elegan',
    primary_color: '#D4AF37',
    secondary_color: '#8B7355',
    accent_color: '#F5F5DC',
    background_color: '#FDFDF5',
    text_color: '#2C2C2C',
    font_family: 'Playfair Display',
    is_active: true,
    preview_image: '/themes/classic-gold.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    name: 'Romantic Pink',
    description: 'Tema romantis dengan warna pink yang lembut',
    primary_color: '#E91E63',
    secondary_color: '#F8BBD9',
    accent_color: '#FCE4EC',
    background_color: '#FFF0F5',
    text_color: '#424242',
    font_family: 'Dancing Script',
    is_active: false,
    preview_image: '/themes/romantic-pink.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '3',
    name: 'Modern Minimalist',
    description: 'Tema modern dengan desain minimalis yang bersih',
    primary_color: '#607D8B',
    secondary_color: '#90A4AE',
    accent_color: '#ECEFF1',
    background_color: '#FAFAFA',
    text_color: '#212121',
    font_family: 'Roboto',
    is_active: false,
    preview_image: '/themes/modern-minimalist.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '4',
    name: 'Vintage Rustic',
    description: 'Tema vintage dengan sentuhan rustic yang hangat',
    primary_color: '#8D6E63',
    secondary_color: '#BCAAA4',
    accent_color: '#EFEBE9',
    background_color: '#F5F5F5',
    text_color: '#3E2723',
    font_family: 'Merriweather',
    is_active: false,
    preview_image: '/themes/vintage-rustic.jpg',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  }
];
