/**
 * PHASE 2 - FRONTEND COMPONENT TRANSFORMATION TESTS (TFD)
 * 
 * Test-First Development untuk transformasi frontend components
 * dari wedding-specific menjadi generic event components.
 * 
 * Target: Transform hooks dan components menjadi generic event system
 */

const fs = require('fs');
const path = require('path');

// Color codes untuk terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}[${new Date().toISOString()}] 🚀 Starting Frontend Component Transformation Tests (TFD)${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] =================================================================================${colors.reset}`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(testName, status, details = '') {
  totalTests++;
  if (status) {
    passedTests++;
    console.log(`${colors.green}[${new Date().toISOString()}] ✅ ${testName}: ${details}${colors.reset}`);
  } else {
    failedTests++;
    console.log(`${colors.red}[${new Date().toISOString()}] ❌ ${testName}: ${details}${colors.reset}`);
  }
}

function runTest(testName, testFunction) {
  console.log(`${colors.cyan}[${new Date().toISOString()}] TEST ${totalTests + 1}: ${testName}${colors.reset}`);
  try {
    testFunction();
  } catch (error) {
    logTest(testName, false, `Test failed with error: ${error.message}`);
  }
}

// ========================================
// TEST 1: Validate Generic Event Hook Structure
// ========================================
runTest('Validating generic event hook exists', () => {
  const useEventContentPath = path.join(process.cwd(), 'src/hooks/useEventContent.ts');
  const useEventHeroPath = path.join(process.cwd(), 'src/hooks/useEventHero.ts');
  
  const eventContentExists = fs.existsSync(useEventContentPath);
  const eventHeroExists = fs.existsSync(useEventHeroPath);
  
  logTest('Generic Event Content Hook', eventContentExists, 
    eventContentExists ? 'useEventContent.ts exists' : 'useEventContent.ts does not exist - needs creation');
  
  logTest('Generic Event Hero Hook', eventHeroExists,
    eventHeroExists ? 'useEventHero.ts exists' : 'useEventHero.ts does not exist - needs creation');
});

// ========================================
// TEST 2: Validate Wedding Hooks Still Exist (Backward Compatibility)
// ========================================
runTest('Validating wedding hooks backward compatibility', () => {
  const useWeddingContentPath = path.join(process.cwd(), 'src/hooks/useWeddingContent.ts');
  const useWeddingHeroPath = path.join(process.cwd(), 'src/hooks/useWeddingHero.ts');
  
  const weddingContentExists = fs.existsSync(useWeddingContentPath);
  const weddingHeroExists = fs.existsSync(useWeddingHeroPath);
  
  logTest('Wedding Content Hook Exists', weddingContentExists,
    weddingContentExists ? 'useWeddingContent.ts maintained for backward compatibility' : 'useWeddingContent.ts missing');
  
  logTest('Wedding Hero Hook Exists', weddingHeroExists,
    weddingHeroExists ? 'useWeddingHero.ts maintained for backward compatibility' : 'useWeddingHero.ts missing');
});

// ========================================
// TEST 3: Validate Generic Event Components Structure
// ========================================
runTest('Validating generic event components', () => {
  const eventHeroPath = path.join(process.cwd(), 'src/components/EventHero.tsx');
  const eventDetailsPath = path.join(process.cwd(), 'src/components/EventDetails.tsx');
  const participantsPath = path.join(process.cwd(), 'src/components/ParticipantsSection.tsx');
  
  const eventHeroExists = fs.existsSync(eventHeroPath);
  const eventDetailsExists = fs.existsSync(eventDetailsPath);
  const participantsExists = fs.existsSync(participantsPath);
  
  logTest('Generic Event Hero Component', eventHeroExists,
    eventHeroExists ? 'EventHero.tsx exists' : 'EventHero.tsx does not exist - needs creation');
  
  logTest('Generic Event Details Component', eventDetailsExists,
    eventDetailsExists ? 'EventDetails.tsx exists' : 'EventDetails.tsx does not exist - needs creation');
  
  logTest('Generic Participants Component', participantsExists,
    participantsExists ? 'ParticipantsSection.tsx exists' : 'ParticipantsSection.tsx does not exist - needs creation');
});

