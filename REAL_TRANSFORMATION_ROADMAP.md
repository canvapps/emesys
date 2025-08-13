# 🔥 REAL TRANSFORMATION ROADMAP - Event Management Engine

**Date:** 2025-01-13  
**Priority:** CRITICAL  
**Duration Estimate:** 4-6 weeks intensive work  

---

## 🎯 **EXECUTIVE SUMMARY**

**TRANSFORMASI SEBENARNYA:** Dari wedding-specific application ke generic Event Management Engine platform.

**CURRENT REALITY:**
- ❌ 109+ hardcoded wedding references
- ❌ Database structure duplication confusion  
- ❌ Frontend masih 100% wedding-specific
- ❌ No plugin architecture implemented

**TARGET STATE:**
- ✅ Generic event management platform
- ✅ Plugin-based event types (wedding sebagai first plugin)
- ✅ Clean database structure
- ✅ Scalable component architecture

---

## 📊 **TRANSFORMATION PHASES**

### **PHASE 1: DATABASE STRUCTURE CLEANUP** (Week 1)

#### **1.1 Resolve Database Duplication**

**Current Problem:**
```
❌ CONFUSION:
├── database/migrations/          # ??? Which one?
└── src/database/migrations/      # ??? Which one?
```

**SOLUTION:**
```
✅ CLEAN STRUCTURE:
├── database/
│   ├── schema.sql               # Master schema
│   ├── migrations/              # All migrations
│   └── seeders/                 # Seed data
├── src/database/
│   ├── connection.ts            # DB connection only
│   ├── models/                  # Data models
│   └── repositories/            # Data access
└── __tests__/database/          # Database tests
```

**ACTION ITEMS:**
- [ ] Consolidate all migrations ke `/database/migrations/`
- [ ] Move connection utilities ke `/src/database/connection.ts`
- [ ] Create clear developer guidelines
- [ ] Update all import paths
- [ ] Test database connectivity

#### **1.2 Schema Transformation**

**Current Wedding Tables:**
```sql
❌ wedding_couple_info
❌ wedding_love_story
❌ wedding_important_info
❌ wedding_contact_info
❌ wedding_footer_content
❌ wedding_events
❌ wedding_hero_settings
```

**Target Generic Tables:**
```sql
✅ events                    # Main event table
✅ event_participants        # Generic participants
✅ event_sections           # Dynamic content sections
✅ event_templates          # Event type templates
✅ event_plugins            # Plugin configurations
✅ event_settings           # Event-specific settings
✅ event_forms              # Dynamic forms
```

**Migration Strategy:**
1. **Backward Compatibility Views:**
   ```sql
   CREATE VIEW wedding_couple_info AS 
   SELECT * FROM event_participants 
   WHERE participant_type = 'couple' AND event_id IN 
     (SELECT id FROM events WHERE event_type = 'wedding');
   ```

2. **Data Migration Scripts:**
   - Migrate existing wedding data to generic schema
   - Preserve all current functionality
   - Create wedding plugin configuration

**ACTION ITEMS:**
- [ ] Create generic schema migration
- [ ] Create data migration scripts
- [ ] Create compatibility views
- [ ] Test backward compatibility
- [ ] Update all database queries

---

### **PHASE 2: FRONTEND TRANSFORMATION** (Week 2-3)

#### **2.1 Component Architecture Transformation**

**Current Wedding Components:**
```typescript
❌ WeddingHero.tsx           → ✅ EventHero.tsx
❌ WeddingDetails.tsx        → ✅ EventDetails.tsx
❌ CoupleSection.tsx         → ✅ ParticipantsSection.tsx
❌ LoveStorySection.tsx      → ✅ StorySection.tsx
❌ RSVPSection.tsx           → ✅ RegistrationSection.tsx
❌ WeddingHeroManager.tsx    → ✅ EventHeroManager.tsx
```

**Generic Component Pattern:**
```typescript
// New pattern: Event-agnostic with plugin support
interface EventComponentProps {
  eventId: string;
  eventType: string;
  config: EventPluginConfig;
}

export const EventHero: React.FC<EventComponentProps> = ({ eventId, eventType, config }) => {
  const { eventData, isLoading } = useEventContent(eventId);
  const plugin = useEventPlugin(eventType); // wedding, seminar, etc.
  
  return plugin.renderHero(eventData, config);
};
```

**ACTION ITEMS:**
- [ ] Create generic `EventHero` component
- [ ] Create generic `EventDetails` component
- [ ] Create generic `ParticipantsSection` component
- [ ] Create plugin interface for component rendering
- [ ] Migrate all 15+ components

