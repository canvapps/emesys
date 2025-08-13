import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  description: string;
  
  // Colors
  primary_color: string;
  primary_glow: string;
  secondary_color: string;
  accent_color: string;
  rose_gold: string;
  background_color: string;
  card_color: string;
  text_color: string;
  muted_color: string;
  border_color: string;
  
  // Typography
  font_family: string;
  font_size: string;
  heading_font: string;
  
  // Layout
  border_radius: string;
  spacing: string;
  
  // Effects
  shadow_style: string;
  gradient_style: string;
  animation_speed: string;
  blur_intensity: string;
  
  // Component Specific
  button_style: string;
  card_style: string;
  nav_style: string;
  hero_style: string;
  footer_style: string;
  
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ThemeContextType {
  currentTheme: Theme;
  themes: Theme[];
  isDefaultMode: boolean;
  setCurrentTheme: (theme: Theme) => void;
  setIsDefaultMode: (isDefault: boolean) => void;
  updateTheme: (theme: Theme) => void;
  addTheme: (theme: Theme) => void;
  deleteTheme: (themeId: string) => void;
  resetToDefault: () => void;
}

const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default Theme',
  description: 'Original wedding invitation design - isolated and preserved',
  
  // Colors (HSL values matching current design)
  primary_color: '45 95% 58%',
  primary_glow: '45 100% 68%',
  secondary_color: '350 15% 96%',
  accent_color: '45 85% 85%',
  rose_gold: '15 75% 65%',
  background_color: '350 20% 98%',
  card_color: '0 0% 100%',
  text_color: '345 15% 8%',
  muted_color: '345 8% 45%',
  border_color: '345 10% 90%',
  
  // Typography
  font_family: 'Inter',
  font_size: '16px',
  heading_font: 'Inter',
  
  // Layout
  border_radius: '1rem',
  spacing: '1.5rem',
  
  // Effects
  shadow_style: 'premium',
  gradient_style: 'premium',
  animation_speed: 'normal',
  blur_intensity: 'medium',
  
  // Component Specific
  button_style: 'premium',
  card_style: 'elegant',
  nav_style: 'floating',
  hero_style: 'animated',
  footer_style: 'gradient',
  
  is_active: true,
  is_default: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};

// Legacy theme context - now using useThemeManager hook instead
const MANAGED_THEMES: Theme[] = [];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDefaultMode, setIsDefaultMode] = useState(true);
  const [themes, setThemes] = useState<Theme[]>(MANAGED_THEMES);
  const [currentTheme, setCurrentThemeState] = useState<Theme>(DEFAULT_THEME);

  // Apply theme to CSS variables
  const applyTheme = (theme: Theme) => {
    if (isDefaultMode || theme.is_default) {
      // In default mode, ensure proper dark mode handling
      const root = document.documentElement;
      
      // Remove custom theme variables
      const customProperties = [
        '--theme-primary', '--theme-primary-glow', '--theme-secondary', '--theme-accent', '--theme-rose-gold',
        '--theme-background', '--theme-card', '--theme-foreground', '--theme-muted-foreground', '--theme-border',
        '--theme-font-family', '--theme-heading-font', '--theme-font-size', '--theme-line-height', '--theme-radius', 
        '--theme-spacing', '--theme-section-padding'
      ];
      
      customProperties.forEach(prop => {
        root.style.removeProperty(prop);
      });
      
      // Remove theme classes
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.remove('theme-active');
      return;
    }

    const root = document.documentElement;
    
    // Add smooth transition
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    // Apply color variables
    root.style.setProperty('--primary', theme.primary_color);
    root.style.setProperty('--primary-glow', theme.primary_glow);
    root.style.setProperty('--secondary', theme.secondary_color);
    root.style.setProperty('--accent', theme.accent_color);
    root.style.setProperty('--rose-gold', theme.rose_gold);
    root.style.setProperty('--background', theme.background_color);
    root.style.setProperty('--card', theme.card_color);
    root.style.setProperty('--foreground', theme.text_color);
    root.style.setProperty('--muted-foreground', theme.muted_color);
    root.style.setProperty('--border', theme.border_color);
    
    // Apply typography
    root.style.setProperty('--font-family', theme.font_family);
    root.style.setProperty('--font-size', theme.font_size);
    
    // Apply layout
    root.style.setProperty('--radius', theme.border_radius);
    
    // Add theme-specific class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.id}`, 'theme-active');
    
    // Remove transition after applying
    setTimeout(() => {
      root.style.transition = '';
    }, 300);
  };

  // Reset to default theme styles
  const resetToDefault = () => {
    const root = document.documentElement;
    
    // Add smooth transition
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    setIsDefaultMode(true);
    setCurrentThemeState(DEFAULT_THEME);
    
    // Remove custom CSS variables and theme classes
    const customProperties = [
      '--theme-primary', '--theme-primary-glow', '--theme-secondary', '--theme-accent', '--theme-rose-gold',
      '--theme-background', '--theme-card', '--theme-foreground', '--theme-muted-foreground', '--theme-border',
      '--theme-font-family', '--theme-heading-font', '--theme-font-size', '--theme-line-height', '--theme-radius', 
      '--theme-spacing', '--theme-section-padding'
    ];
    
    customProperties.forEach(prop => {
      root.style.removeProperty(prop);
    });
    
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.remove('theme-active');
    
    // Remove transition after reset
    setTimeout(() => {
      root.style.transition = '';
    }, 300);
  };

  const setCurrentTheme = (theme: Theme) => {
    if (theme.is_default) {
      resetToDefault();
    } else {
      setIsDefaultMode(false);
      setCurrentThemeState(theme);
      applyTheme(theme);
    }
  };

  const updateTheme = (updatedTheme: Theme) => {
    setThemes(prev => prev.map(theme => 
      theme.id === updatedTheme.id ? updatedTheme : theme
    ));
    
    if (currentTheme.id === updatedTheme.id) {
      setCurrentTheme(updatedTheme);
    }
  };

  const addTheme = (newTheme: Theme) => {
    setThemes(prev => [...prev, newTheme]);
  };

  const deleteTheme = (themeId: string) => {
    setThemes(prev => prev.filter(theme => theme.id !== themeId));
    
    if (currentTheme.id === themeId) {
      resetToDefault();
    }
  };

  useEffect(() => {
    if (!isDefaultMode && !currentTheme.is_default) {
      applyTheme(currentTheme);
    }
  }, [currentTheme, isDefaultMode]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      themes: [DEFAULT_THEME, ...themes],
      isDefaultMode,
      setCurrentTheme,
      setIsDefaultMode,
      updateTheme,
      addTheme,
      deleteTheme,
      resetToDefault
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};