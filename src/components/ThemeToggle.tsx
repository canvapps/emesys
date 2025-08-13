import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useThemeManager } from '@/hooks/useThemeManager';

export const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useThemeManager();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="smoke-effect premium-hover rounded-full border border-primary/20 backdrop-blur-sm relative overflow-hidden group transition-all duration-500 hover:scale-110"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-rose-gold/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-full scale-0 group-hover:scale-100" />
      
      {/* Rotation animation container */}
      <div className="relative z-10 transition-transform duration-700 group-hover:rotate-180">
      {isDarkMode ? (
          <SunIcon className="h-5 w-5 text-primary transition-all duration-500 group-hover:scale-125 group-hover:text-yellow-500 drop-shadow-lg" />
      ) : (
          <MoonIcon className="h-5 w-5 text-primary transition-all duration-500 group-hover:scale-125 group-hover:text-blue-500 drop-shadow-lg" />
      )}
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-60 transition-all duration-700 blur-md" />
    </Button>
  );
};