#### **2.2 Hook Transformation**

**Current Wedding Hooks:**
```typescript
❌ useWeddingContent()       → ✅ useEventContent(eventId)
❌ useWeddingHero()          → ✅ useEventHero(eventId)
❌ useThemeManager()         → ✅ useEventThemes(eventType)
```

**Generic Hook Pattern:**
```typescript
// New pattern: Event-agnostic with type support
export const useEventContent = (eventId: string) => {
  const [eventData, setEventData] = useState<EventData | null>(null);
  
  const fetchEventData = async () => {
    const { data } = await supabase
      .from('events')                    // ✅ Generic table
      .select('*, event_sections(*)')    // ✅ Generic relations
      .eq('id', eventId)
      .single();
    
    setEventData(data);
  };
  
  return { eventData, updateEventData, isLoading, error };
};
```

**ACTION ITEMS:**
- [ ] Create generic `useEventContent` hook
- [ ] Create generic `useEventParticipants` hook
- [ ] Create generic `useEventSettings` hook
- [ ] Create plugin hook system
- [ ] Update all 10+ hook files

---

### **PHASE 3: PLUGIN ARCHITECTURE** (Week 3-4)

#### **3.1 Plugin System Foundation**

**Plugin Interface:**
```typescript
interface EventPlugin {
  type: string;                    // 'wedding', 'seminar', 'conference'
  name: string;
  version: string;
  
  // Component renderers
  renderHero(data: EventData, config: any): React.ReactNode;
  renderParticipants(data: EventData, config: any): React.ReactNode;
  renderDetails(data: EventData, config: any): React.ReactNode;
  
  // Data schema
  getDefaultSettings(): any;
  getFormFields(): FormField[];
  validateEventData(data: any): ValidationResult;
  
  // Lifecycle hooks
  onEventCreate(data: EventData): Promise<void>;
  onEventUpdate(data: EventData): Promise<void>;
}
```

**Wedding Plugin Implementation:**
```typescript
export const WeddingPlugin: EventPlugin = {
  type: 'wedding',
  name: 'Wedding Event Plugin',
  version: '1.0.0',
  
  renderHero: (data, config) => <WeddingHeroComponent {...data} {...config} />,
  renderParticipants: (data, config) => <CoupleComponent {...data} {...config} />,
  
  getDefaultSettings: () => ({
    enableCountdown: true,
    showLoveStory: true,
    enableRSVP: true,
    ceremonyAndReception: true
  }),
  
  getFormFields: () => [
    { id: 'bride_name', label: 'Nama Pengantin Wanita', type: 'text', required: true },
    { id: 'groom_name', label: 'Nama Pengantin Pria', type: 'text', required: true },
    { id: 'wedding_date', label: 'Tanggal Pernikahan', type: 'date', required: true },
    // ... more fields
  ]
};
```

**ACTION ITEMS:**
- [ ] Create plugin interface
- [ ] Create plugin registry system
- [ ] Create plugin loader
- [ ] Implement wedding plugin
- [ ] Create plugin development guide

#### **3.2 Dynamic Form System**

**Generic Form Builder:**
```typescript
interface FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'textarea' | 'image';
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[]; // for select fields
}

const DynamicForm: React.FC<{ plugin: EventPlugin }> = ({ plugin }) => {
  const fields = plugin.getFormFields();
  
  return (
    <form>
      {fields.map(field => (
        <DynamicField key={field.id} field={field} />
      ))}
    </form>
  );
};
```

**ACTION ITEMS:**
- [ ] Create dynamic form builder
- [ ] Create field validation system
- [ ] Create form rendering components
- [ ] Integrate with plugin system
- [ ] Test with wedding plugin

---

### **PHASE 4: MIGRATION & TESTING** (Week 4-5)

#### **4.1 Data Migration Execution**

**Migration Strategy:**
1. **Create New Schema** - Deploy generic event tables
2. **Migrate Data** - Transfer wedding data to generic format
3. **Test Compatibility** - Ensure all functionality works
4. **Switch Over** - Update frontend to use new system
5. **Remove Old** - Clean up old wedding-specific code

**Migration Script Example:**
```sql
-- Migrate wedding data to generic events
INSERT INTO events (id, tenant_id, event_type, title, description, start_date, end_date, settings)
SELECT 
  gen_random_uuid(),
  tenant_id,
  'wedding' as event_type,
  CONCAT(groom_name, ' & ', bride_name) as title,
  hero_description,
  wedding_date as start_date,
  wedding_date as end_date,
  jsonb_build_object(
    'groom_name', groom_name,
    'bride_name', bride_name,
    'countdown_enabled', countdown_enabled
  ) as settings
FROM wedding_hero_settings;
```

