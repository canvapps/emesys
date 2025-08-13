/**
 * DEFAULT THEME BACKUP FILE
 * 
 * This file contains the complete backup of the original default design.
 * Use this to restore the application to its exact original state.
 * 
 * CRITICAL: Never modify this file. It serves as the permanent backup
 * for the original design that can be restored at any time.
 */

export interface DefaultThemeBackup {
  css_variables: Record<string, string>;
  component_styles: Record<string, any>;
  animations: Record<string, any>;
  version: string;
  created_at: string;
}

export const DEFAULT_THEME_BACKUP: DefaultThemeBackup = {
  version: "1.0.0",
  created_at: "2024-08-01T00:00:00Z",
  
  // Original CSS Variables from index.css
  css_variables: {
    // Premium Background Colors
    "--background": "350 20% 98%",
    "--foreground": "345 15% 8%",
    
    // Premium Card Colors
    "--card": "0 0% 100%",
    "--card-foreground": "345 15% 8%",
    
    // Popover Colors
    "--popover": "0 0% 100%",
    "--popover-foreground": "345 15% 8%",
    
    // Premium Gold Primary Colors
    "--primary": "45 95% 58%",
    "--primary-foreground": "345 15% 8%",
    "--primary-glow": "45 100% 68%",
    
    // Elegant Secondary Colors
    "--secondary": "350 15% 96%",
    "--secondary-foreground": "345 15% 15%",
    
    // Muted Premium Colors
    "--muted": "345 10% 95%",
    "--muted-foreground": "345 8% 45%",
    
    // Premium Accent Colors
    "--accent": "45 85% 85%",
    "--accent-foreground": "345 15% 8%",
    
    // Premium Rose Gold Accent
    "--rose-gold": "15 75% 65%",
    "--rose-gold-foreground": "0 0% 100%",
    
    // Error Colors
    "--destructive": "0 84% 60%",
    "--destructive-foreground": "0 0% 100%",
    
    // Border and Input Colors
    "--border": "345 10% 90%",
    "--input": "345 8% 92%",
    "--ring": "45 95% 58%",
    
    // Premium Gradients
    "--gradient-premium": "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-glow)))",
    "--gradient-elegant": "linear-gradient(135deg, hsl(var(--rose-gold)), hsl(var(--primary)))",
    "--gradient-background": "linear-gradient(180deg, hsl(var(--background)), hsl(345 15% 96%))",
    
    // Premium Shadows
    "--shadow-premium": "0 20px 40px -12px hsl(var(--primary) / 0.3)",
    "--shadow-elegant": "0 10px 30px -10px hsl(var(--rose-gold) / 0.25)",
    "--shadow-glow": "0 0 40px hsl(var(--primary-glow) / 0.4)",
    
    // Animations
    "--transition-premium": "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "--transition-smooth": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    
    "--radius": "1rem",
    
    // Dark mode variants
    "--background-dark": "345 25% 6%",
    "--foreground-dark": "350 15% 92%",
    "--card-dark": "345 20% 8%",
    "--card-foreground-dark": "350 15% 92%",
    "--primary-dark": "45 95% 62%",
    "--primary-foreground-dark": "345 25% 6%",
    "--primary-glow-dark": "45 100% 72%",
    "--secondary-dark": "345 15% 12%",
    "--secondary-foreground-dark": "350 15% 85%",
    "--muted-dark": "345 12% 10%",
    "--muted-foreground-dark": "345 8% 65%",
    "--accent-dark": "45 75% 25%",
    "--accent-foreground-dark": "350 15% 92%",
    "--rose-gold-dark": "15 70% 55%",
    "--rose-gold-foreground-dark": "345 25% 6%",
    "--destructive-dark": "0 75% 55%",
    "--destructive-foreground-dark": "350 15% 92%",
    "--border-dark": "345 12% 15%",
    "--input-dark": "345 10% 12%",
    "--ring-dark": "45 95% 62%"
  },
  
  // Component Styles
  component_styles: {
    body: {
      background: "var(--gradient-background)",
      minHeight: "100vh"
    },
    
    elegant_card: {
      position: "relative",
      transition: "var(--transition-premium)",
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))"
    },
    
    text_gradient: {
      background: "var(--gradient-premium)",
      webkitBackgroundClip: "text",
      webkitTextFillColor: "transparent",
      backgroundClip: "text"
    },
    
    premium_hover: {
      position: "relative",
      overflow: "hidden",
      transition: "var(--transition-premium)"
    }
  },
  
  // Animations
  animations: {
    blob: {
      keyframes: {
        "0%": { transform: "translate(0px, 0px) scale(1)" },
        "33%": { transform: "translate(30px, -50px) scale(1.1)" },
        "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        "100%": { transform: "translate(0px, 0px) scale(1)" }
      },
      duration: "7s",
      iterationCount: "infinite"
    },
    
    floating: {
      keyframes: {
        "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
        "25%": { transform: "translateY(-8px) rotate(1deg)" },
        "50%": { transform: "translateY(-15px) rotate(0deg)" },
        "75%": { transform: "translateY(-8px) rotate(-1deg)" }
      },
      duration: "4s",
      timingFunction: "ease-in-out",
      iterationCount: "infinite"
    },
    
    fadeInUp: {
      keyframes: {
        "0%": { opacity: "0", transform: "translateY(40px)" },
        "100%": { opacity: "1", transform: "translateY(0)" }
      },
      duration: "1s",
      timingFunction: "ease-out",
      fillMode: "forwards"
    },
    
    shimmer: {
      keyframes: {
        "0%": { left: "-100%" },
        "100%": { left: "100%" }
      },
      duration: "2s",
      iterationCount: "infinite"
    }
  }
};

/**
 * Function to restore the default theme completely
 * This will reset ALL styling to the original state
 */
export const restoreDefaultTheme = () => {
  const root = document.documentElement;
  
  // Apply all original CSS variables
  Object.entries(DEFAULT_THEME_BACKUP.css_variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Remove any dynamic theme classes
  document.body.classList.remove(
    'theme-classic-gold',
    'theme-romantic-rose', 
    'theme-modern-minimalist',
    'theme-active'
  );
  
  // Clear any dynamic theme variables
  const dynamicVars = [
    '--dynamic-primary',
    '--dynamic-primary-glow',
    '--dynamic-secondary',
    '--dynamic-accent',
    '--dynamic-rose-gold',
    '--dynamic-background',
    '--dynamic-card',
    '--dynamic-text',
    '--dynamic-muted',
    '--dynamic-border',
    '--dynamic-font-family',
    '--dynamic-font-size',
    '--dynamic-radius',
    '--dynamic-spacing'
  ];
  
  dynamicVars.forEach(varName => {
    root.style.removeProperty(varName);
  });
  
  // Remove theme-specific style elements
  const themeStyles = document.querySelectorAll('[data-theme-style]');
  themeStyles.forEach(style => style.remove());
  
  return true;
};

/**
 * Function to create a complete backup of current state before applying new theme
 */
export const createCurrentStateBackup = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const currentState = {
    css_variables: {} as Record<string, string>,
    classes: Array.from(document.body.classList),
    timestamp: new Date().toISOString()
  };
  
  // Backup current CSS variables
  Object.keys(DEFAULT_THEME_BACKUP.css_variables).forEach(key => {
    const value = computedStyle.getPropertyValue(key);
    if (value) {
      currentState.css_variables[key] = value.trim();
    }
  });
  
  return currentState;
};

export default DEFAULT_THEME_BACKUP;