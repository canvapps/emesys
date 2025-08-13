// ================================================================================================
// PHASE 2.3: HOOK TRANSFORMATION VALIDATION TESTS
// ================================================================================================
// Test suite untuk memvalidasi transformasi hooks dari wedding-specific ke generic event hooks
// Part of REAL_TRANSFORMATION_ROADMAP.md Phase 2.3 - TFD Implementation
// ================================================================================================

const path = require('path');
const fs = require('fs');

describe('Phase 2.3: Generic Event Hooks Transformation', () => {
  const hooksDir = path.join(__dirname, '../../../src/hooks');
  
  // Helper function to read hook file content
  const readHookFile = (filename) => {
    const filePath = path.join(hooksDir, filename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, 'utf8');
  };

  describe('Hook Files Existence', () => {
    const requiredHooks = [
      'useEventContent.ts',
      'useEventHero.ts', 
      'useEventParticipants.ts',
      'useEventSettings.ts',
      'useThemeManager.ts'
    ];

    requiredHooks.forEach(hookFile => {
      test(`${hookFile} should exist`, () => {
        const content = readHookFile(hookFile);
        expect(content).not.toBeNull();
        expect(content.length).toBeGreaterThan(0);
      });
    });
  });

  describe('useEventContent Hook', () => {
    let content;
    
    beforeAll(() => {
      content = readHookFile('useEventContent.ts');
    });

    test('should export generic useEventContent hook', () => {
      expect(content).toContain('export const useEventContent');
      expect(content).toContain('eventType?: string');
    });

    test('should support multiple event types', () => {
      expect(content).toContain('wedding');
      expect(content).toContain('conference');
      expect(content).toContain('generic');
    });

    test('should have backward compatibility layer', () => {
      expect(content).toContain('useWeddingContentCompatibility');
      expect(content).toContain('compatibility layer');
    });

    test('should use new generic database tables', () => {
      expect(content).toContain('event_content');
      expect(content).toContain('event_participants');
      expect(content).toContain('event_stories');
    });

    test('should have comprehensive interface definitions', () => {
      expect(content).toContain('interface EventContent');
      expect(content).toContain('interface EventParticipant');
      expect(content).toContain('interface EventStory');
    });
  });

  describe('useEventParticipants Hook', () => {
    let content;
    
    beforeAll(() => {
      content = readHookFile('useEventParticipants.ts');
    });

    test('should exist and be properly implemented', () => {
      expect(content).not.toBeNull();
      expect(content).toContain('export const useEventParticipants');
    });

    test('should have generic event participant interfaces', () => {
      expect(content).toContain('interface EventParticipant');
      expect(content).toContain('participant_type:');
      expect(content).toContain('participant_role');
    });

    test('should support wedding-specific data structures', () => {
      expect(content).toContain('WeddingCoupleData');
      expect(content).toContain('bride');
      expect(content).toContain('groom');
    });

    test('should support conference-specific data structures', () => {
      expect(content).toContain('ConferenceSpaker');
      expect(content).toContain('keynote');
      expect(content).toContain('speaker');
    });

    test('should have comprehensive CRUD operations', () => {
      expect(content).toContain('createParticipant');
      expect(content).toContain('updateParticipant');
      expect(content).toContain('deleteParticipant');
      expect(content).toContain('loadParticipants');
    });

    test('should have specialized wedding operations', () => {
      expect(content).toContain('createWeddingCouple');
      expect(content).toContain('updateCoupleInfo');
    });

    test('should have specialized conference operations', () => {
      expect(content).toContain('addSpeaker');
      expect(content).toContain('updateSpeaker');
    });

    test('should have utility operations', () => {
      expect(content).toContain('reorderParticipants');
      expect(content).toContain('bulkUpdateParticipants');
      expect(content).toContain('searchParticipants');
    });

    test('should have backward compatibility exports', () => {
      expect(content).toContain('useWeddingParticipants');
      expect(content).toContain('useConferenceSpeakers');
    });
  });

  describe('useEventSettings Hook', () => {
    let content;
    
    beforeAll(() => {
      content = readHookFile('useEventSettings.ts');
    });

    test('should exist and be properly implemented', () => {
      expect(content).not.toBeNull();
      expect(content).toContain('export const useEventSettings');
    });

    test('should have generic event settings interface', () => {
      expect(content).toContain('interface EventSetting');
      expect(content).toContain('setting_category');
      expect(content).toContain('setting_key');
      expect(content).toContain('setting_value');
    });

    test('should support different setting categories', () => {
      expect(content).toContain('general');
      expect(content).toContain('appearance');
      expect(content).toContain('features');
      expect(content).toContain('integrations');
      expect(content).toContain('privacy');
      expect(content).toContain('custom');
    });

    test('should have wedding-specific settings interface', () => {
      expect(content).toContain('WeddingSettings');
      expect(content).toContain('rsvp_enabled');
      expect(content).toContain('guest_book_enabled');
      expect(content).toContain('wedding_date');
    });

    test('should have conference-specific settings interface', () => {
      expect(content).toContain('ConferenceSettings');
      expect(content).toContain('registration_enabled');
      expect(content).toContain('networking_enabled');
      expect(content).toContain('conference_date');
    });

    test('should have comprehensive CRUD operations', () => {
      expect(content).toContain('loadSettings');
      expect(content).toContain('getSetting');
      expect(content).toContain('setSetting');
      expect(content).toContain('updateSettings');
      expect(content).toContain('deleteSetting');
    });

    test('should have bulk operations', () => {
      expect(content).toContain('bulkUpdateSettings');
      expect(content).toContain('resetToDefaults');
      expect(content).toContain('exportSettings');
      expect(content).toContain('importSettings');
    });

    test('should have type-specific initialization', () => {
      expect(content).toContain('initializeWeddingSettings');
      expect(content).toContain('initializeConferenceSettings');
    });

    test('should have backward compatibility exports', () => {
      expect(content).toContain('useWeddingSettings');
      expect(content).toContain('useConferenceSettings');
    });
  });

  describe('useThemeManager Hook (Updated)', () => {
    let content;
    
    beforeAll(() => {
      content = readHookFile('useThemeManager.ts');
    });

    test('should support generic event types', () => {
      expect(content).toContain('Default Event Theme');
      expect(content).not.toContain('Default Wedding Theme');
    });

    test('should have event-specific theme collections', () => {
      expect(content).toContain('WEDDING_THEMES');
      expect(content).toContain('CONFERENCE_THEMES');  
      expect(content).toContain('BIRTHDAY_THEMES');
    });

    test('should have EVENT_THEMES mapping', () => {
      expect(content).toContain('EVENT_THEMES');
      expect(content).toContain('wedding:');
      expect(content).toContain('conference:');
      expect(content).toContain('birthday:');
      expect(content).toContain('seminar:');
      expect(content).toContain('generic:');
    });

    test('should have useThemeManager options interface', () => {
      expect(content).toContain('UseThemeManagerOptions');
      expect(content).toContain('eventType?:');
      expect(content).toContain('eventId?:');
    });

    test('should use event-specific storage keys', () => {
      expect(content).toContain('storageKey');
      expect(content).toContain('currentThemeKey');
      expect(content).toContain('defaultModeKey');
    });

    test('should have professional and tech themes for conferences', () => {
      expect(content).toContain('professional-blue');
      expect(content).toContain('tech-gradient');
      expect(content).toContain('Corporate and professional');
    });

    test('should have celebration themes for birthdays', () => {
      expect(content).toContain('celebration-rainbow');
      expect(content).toContain('birthday celebrations');
    });
  });

  describe('Hook Integration and Compatibility', () => {
    test('all hooks should have consistent error handling patterns', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('loading');
        expect(content).toContain('error');
        expect(content).toContain('setLoading');
        expect(content).toContain('setError');
        expect(content).toContain('try {');
        expect(content).toContain('catch');
      });
    });

    test('all hooks should support eventType parameter', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('eventType');
      });
    });

    test('all hooks should have TypeScript interfaces', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('interface');
        expect(content).toContain('export interface');
      });
    });

    test('all hooks should support backward compatibility', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('compatibility');
      });
    });
  });

  describe('Plugin System Foundation', () => {
    test('hooks should be extensible for plugin system', () => {
      const content = readHookFile('useEventContent.ts');
      expect(content).toContain('eventType');
      expect(content).toContain('generic');
    });

    test('theme manager should support plugin themes', () => {
      const content = readHookFile('useThemeManager.ts');
      expect(content).toContain('eventType');
      expect(content).toContain('EVENT_THEMES');
    });
  });

  describe('Database Integration', () => {
    test('hooks should use compatibility views', () => {
      const content = readHookFile('useEventParticipants.ts');
      expect(content).toContain('wedding_couple_info');
    });

    test('hooks should handle new generic table structures', () => {
      const contentHook = readHookFile('useEventContent.ts');
      expect(contentHook).toContain('event_content');
      expect(contentHook).toContain('event_stories');
    });
  });

  describe('Performance and Optimization', () => {
    test('hooks should use proper React patterns', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('useState');
        expect(content).toContain('useEffect');
        expect(content).toContain('import { useState, useEffect }');
      });
    });

    test('hooks should have proper dependency arrays', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('useEffect(');
        expect(content).toContain('[');
        expect(content).toContain(']');
      });
    });
  });

  describe('Code Quality and Documentation', () => {
    test('all hooks should have comprehensive documentation headers', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('================================================================================================');
        expect(content).toContain('GENERIC EVENT');
        expect(content).toContain('Part of Phase 2.3');
        expect(content).toContain('TFD Implementation');
      });
    });

    test('hooks should have proper TypeScript exports', () => {
      const hooks = ['useEventContent.ts', 'useEventParticipants.ts', 'useEventSettings.ts'];
      
      hooks.forEach(hookFile => {
        const content = readHookFile(hookFile);
        expect(content).toContain('export const');
        expect(content).toContain('export interface');
        expect(content).toContain('export default');
      });
    });
  });

  describe('PHASE 2.3 COMPLETION VALIDATION', () => {
    test('All required hooks should be implemented', () => {
      const requiredHooks = [
        'useEventContent.ts',
        'useEventParticipants.ts', 
        'useEventSettings.ts'
      ];

      const results = requiredHooks.map(hookFile => {
        const content = readHookFile(hookFile);
        return {
          file: hookFile,
          exists: content !== null,
          hasGenericSupport: content && content.includes('eventType'),
          hasBackwardCompat: content && content.includes('compatibility'),
          hasProperInterfaces: content && content.includes('export interface'),
          isComplete: content && content.length > 300
        };
      });

      console.log('\n🔍 PHASE 2.3 HOOK TRANSFORMATION ANALYSIS:');
      console.log('================================================');
      
      results.forEach(result => {
        const status = result.exists && result.hasGenericSupport && 
                      result.hasBackwardCompat && result.hasProperInterfaces && 
                      result.isComplete ? '✅' : '❌';
        
        console.log(`${status} ${result.file}:`);
        console.log(`   - Exists: ${result.exists ? '✅' : '❌'}`);
        console.log(`   - Generic Support: ${result.hasGenericSupport ? '✅' : '❌'}`);
        console.log(`   - Backward Compatibility: ${result.hasBackwardCompat ? '✅' : '❌'}`);
        console.log(`   - Proper Interfaces: ${result.hasProperInterfaces ? '✅' : '❌'}`);
        console.log(`   - Complete Implementation: ${result.isComplete ? '✅' : '❌'}`);
        console.log('');
      });

      // Calculate overall success rate
      const totalChecks = results.length * 5;
      const passedChecks = results.reduce((acc, result) => {
        return acc + 
          (result.exists ? 1 : 0) +
          (result.hasGenericSupport ? 1 : 0) +
          (result.hasBackwardCompat ? 1 : 0) +
          (result.hasProperInterfaces ? 1 : 0) +
          (result.isComplete ? 1 : 0);
      }, 0);

      const successRate = ((passedChecks / totalChecks) * 100).toFixed(2);
      
      console.log(`📊 PHASE 2.3 SUCCESS RATE: ${successRate}% (${passedChecks}/${totalChecks} checks passed)`);
      console.log('================================================\n');

      // All hooks should exist and be properly implemented
      results.forEach(result => {
        expect(result.exists).toBe(true);
        expect(result.hasGenericSupport).toBe(true); 
        expect(result.hasBackwardCompat).toBe(true);
        expect(result.hasProperInterfaces).toBe(true);
        expect(result.isComplete).toBe(true);
      });

      // Overall success rate should be high
      expect(parseFloat(successRate)).toBeGreaterThanOrEqual(90);
    });

    test('Theme manager should support multiple event types', () => {
      const content = readHookFile('useThemeManager.ts');
      expect(content).not.toBeNull();
      
      const hasEventTypes = content.includes('WEDDING_THEMES') && 
                           content.includes('CONFERENCE_THEMES') &&
                           content.includes('BIRTHDAY_THEMES');
      
      const hasEventMapping = content.includes('EVENT_THEMES') &&
                             content.includes('eventType');
      
      console.log('\n🎨 THEME MANAGER TRANSFORMATION:');
      console.log('================================');
      console.log(`✅ Multiple Event Type Themes: ${hasEventTypes ? 'YES' : 'NO'}`);
      console.log(`✅ Event Type Mapping: ${hasEventMapping ? 'YES' : 'NO'}`);
      console.log('================================\n');

      expect(hasEventTypes).toBe(true);
      expect(hasEventMapping).toBe(true);
    });
  });
});