**ACTION ITEMS:**
- [ ] Create comprehensive migration scripts
- [ ] Test migrations in staging environment
- [ ] Create rollback procedures
- [ ] Backup existing data
- [ ] Execute production migration

#### **4.2 End-to-End Testing**

**Testing Checklist:**
- [ ] All existing wedding functionality works
- [ ] New generic event creation works
- [ ] Plugin system loads correctly
- [ ] Database queries are optimized
- [ ] Frontend renders correctly
- [ ] Admin panel fully functional
- [ ] Performance benchmarks pass

---

### **PHASE 5: CLEANUP & DOCUMENTATION** (Week 5-6)

#### **5.1 Code Cleanup**

**Files to Remove/Rename:**
- [ ] Delete old wedding-specific components
- [ ] Remove unused wedding hooks
- [ ] Clean up wedding-specific imports
- [ ] Update all file names and references
- [ ] Remove duplicate database files

#### **5.2 Developer Documentation**

**Documentation to Create:**
- [ ] Plugin Development Guide
- [ ] Event Type Creation Tutorial
- [ ] Database Schema Documentation
- [ ] Component Architecture Guide
- [ ] Migration and Deployment Guide

#### **5.3 Future Plugin Roadmap**

**Planned Event Types:**
1. **Wedding Plugin** ✅ (Reference implementation)
2. **Seminar Plugin** 📅 (Next: Week 7-8)
3. **Conference Plugin** 📅 (Future: Week 9-10)
4. **Birthday Party Plugin** 📅 (Future)
5. **Corporate Event Plugin** 📅 (Future)

---

## ⚡ **CRITICAL SUCCESS FACTORS**

### **Technical Requirements:**
- Zero downtime migration
- Backward compatibility during transition
- Performance maintained or improved
- All existing features preserved

### **Quality Gates:**
- [ ] 100% test coverage maintained
- [ ] All existing wedding functionality works
- [ ] New generic functionality works
- [ ] Plugin system is extensible
- [ ] Database performance optimized

### **Developer Experience:**
- [ ] Clear folder structure
- [ ] Comprehensive documentation
- [ ] Easy plugin development
- [ ] Maintainable codebase

---

## 🚨 **RISKS & MITIGATION**

### **High Risk Items:**
1. **Data Loss During Migration**
   - *Mitigation:* Comprehensive backups, staged rollout
   
2. **Functionality Breaking**
   - *Mitigation:* Extensive testing, backward compatibility
   
3. **Performance Degradation**
   - *Mitigation:* Performance benchmarks, optimization

4. **Developer Confusion**
   - *Mitigation:* Clear documentation, training sessions

---

## 📈 **SUCCESS METRICS**

### **Technical Metrics:**
- 0 hardcoded wedding references in core system
- <2s page load time maintained
- 100% test coverage
- 0 breaking changes for existing users

### **Business Metrics:**
- Can create non-wedding events in <30 minutes
- Plugin development time <2 weeks
- Developer onboarding time <2 days

---

## 💼 **RESOURCE REQUIREMENTS**

### **Development Team:**
- 1 Senior Full-Stack Developer (Lead)
- 1 Database Specialist
- 1 Frontend Specialist
- 1 QA Engineer

### **Timeline:**
- **Week 1:** Database cleanup & schema transformation
- **Week 2-3:** Frontend component transformation
- **Week 3-4:** Plugin architecture implementation
- **Week 4-5:** Migration execution & testing
- **Week 5-6:** Cleanup, documentation, deployment

### **Dependencies:**
- Database migration window (maintenance time)
- Staging environment access
- Production deployment approval

---

## ✅ **DEFINITION OF DONE**

### **Phase 1 Complete When:**
- [ ] Single source of truth for database structure
- [ ] All wedding_* tables migrated to generic schema
- [ ] Backward compatibility verified

### **Phase 2 Complete When:**
- [ ] All Wedding* components renamed to Event*
- [ ] All useWedding* hooks renamed to useEvent*
- [ ] Plugin interface working

### **Phase 3 Complete When:**
- [ ] Wedding plugin fully functional
- [ ] Dynamic form system operational
- [ ] Can create new event types

### **TRANSFORMATION COMPLETE When:**
- [ ] 0 hardcoded wedding references in core
- [ ] Wedding functionality preserved as plugin
- [ ] Can create seminar events successfully
- [ ] Full documentation completed
- [ ] All tests passing

---

**NEXT IMMEDIATE ACTION:** Start Phase 1 - Database Structure Cleanup