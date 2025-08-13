import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useToast } from './use-toast';

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  
  // Color System (HSL format for better manipulation)
  colors: {
    primary: string;
    primaryGlow: string;
    secondary: string;
    accent: string;
    roseGold: string;
    background: string;
    card: string;
    text: string;
    muted: string;
    border: string;
  };
  
  // Typography
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: string;
    lineHeight: string;
    fontWeight: {
      normal: string;
      medium: string;
      bold: string;
    };
  };
  
  // Layout & Spacing
  layout: {
    borderRadius: string;
    spacing: string;
    containerWidth: string;
    sectionPadding: string;
  };
  
  // Visual Effects
  effects: {
    shadowStyle: 'none' | 'minimal' | 'soft' | 'premium' | 'dramatic';
    gradientStyle: 'none' | 'subtle' | 'premium' | 'romantic' | 'modern';
    animationSpeed: 'slow' | 'normal' | 'fast' | 'instant';
    blurIntensity: 'none' | 'light' | 'medium' | 'heavy';
  };
  
  // Component Styles
  components: {
    buttonStyle: 'minimal' | 'rounded' | 'premium' | 'elegant';
    cardStyle: 'flat' | 'elevated' | 'elegant' | 'romantic';
    navStyle: 'simple' | 'floating' | 'minimal' | 'premium';
  };
  
  // Dark/Light Mode Support
  darkMode: {
    enabled: boolean;
    colors: {
      background: string;
      card: string;
      text: string;
      muted: string;
      border: string;
    };
  };
  
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_THEME: ThemeConfig = {
  id: 'default',
  name: 'Default Event Theme',
  description: 'Original elegant design with premium accents - PROTECTED',
  
  colors: {
    primary: '45 95% 58%',
    primaryGlow: '45 100% 68%',
    secondary: '350 15% 96%',
    accent: '45 85% 85%',
    roseGold: '15 75% 65%',
    background: '350 20% 98%',
    card: '0 0% 100%',
    text: '345 15% 8%',
    muted: '345 8% 45%',
    border: '345 10% 90%',
  },
  
  typography: {
    fontFamily: 'Inter',
    headingFont: 'Playfair Display',
    fontSize: '16px',
    lineHeight: '1.6',
    fontWeight: {
      normal: '400',
      medium: '500',
      bold: '700',
    },
  },
  
  layout: {
    borderRadius: '1rem',
    spacing: '1.5rem',
    containerWidth: '1200px',
    sectionPadding: '5rem',
  },
  
  effects: {
    shadowStyle: 'premium',
    gradientStyle: 'premium',
    animationSpeed: 'normal',
    blurIntensity: 'medium',
  },
  
  components: {
    buttonStyle: 'premium',
    cardStyle: 'elegant',
    navStyle: 'floating',
  },
  
  darkMode: {
    enabled: true,
    colors: {
      background: '345 25% 6%',
      card: '345 20% 8%',
      text: '350 15% 92%',
      muted: '345 8% 65%',
      border: '345 12% 15%',
    },
  },
  
  isActive: true,
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const WEDDING_THEMES: ThemeConfig[] = [
  {
    id: 'romantic-rose',
    name: 'Romantic Rose',
    description: 'Soft romantic theme with rose and pink tones',
    
    colors: {
      primary: '350 85% 60%',
      primaryGlow: '350 90% 70%',
      secondary: '350 25% 95%',
      accent: '15 80% 85%',
      roseGold: '15 85% 75%',
      background: '350 30% 97%',
      card: '350 20% 99%',
      text: '350 20% 10%',
      muted: '350 10% 40%',
      border: '350 15% 85%',
    },
    
    typography: {
      fontFamily: 'Playfair Display',
      headingFont: 'Playfair Display',
      fontSize: '17px',
      lineHeight: '1.7',
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '600',
      },
    },
    
    layout: {
      borderRadius: '1.5rem',
      spacing: '2rem',
      containerWidth: '1200px',
      sectionPadding: '6rem',
    },
    
    effects: {
      shadowStyle: 'soft',
      gradientStyle: 'romantic',
      animationSpeed: 'slow',
      blurIntensity: 'light',
    },
    
    components: {
      buttonStyle: 'rounded',
      cardStyle: 'romantic',
      navStyle: 'minimal',
    },
    
    darkMode: {
      enabled: true,
      colors: {
        background: '350 25% 8%',
        card: '350 20% 10%',
        text: '350 15% 90%',
        muted: '350 8% 60%',
        border: '350 12% 18%',
      },
    },
    
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean and modern design with minimal elements',
    
    colors: {
      primary: '220 70% 55%',
      primaryGlow: '220 75% 65%',
      secondary: '220 15% 95%',
      accent: '180 60% 80%',
      roseGold: '30 70% 65%',
      background: '220 20% 98%',
      card: '0 0% 100%',
      text: '220 15% 10%',
      muted: '220 8% 45%',
      border: '220 10% 90%',
    },
    
    typography: {
      fontFamily: 'Inter',
      headingFont: 'Inter',
      fontSize: '15px',
      lineHeight: '1.5',
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '600',
      },
    },
    
    layout: {
      borderRadius: '0.5rem',
      spacing: '1rem',
      containerWidth: '1200px',
      sectionPadding: '4rem',
    },
    
    effects: {
      shadowStyle: 'minimal',
      gradientStyle: 'subtle',
      animationSpeed: 'fast',
      blurIntensity: 'none',
    },
    
    components: {
      buttonStyle: 'minimal',
      cardStyle: 'flat',
      navStyle: 'simple',
    },
    
    darkMode: {
      enabled: true,
      colors: {
        background: '220 25% 6%',
        card: '220 20% 8%',
        text: '220 15% 92%',
        muted: '220 8% 65%',
        border: '220 12% 15%',
      },
    },
    
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  {
    id: 'classic-gold',
    name: 'Classic Gold',
    description: 'Timeless elegance with rich gold and cream tones',
    
    colors: {
      primary: '43 96% 56%',
      primaryGlow: '43 100% 66%',
      secondary: '45 25% 94%',
      accent: '43 85% 88%',
      roseGold: '25 75% 65%',
      background: '45 30% 97%',
      card: '45 20% 99%',
      text: '43 20% 12%',
      muted: '43 10% 45%',
      border: '43 15% 88%',
    },
    
    typography: {
      fontFamily: 'Playfair Display',
      headingFont: 'Playfair Display',
      fontSize: '16px',
      lineHeight: '1.6',
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '700',
      },
    },
    
    layout: {
      borderRadius: '1.25rem',
      spacing: '1.75rem',
      containerWidth: '1200px',
      sectionPadding: '5.5rem',
    },
    
    effects: {
      shadowStyle: 'premium',
      gradientStyle: 'premium',
      animationSpeed: 'normal',
      blurIntensity: 'medium',
    },
    
    components: {
      buttonStyle: 'elegant',
      cardStyle: 'elegant',
      navStyle: 'premium',
    },
    
    darkMode: {
      enabled: true,
      colors: {
        background: '43 25% 8%',
        card: '43 20% 10%',
        text: '43 15% 90%',
        muted: '43 8% 60%',
        border: '43 12% 18%',
      },
    },
    
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const CONFERENCE_THEMES: ThemeConfig[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    description: 'Corporate and professional design with blue tones',
    
    colors: {
      primary: '210 100% 50%',
      primaryGlow: '210 100% 60%',
      secondary: '210 15% 95%',
      accent: '195 100% 85%',
      roseGold: '200 70% 65%',
      background: '210 20% 98%',
      card: '0 0% 100%',
      text: '210 15% 10%',
      muted: '210 8% 45%',
      border: '210 10% 90%',
    },
    
    typography: {
      fontFamily: 'Inter',
      headingFont: 'Inter',
      fontSize: '15px',
      lineHeight: '1.5',
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '600',
      },
    },
    
    layout: {
      borderRadius: '0.75rem',
      spacing: '1.25rem',
      containerWidth: '1200px',
      sectionPadding: '4rem',
    },
    
    effects: {
      shadowStyle: 'soft',
      gradientStyle: 'subtle',
      animationSpeed: 'normal',
      blurIntensity: 'light',
    },
    
    components: {
      buttonStyle: 'minimal',
      cardStyle: 'elevated',
      navStyle: 'simple',
    },
    
    darkMode: {
      enabled: true,
      colors: {
        background: '210 25% 8%',
        card: '210 20% 10%',
        text: '210 15% 90%',
        muted: '210 8% 60%',
        border: '210 12% 18%',
      },
    },
    
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  {
    id: 'tech-gradient',
    name: 'Tech Gradient',
    description: 'Modern tech-focused design with gradients',
    
    colors: {
      primary: '260 100% 55%',
      primaryGlow: '260 100% 65%',
      secondary: '260 15% 95%',
      accent: '280 100% 85%',
      roseGold: '300 70% 65%',
      background: '260 20% 98%',
      card: '0 0% 100%',
      text: '260 15% 10%',
      muted: '260 8% 45%',
      border: '260 10% 90%',
    },
    
    typography: {
      fontFamily: 'Inter',
      headingFont: 'Inter',
      fontSize: '15px',
      lineHeight: '1.5',
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '600',
      },
    },
    
    layout: {
      borderRadius: '0.5rem',
      spacing: '1rem',
      containerWidth: '1200px',
      sectionPadding: '3rem',
    },
    
    effects: {
      shadowStyle: 'minimal',
      gradientStyle: 'modern',
      animationSpeed: 'fast',
      blurIntensity: 'none',
    },
    
    components: {
      buttonStyle: 'minimal',
      cardStyle: 'flat',
      navStyle: 'simple',
    },
    
    darkMode: {
      enabled: true,
      colors: {
        background: '260 25% 6%',
        card: '260 20% 8%',
        text: '260 15% 92%',
        muted: '260 8% 65%',
        border: '260 12% 15%',
      },
    },
    
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const BIRTHDAY_THEMES: ThemeConfig[] = [
  {
    id: 'celebration-rainbow',
    name: 'Celebration Rainbow',
    description: 'Fun and colorful theme perfect for birthday celebrations',
    
    colors: {
      primary: '325 100% 60%',
      primaryGlow: '325 100% 70%',
      secondary: '325 25% 95%',
      accent: '290 100% 85%',
      roseGold: '45 100% 65%',
      background: '325 30% 97%',
      card: '325 20% 99%',
      text: '325 20% 10%',
      muted: '325 10% 40%',
      border: '325 15% 85%',
    },
    
    typography: {
      fontFamily: 'Inter',
      headingFont: 'Playfair Display',
      fontSize: '16px',
      lineHeight: '1.6',
      fontWeight: {
        normal: '400',
        medium: '500',
        bold: '600',
      },
    },
    
    layout: {
      borderRadius: '1.5rem',
      spacing: '2rem',
      containerWidth: '1200px',
      sectionPadding: '5rem',
    },
    
    effects: {
      shadowStyle: 'soft',
      gradientStyle: 'romantic',
      animationSpeed: 'normal',
      blurIntensity: 'light',
    },
    
    components: {
      buttonStyle: 'rounded',
      cardStyle: 'romantic',
      navStyle: 'floating',
    },
    
    darkMode: {
      enabled: true,
      colors: {
        background: '325 25% 8%',
        card: '325 20% 10%',
        text: '325 15% 90%',
        muted: '325 8% 60%',
        border: '325 12% 18%',
      },
    },
    
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Event-specific theme collections
const EVENT_THEMES: Record<string, ThemeConfig[]> = {
  wedding: WEDDING_THEMES,
  conference: CONFERENCE_THEMES,
  birthday: BIRTHDAY_THEMES,
  seminar: CONFERENCE_THEMES, // Reuse conference themes for seminars
  generic: WEDDING_THEMES, // Default to wedding themes for generic events
};

export interface UseThemeManagerOptions {
  eventType?: string;
  eventId?: string;
}

export const useThemeManager = (options: UseThemeManagerOptions = {}) => {
  const { eventType = 'generic', eventId } = options;

  // Get appropriate themes for event type
  const eventThemes = EVENT_THEMES[eventType] || EVENT_THEMES.generic;
  
  // Use event-specific storage keys for better organization
  const storageKey = eventType === 'generic' ? 'event-themes' : `${eventType}-themes`;
  const currentThemeKey = eventId ? `current-theme-${eventId}` : `current-theme-${eventType}`;
  const defaultModeKey = eventId ? `is-default-mode-${eventId}` : `is-default-mode-${eventType}`;
  
  const [themes, setThemes] = useLocalStorage<ThemeConfig[]>(storageKey, eventThemes);
  const [currentTheme, setCurrentTheme] = useLocalStorage<ThemeConfig>(currentThemeKey, DEFAULT_THEME);
  const [isDefaultMode, setIsDefaultMode] = useLocalStorage<boolean>(defaultModeKey, true);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('dark-mode', false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Apply theme to CSS variables
  const applyTheme = (theme: ThemeConfig, darkMode: boolean = false, immediate: boolean = false) => {
    const root = document.documentElement;
    
    // If it's default theme, don't override anything - just handle dark mode
    if (theme.isDefault) {
      if (immediate) {
        document.documentElement.classList.toggle('dark', darkMode);
      } else {
        // Smooth transition for dark mode
        document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
          document.documentElement.classList.toggle('dark', darkMode);
          setTimeout(() => {
            document.documentElement.style.transition = '';
          }, 300);
        }, 50);
      }
      // Remove any custom theme classes
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.remove('theme-active');
      return;
    }

    const colors = darkMode && theme.darkMode.enabled
      ? { ...theme.colors, ...theme.darkMode.colors }
      : theme.colors;
    
    // Add smooth transition class
    if (!immediate) {
      root.classList.add('theme-transitioning');
    }
    
    // Apply theme-specific CSS variables (with theme- prefix to avoid conflicts)
    root.style.setProperty('--theme-primary', colors.primary || theme.colors.primary);
    root.style.setProperty('--theme-primary-glow', colors.primaryGlow || theme.colors.primaryGlow);
    root.style.setProperty('--theme-secondary', colors.secondary || theme.colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent || theme.colors.accent);
    root.style.setProperty('--theme-rose-gold', colors.roseGold || theme.colors.roseGold);
    root.style.setProperty('--theme-background', colors.background || theme.colors.background);
    root.style.setProperty('--theme-card', colors.card || theme.colors.card);
    root.style.setProperty('--theme-foreground', colors.text || theme.colors.text);
    root.style.setProperty('--theme-muted-foreground', colors.muted || theme.colors.muted);
    root.style.setProperty('--theme-border', colors.border || theme.colors.border);
    
    // Apply typography
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
    root.style.setProperty('--theme-heading-font', theme.typography.headingFont);
    root.style.setProperty('--theme-font-size', theme.typography.fontSize);
    root.style.setProperty('--theme-line-height', theme.typography.lineHeight);
    
    // Apply layout
    root.style.setProperty('--theme-radius', theme.layout.borderRadius);
    root.style.setProperty('--theme-spacing', theme.layout.spacing);
    root.style.setProperty('--theme-section-padding', theme.layout.sectionPadding);
    
    // Apply theme class to body for component-specific styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.id}`, 'theme-active');
    
    // Apply dark mode class
    if (immediate) {
      document.documentElement.classList.toggle('dark', darkMode);
    } else {
      setTimeout(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        setTimeout(() => {
          root.classList.remove('theme-transitioning');
        }, 300);
      }, 50);
    }
    
    // Override main CSS variables when theme is active (for immediate effect)
    root.style.setProperty('--primary', colors.primary || theme.colors.primary);
    root.style.setProperty('--primary-glow', colors.primaryGlow || theme.colors.primaryGlow);
    root.style.setProperty('--secondary', colors.secondary || theme.colors.secondary);
    root.style.setProperty('--accent', colors.accent || theme.colors.accent);
    root.style.setProperty('--rose-gold', colors.roseGold || theme.colors.roseGold);
    root.style.setProperty('--background', colors.background || theme.colors.background);
    root.style.setProperty('--card', colors.card || theme.colors.card);
    root.style.setProperty('--foreground', colors.text || theme.colors.text);
    root.style.setProperty('--muted-foreground', colors.muted || theme.colors.muted);
    root.style.setProperty('--border', colors.border || theme.colors.border);
  };

  const activateTheme = (theme: ThemeConfig) => {
    if (theme.isDefault) {
      setIsDefaultMode(true);
      resetToDefault();
    } else {
      setIsDefaultMode(false);
      setCurrentTheme(theme);
      applyTheme(theme, isDarkMode);
    }
    
    toast({
      title: "Tema diaktifkan",
      description: `Tema "${theme.name}" telah diterapkan`,
    });
  };

  const updateTheme = (updatedTheme: ThemeConfig) => {
    if (updatedTheme.isDefault) {
      toast({
        title: "Tidak dapat mengubah tema default",
        description: "Tema default dilindungi dan tidak dapat dimodifikasi",
        variant: "destructive",
      });
      return;
    }

    setThemes(prev => prev.map(theme => 
      theme.id === updatedTheme.id ? updatedTheme : theme
    ));
    
    if (currentTheme.id === updatedTheme.id && !isDefaultMode) {
      setCurrentTheme(updatedTheme);
      applyTheme(updatedTheme, isDarkMode);
    }
    
    toast({
      title: "Tema diperbarui",
      description: `Tema "${updatedTheme.name}" telah diperbarui`,
    });
  };

  const createTheme = (newTheme: Omit<ThemeConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const theme: ThemeConfig = {
      ...newTheme,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setThemes(prev => [...prev, theme]);
    
    toast({
      title: "Tema baru dibuat",
      description: `Tema "${theme.name}" berhasil dibuat`,
    });
    
    return theme;
  };

  const deleteTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    
    if (theme?.isDefault) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Tema default tidak dapat dihapus",
        variant: "destructive",
      });
      return;
    }
    
    setThemes(prev => prev.filter(theme => theme.id !== themeId));
    
    if (currentTheme.id === themeId) {
      resetToDefault();
    }
    
    toast({
      title: "Tema dihapus",
      description: `Tema "${theme?.name}" telah dihapus`,
    });
  };

  const resetToDefault = () => {
    setIsDefaultMode(true);
    setCurrentTheme(DEFAULT_THEME);
    
    // Remove all custom CSS variables
    const root = document.documentElement;
    const customProperties = [
      '--theme-primary', '--theme-primary-glow', '--theme-secondary', '--theme-accent', '--theme-rose-gold',
      '--theme-background', '--theme-card', '--theme-foreground', '--theme-muted-foreground', '--theme-border',
      '--theme-font-family', '--theme-heading-font', '--theme-font-size', '--theme-line-height', '--theme-radius', 
      '--theme-spacing', '--theme-section-padding'
    ];
    
    customProperties.forEach(prop => {
      root.style.removeProperty(prop);
    });
    
    // Remove theme classes but keep dark mode
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.remove('theme-active');
    
    // Apply dark mode to default theme
    document.documentElement.classList.toggle('dark', isDarkMode);
    
    toast({
      title: "Tema direset",
      description: "Kembali ke tema default",
    });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (!isDefaultMode) {
      applyTheme(currentTheme, newDarkMode, false);
    } else {
      // Apply dark mode to default theme with smooth transition
      const root = document.documentElement;
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      setTimeout(() => {
        root.classList.toggle('dark', newDarkMode);
        setTimeout(() => {
          root.style.transition = '';
        }, 300);
      }, 50);
    }
    
    toast({
      title: `${newDarkMode ? 'Dark' : 'Light'} mode diaktifkan`,
      description: `Tema telah beralih ke ${newDarkMode ? 'dark' : 'light'} mode`,
    });
  };

  const exportTheme = (theme: ThemeConfig) => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Tema diekspor",
      description: "File tema telah diunduh",
    });
  };

  const importTheme = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const themeData = JSON.parse(e.target?.result as string);
        const importedTheme = createTheme({
          ...themeData,
          name: `${themeData.name} (Imported)`,
          isActive: false,
          isDefault: false,
        });
        
        toast({
          title: "Tema diimpor",
          description: `Tema "${importedTheme.name}" berhasil diimpor`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "File tema tidak valid",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    if (isDefaultMode) {
      // For default mode, just apply dark/light mode
      document.documentElement.classList.toggle('dark', isDarkMode);
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
      document.body.classList.remove('theme-active');
    } else {
      applyTheme(currentTheme, isDarkMode, true);
    }
  }, [currentTheme, isDarkMode, isDefaultMode]);

  return {
    themes: [DEFAULT_THEME, ...themes],
    currentTheme,
    isDefaultMode,
    isDarkMode,
    isLoading,
    activateTheme,
    updateTheme,
    createTheme,
    deleteTheme,
    resetToDefault,
    toggleDarkMode,
    exportTheme,
    importTheme,
    setIsDefaultMode,
  };
};