// ========================================
// TEST 4: Validate Wedding Components Still Exist (Backward Compatibility)
// ========================================
runTest('Validating wedding components backward compatibility', () => {
  const weddingHeroPath = path.join(process.cwd(), 'src/components/WeddingHero.tsx');
  const weddingDetailsPath = path.join(process.cwd(), 'src/components/WeddingDetails.tsx');
  const couplePath = path.join(process.cwd(), 'src/components/CoupleSection.tsx');
  
  const weddingHeroExists = fs.existsSync(weddingHeroPath);
  const weddingDetailsExists = fs.existsSync(weddingDetailsPath);
  const coupleExists = fs.existsSync(couplePath);
  
  logTest('Wedding Hero Component Exists', weddingHeroExists,
    weddingHeroExists ? 'WeddingHero.tsx maintained for backward compatibility' : 'WeddingHero.tsx missing');
  
  logTest('Wedding Details Component Exists', weddingDetailsExists,
    weddingDetailsExists ? 'WeddingDetails.tsx maintained for backward compatibility' : 'WeddingDetails.tsx missing');
  
  logTest('Couple Section Component Exists', coupleExists,
    coupleExists ? 'CoupleSection.tsx maintained for backward compatibility' : 'CoupleSection.tsx missing');
});

// ========================================
// TEST 5: Validate Generic Event Hook Content
// ========================================
runTest('Validating generic event hook content structure', () => {
  const useEventContentPath = path.join(process.cwd(), 'src/hooks/useEventContent.ts');
  
  if (fs.existsSync(useEventContentPath)) {
    const content = fs.readFileSync(useEventContentPath, 'utf8');
    
    // Check for generic interfaces
    const hasEventParticipants = content.includes('EventParticipants') || content.includes('ParticipantInfo');
    const hasEventContent = content.includes('EventContent') && !content.includes('WeddingContent');
    const hasGenericEventData = content.includes('EventData') || content.includes('GenericEvent');
    const hasPluginSupport = content.includes('plugin') || content.includes('eventType');
    
    logTest('Generic Event Participants Interface', hasEventParticipants,
      hasEventParticipants ? 'Generic participant interfaces found' : 'Generic participant interfaces missing');
    
    logTest('Generic Event Content Structure', hasEventContent,
      hasEventContent ? 'Generic event content structure found' : 'Generic event content structure missing');
    
    logTest('Generic Event Data Models', hasGenericEventData,
      hasGenericEventData ? 'Generic event data models found' : 'Generic event data models missing');
    
    logTest('Plugin Architecture Support', hasPluginSupport,
      hasPluginSupport ? 'Plugin architecture support found' : 'Plugin architecture support missing');
  } else {
    logTest('Generic Event Hook Content', false, 'useEventContent.ts does not exist');
  }
});

// ========================================
// TEST 6: Validate Database Table References
// ========================================
runTest('Validating database table name transformation', () => {
  const useEventContentPath = path.join(process.cwd(), 'src/hooks/useEventContent.ts');
  
  if (fs.existsSync(useEventContentPath)) {
    const content = fs.readFileSync(useEventContentPath, 'utf8');
    
    // Check for generic table names
    const hasGenericTables = content.includes('events') && content.includes('event_participants');
    const hasNoWeddingTables = !content.includes('wedding_couple_info') && !content.includes('wedding_events');
    const hasEventSections = content.includes('event_sections') || content.includes('event_content');
    
    logTest('Generic Database Tables', hasGenericTables,
      hasGenericTables ? 'Generic event and participant tables referenced' : 'Generic tables missing');
    
    logTest('No Wedding-Specific Tables', hasNoWeddingTables,
      hasNoWeddingTables ? 'No wedding-specific table references found' : 'Wedding-specific tables still referenced');
    
    logTest('Event Sections Support', hasEventSections,
      hasEventSections ? 'Event sections/content support found' : 'Event sections support missing');
  } else {
    logTest('Database Table Transformation', false, 'useEventContent.ts does not exist for validation');
  }
});

