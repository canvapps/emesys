/**
 * BACKWARD COMPATIBILITY WRAPPER: WeddingHero Component
 * 
 * This component provides backward compatibility for wedding-specific layouts
 * by wrapping the generic EventHero component and providing wedding-specific props.
 * 
 * Part of PHASE 2 TFD Implementation - Tactical File Completion
 */

import React from 'react';
import { EventHero } from './EventHero';

interface WeddingHeroProps {
  className?: string;
}

/**
 * Wedding Hero Component - Backward Compatibility Wrapper
 * Wraps EventHero with wedding-specific configuration
 */
export const WeddingHero: React.FC<WeddingHeroProps> = ({ className }) => {
  return (
    <div className={className}>
      {/* Use EventHero with wedding event type */}
      <EventHero eventType="wedding" />
      
      {/* Compatibility mode indicator - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50">
          WeddingHero → EventHero (v2.0)
        </div>
      )}
    </div>
  );
};

export default WeddingHero;