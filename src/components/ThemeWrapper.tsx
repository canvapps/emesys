import React from 'react';
import { useThemeManager } from '@/hooks/useThemeManager';

interface ThemeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children, className = '' }) => {
  const { currentTheme, isDefaultMode } = useThemeManager();

  // In default mode, render children without any theme modifications
  if (isDefaultMode || currentTheme.isDefault) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  // For managed themes, apply theme-specific classes and styles
  return (
    <div 
      className={`${className} theme-${currentTheme.id} theme-active`}
      style={{
        '--theme-primary': currentTheme.colors.primary,
        '--theme-primary-glow': currentTheme.colors.primaryGlow,
        '--theme-secondary': currentTheme.colors.secondary,
        '--theme-accent': currentTheme.colors.accent,
        '--theme-rose-gold': currentTheme.colors.roseGold,
        '--theme-background': currentTheme.colors.background,
        '--theme-card': currentTheme.colors.card,
        '--theme-foreground': currentTheme.colors.text,
        '--theme-muted-foreground': currentTheme.colors.muted,
        '--theme-border': currentTheme.colors.border,
        '--theme-font-family': currentTheme.typography.fontFamily,
        '--theme-heading-font': currentTheme.typography.headingFont,
        '--theme-font-size': currentTheme.typography.fontSize,
        '--theme-line-height': currentTheme.typography.lineHeight,
        '--theme-radius': currentTheme.layout.borderRadius,
        '--theme-spacing': currentTheme.layout.spacing,
        '--theme-section-padding': currentTheme.layout.sectionPadding,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};