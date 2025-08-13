import React from 'react';
import { ThemeConfig } from '@/hooks/useThemeManager';
import { HeartIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface ThemePreviewProps {
  theme: ThemeConfig;
  isDarkMode: boolean;
  className?: string;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, isDarkMode, className }) => {
  const colors = isDarkMode && theme.darkMode.enabled ? theme.darkMode.colors : theme.colors;

  return (
    <div 
      className={`p-8 rounded-lg border space-y-6 transition-all duration-300 overflow-hidden relative ${className}`}
      style={{
        backgroundColor: `hsl(${colors.background})`,
        borderColor: `hsl(${colors.border})`,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize,
        borderRadius: theme.layout.borderRadius,
        lineHeight: theme.typography.lineHeight,
      }}
    >
      {/* Background effects based on theme */}
      {theme.effects.gradientStyle !== 'none' && (
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: theme.effects.gradientStyle === 'romantic' 
              ? `radial-gradient(circle at 20% 50%, hsl(${theme.colors.primary}/0.1), transparent 50%)`
              : theme.effects.gradientStyle === 'modern'
              ? `linear-gradient(135deg, hsl(${theme.colors.primary}/0.05), hsl(${theme.colors.accent}/0.05))`
              : `linear-gradient(135deg, hsl(${theme.colors.primary}/0.1), hsl(${theme.colors.primaryGlow}/0.1))`
          }}
        />
      )}

      {/* Hero Section Preview */}
      <div className="text-center space-y-4 relative z-10">
        <div className="relative">
          <HeartIcon 
            className={`h-12 w-12 mx-auto mb-4 transition-all duration-300 ${
              theme.effects.animationSpeed !== 'instant' ? 'floating' : ''
            }`}
            style={{ color: `hsl(${theme.colors.primary})` }}
          />
        </div>
        
        <h1 
          className="text-4xl font-bold transition-all duration-300"
          style={{ 
            background: `linear-gradient(135deg, hsl(${theme.colors.primary}), hsl(${theme.colors.primaryGlow}))`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: theme.typography.headingFont,
            fontWeight: theme.typography.fontWeight.bold
          }}
        >
          Dhika & Sari
        </h1>
        
        <p style={{ 
          color: `hsl(${colors.muted})`,
          lineHeight: theme.typography.lineHeight
        }}>
          Merayakan Cinta yang Abadi
        </p>
      </div>

      {/* Info Cards Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <div 
          className="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg group"
          style={{
            backgroundColor: `hsl(${colors.card})`,
            borderColor: `hsl(${colors.border})`,
            borderRadius: theme.layout.borderRadius,
            boxShadow: theme.effects.shadowStyle === 'premium' 
              ? `0 10px 20px -5px hsl(${theme.colors.primary} / 0.2)` 
              : theme.effects.shadowStyle === 'soft'
              ? `0 4px 6px -1px hsl(${theme.colors.primary} / 0.1)`
              : theme.effects.shadowStyle === 'dramatic'
              ? `0 25px 50px -12px hsl(${theme.colors.primary} / 0.4)`
              : 'none'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="p-2 rounded-full transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.1)` }}
            >
              <CalendarIcon 
                className="h-5 w-5"
                style={{ color: `hsl(${theme.colors.primary})` }}
              />
            </div>
            <div>
              <p 
                className="font-semibold text-sm"
                style={{ 
                  color: `hsl(${colors.text})`,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                Tanggal Pernikahan
              </p>
              <p 
                className="text-sm"
                style={{ color: `hsl(${colors.muted})` }}
              >
                Save the Date
              </p>
            </div>
          </div>
          <p 
            className="text-lg font-bold"
            style={{ 
              color: `hsl(${theme.colors.primary})`,
              fontWeight: theme.typography.fontWeight.bold
            }}
          >
            15 Februari 2025
          </p>
        </div>

        <div 
          className="p-4 rounded-lg border transition-all duration-300 hover:shadow-lg group"
          style={{
            backgroundColor: `hsl(${colors.card})`,
            borderColor: `hsl(${colors.border})`,
            borderRadius: theme.layout.borderRadius,
            boxShadow: theme.effects.shadowStyle === 'premium' 
              ? `0 10px 20px -5px hsl(${theme.colors.roseGold} / 0.2)` 
              : theme.effects.shadowStyle === 'soft'
              ? `0 4px 6px -1px hsl(${theme.colors.roseGold} / 0.1)`
              : theme.effects.shadowStyle === 'dramatic'
              ? `0 25px 50px -12px hsl(${theme.colors.roseGold} / 0.4)`
              : 'none'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="p-2 rounded-full transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: `hsl(${theme.colors.roseGold} / 0.1)` }}
            >
              <MapPinIcon 
                className="h-5 w-5"
                style={{ color: `hsl(${theme.colors.roseGold})` }}
              />
            </div>
            <div>
              <p 
                className="font-semibold text-sm"
                style={{ 
                  color: `hsl(${colors.text})`,
                  fontWeight: theme.typography.fontWeight.medium
                }}
              >
                Lokasi Acara
              </p>
              <p 
                className="text-sm"
                style={{ color: `hsl(${colors.muted})` }}
              >
                Wedding Venue
              </p>
            </div>
          </div>
          <p 
            className="text-lg font-bold"
            style={{ 
              color: `hsl(${theme.colors.roseGold})`,
              fontWeight: theme.typography.fontWeight.bold
            }}
          >
            Gedung Serbaguna
          </p>
        </div>
      </div>

      {/* Button Preview */}
      <div className="flex gap-4 justify-center relative z-10">
        <button 
          className="px-6 py-3 font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg group relative overflow-hidden"
          style={{
            backgroundColor: `hsl(${theme.colors.primary})`,
            color: `hsl(${colors.background})`,
            borderRadius: theme.layout.borderRadius,
            boxShadow: theme.effects.shadowStyle === 'premium' 
              ? `0 10px 20px -5px hsl(${theme.colors.primary} / 0.4)`
              : theme.effects.shadowStyle === 'dramatic'
              ? `0 20px 40px -10px hsl(${theme.colors.primary} / 0.5)`
              : 'none',
            fontWeight: theme.typography.fontWeight.medium
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          Primary Button
        </button>
        <button 
          className="px-6 py-3 font-medium border transition-all duration-300 hover:scale-105 hover:shadow-lg group relative overflow-hidden"
          style={{
            borderColor: `hsl(${theme.colors.roseGold})`,
            color: `hsl(${theme.colors.roseGold})`,
            borderRadius: theme.layout.borderRadius,
            backgroundColor: 'transparent',
            fontWeight: theme.typography.fontWeight.medium
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-current/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          Secondary Button
        </button>
      </div>

      {/* Typography Preview */}
      <div className="space-y-3 relative z-10">
        <h2 
          className="text-2xl font-bold"
          style={{ 
            color: `hsl(${colors.text})`,
            fontFamily: theme.typography.headingFont,
            fontWeight: theme.typography.fontWeight.bold
          }}
        >
          Typography Preview
        </h2>
        <p style={{ 
          color: `hsl(${colors.text})`,
          lineHeight: theme.typography.lineHeight,
          fontWeight: theme.typography.fontWeight.normal
        }}>
          This is how regular text will appear with the selected typography settings. 
          The font family is {theme.typography.fontFamily} with a size of {theme.typography.fontSize}.
        </p>
        <p style={{ 
          color: `hsl(${colors.muted})`,
          fontSize: '0.875rem'
        }}>
          This is muted text that provides secondary information.
        </p>
      </div>

      {/* Effects Preview */}
      {theme.effects.blurIntensity !== 'none' && (
        <div className="relative z-10">
          <div 
            className="p-4 rounded-lg transition-all duration-300 hover:backdrop-blur-lg"
            style={{
              backgroundColor: `hsl(${colors.card})`,
              backdropFilter: theme.effects.blurIntensity === 'heavy' ? 'blur(20px)' 
                : theme.effects.blurIntensity === 'medium' ? 'blur(12px)'
                : theme.effects.blurIntensity === 'light' ? 'blur(8px)'
                : 'none',
              border: `1px solid hsl(${colors.border})`,
              borderRadius: theme.layout.borderRadius
            }}
          >
            <p style={{ color: `hsl(${colors.text})` }}>
              Blur Effect: {theme.effects.blurIntensity}
            </p>
          </div>
        </div>
      )}

      {/* Animation Speed Demo */}
      <div className="relative z-10 text-center">
        <div 
          className={`inline-block p-3 rounded-full transition-all ${
            theme.effects.animationSpeed === 'slow' ? 'duration-1000' :
            theme.effects.animationSpeed === 'normal' ? 'duration-500' :
            theme.effects.animationSpeed === 'fast' ? 'duration-200' : 'duration-0'
          } hover:scale-110 hover:rotate-12`}
          style={{
            backgroundColor: `hsl(${theme.colors.accent})`,
            color: `hsl(${colors.text})`
          }}
        >
          <SparklesIcon className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Animation Speed: {theme.effects.animationSpeed}
        </p>
      </div>
    </div>
  );
};

export default ThemePreview;