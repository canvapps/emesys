/**
 * BACKWARD COMPATIBILITY WRAPPER: CoupleSection Component
 * 
 * This component provides backward compatibility for wedding-specific couple display
 * by wrapping the generic ParticipantsSection component with wedding-specific configuration.
 * 
 * Part of PHASE 2 TFD Implementation - Tactical File Completion
 */

import React from 'react';
import { ParticipantsSection } from './ParticipantsSection';

interface CoupleSectionProps {
  className?: string;
}

/**
 * Couple Section Component - Backward Compatibility Wrapper
 * Wraps ParticipantsSection with wedding-specific configuration for bride/groom display
 */
export const CoupleSection: React.FC<CoupleSectionProps> = ({ className }) => {
  return (
    <div className={className}>
      {/* Use ParticipantsSection with wedding event type */}
      <ParticipantsSection eventType="wedding" />
      
      {/* Compatibility mode indicator - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-16 bg-green-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-50">
          CoupleSection → ParticipantsSection (v2.0)
        </div>
      )}
    </div>
  );
};

export default CoupleSection;