// ========================================
// TEST 7: Validate Generic Component Content
// ========================================
runTest('Validating generic component content', () => {
  const eventHeroPath = path.join(process.cwd(), 'src/components/EventHero.tsx');
  
  if (fs.existsSync(eventHeroPath)) {
    const content = fs.readFileSync(eventHeroPath, 'utf8');
    
    // Check for generic content
    const hasGenericHook = content.includes('useEventHero') && !content.includes('useWeddingHero');
    const hasGenericText = !content.includes('Mempelai') && !content.includes('pernikahan');
    const hasEventTerminology = content.includes('Event') || content.includes('Acara');
    const hasPluginSupport = content.includes('eventType') || content.includes('plugin');
    
    logTest('Generic Hook Usage', hasGenericHook,
      hasGenericHook ? 'Uses useEventHero instead of useWeddingHero' : 'Still uses wedding-specific hooks');
    
    logTest('Generic UI Text', hasGenericText,
      hasGenericText ? 'No wedding-specific UI text found' : 'Wedding-specific UI text still present');
    
    logTest('Event Terminology', hasEventTerminology,
      hasEventTerminology ? 'Generic event terminology used' : 'Generic event terminology missing');
    
    logTest('Plugin Support in Components', hasPluginSupport,
      hasPluginSupport ? 'Plugin support implemented in components' : 'Plugin support missing');
  } else {
    logTest('Generic Component Content', false, 'EventHero.tsx does not exist for validation');
  }
});

// ========================================
// TEST 8: Validate Compatibility Layer
// ========================================
runTest('Validating wedding-to-event compatibility layer', () => {
  const compatibilityPath = path.join(process.cwd(), 'src/hooks/compatibility');
  const weddingWrapperPath = path.join(compatibilityPath, 'weddingWrapper.ts');
  
  const compatibilityExists = fs.existsSync(compatibilityPath);
  const weddingWrapperExists = fs.existsSync(weddingWrapperPath);
  
  logTest('Compatibility Layer Directory', compatibilityExists,
    compatibilityExists ? 'Compatibility layer directory exists' : 'Compatibility layer directory missing');
  
  logTest('Wedding Wrapper Exists', weddingWrapperExists,
    weddingWrapperExists ? 'Wedding wrapper for backward compatibility exists' : 'Wedding wrapper missing');
  
  if (weddingWrapperExists) {
    const content = fs.readFileSync(weddingWrapperPath, 'utf8');
    const hasPluginMapping = content.includes('wedding') && content.includes('plugin');
    
    logTest('Wedding Plugin Mapping', hasPluginMapping,
      hasPluginMapping ? 'Wedding-to-plugin mapping implemented' : 'Wedding-to-plugin mapping missing');
  }
});

// ========================================
// RESULTS SUMMARY
// ========================================
console.log(`${colors.blue}[${new Date().toISOString()}] =================================================================================${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] 📊 FRONTEND COMPONENT TRANSFORMATION TEST RESULTS${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] Total Tests: ${totalTests}${colors.reset}`);
console.log(`${colors.green}[${new Date().toISOString()}] Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}[${new Date().toISOString()}] Failed: ${failedTests}${colors.reset}`);

if (failedTests === 0) {
  console.log(`${colors.green}[${new Date().toISOString()}] 🎉 All frontend transformation tests passed!${colors.reset}`);
} else {
  console.log(`${colors.yellow}[${new Date().toISOString()}] ⚠️  Frontend transformation needs work!${colors.reset}`);
}

const successRate = ((passedTests / totalTests) * 100).toFixed(2);
console.log(`${colors.blue}[${new Date().toISOString()}] Success Rate: ${successRate}%${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] =================================================================================${colors.reset}`);
console.log(`${colors.blue}[${new Date().toISOString()}] ✨ Frontend Component Transformation Tests Completed${colors.reset}`);