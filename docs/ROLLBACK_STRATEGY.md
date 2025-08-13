# 🔄 **Database Transformation Rollback Strategy**

## 📋 **Overview**

This document provides a comprehensive rollback strategy for the **Generic Event Management Database Transformation**. The rollback process safely reverts the generic event architecture back to the original wedding-specific implementation while preserving all data.

## 🚨 **When to Execute Rollback**

### Critical Situations:
- **Production Issues**: Generic tables causing application failures
- **Performance Problems**: New architecture impacts system performance
- **Data Integrity Issues**: Inconsistencies between generic and legacy data
- **Migration Failures**: Incomplete or corrupted transformation process
- **Business Requirements**: Need to revert to wedding-only functionality

### Non-Critical Situations:
- **Testing**: Validating rollback procedures
- **Temporary Revert**: Rolling back for specific maintenance windows
- **Version Control**: Reverting to specific stable state

---

## 🛠️ **Rollback Process**

### **Phase 1: Pre-Rollback Assessment** (5 minutes)

#### 1.1 System Health Check
```sql
-- Check current database state
SELECT 
    table_name,
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'event_%' OR table_name LIKE 'wedding_%')
ORDER BY table_name;
```

#### 1.2 Data Validation
```sql
-- Validate data consistency
SELECT 
    'event_participants' as table_name,
    COUNT(*) as record_count
FROM event_participants
UNION ALL
SELECT 
    'wedding_couple_info' as table_name,
    COUNT(*) as record_count
FROM wedding_couple_info
UNION ALL
SELECT 
    'event_stories' as table_name,
    COUNT(*) as record_count
FROM event_stories
UNION ALL
SELECT 
    'wedding_love_story' as table_name,
    COUNT(*) as record_count
FROM wedding_love_story;
```

#### 1.3 Backup Current State
```bash
# Create full database backup
pg_dump -h your-host -U your-user -d your-database > backup_pre_rollback_$(date +%Y%m%d_%H%M%S).sql

# Create schema-only backup
pg_dump -h your-host -U your-user -d your-database --schema-only > schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Phase 2: Application Shutdown** (2 minutes)

#### 2.1 Stop Application Services
```bash
# Stop Next.js development server
# Ctrl+C or kill process

# Stop production services (example)
# systemctl stop your-app-service
# pm2 stop all
```

#### 2.2 Enable Maintenance Mode
```javascript
// Update environment variable or feature flag
MAINTENANCE_MODE=true
```

### **Phase 3: Execute Rollback Script** (3-5 minutes)

#### 3.1 Run Primary Rollback
```sql
-- Execute the main rollback script
\i database/migrations/rollback_generic_transformation.sql
```

#### 3.2 Verify Rollback Completion
```sql
-- Check rollback completion
SELECT * FROM rollback_log ORDER BY rollback_date DESC LIMIT 1;

-- Verify backup schema exists
SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'rollback_backup_20250113';
```

### **Phase 4: Code Reversion** (10-15 minutes)

#### 4.1 Revert Hook Changes
```bash
# Checkout previous version of useEventContent.ts
git checkout HEAD~1 -- src/hooks/useEventContent.ts

# Or manually revert to wedding-specific queries
# Update queries from 'event_participants' to 'wedding_couple_info'
# Update queries from 'event_stories' to 'wedding_love_story'
# Update queries from 'event_content' to 'wedding_important_info'
```

#### 4.2 Revert Component Changes
```bash
# Revert generic components back to wedding-specific
git checkout HEAD~1 -- src/components/
git checkout HEAD~1 -- src/hooks/

# Or manually update:
# - Remove generic event type props
# - Restore wedding-specific data structures
# - Update plugin references to wedding-only
```

#### 4.3 Update Configuration
```javascript
// Update plugin configuration
export const activeEventType = 'wedding'; // Remove 'generic'
export const enableGenericMode = false;   // Disable generic mode
export const compatibilityMode = false;   // Disable compatibility layer
```

### **Phase 5: Testing and Validation** (5-10 minutes)

#### 5.1 Database Testing
```sql
-- Test basic wedding queries
SELECT * FROM wedding_couple_info LIMIT 1;
SELECT * FROM wedding_love_story LIMIT 1;
SELECT * FROM wedding_important_info LIMIT 1;

-- Verify data integrity
SELECT COUNT(*) as total_couples FROM wedding_couple_info;
SELECT COUNT(*) as total_stories FROM wedding_love_story WHERE is_visible = true;
```

#### 5.2 Application Testing
```bash
# Start development server
npm run dev

# Test key functionality:
# 1. Wedding couple display
# 2. Love story timeline
# 3. Important information
# 4. Contact information
# 5. Hero section
```

#### 5.3 Frontend Validation
- [ ] **Hero Section**: Displays couple names and wedding date
- [ ] **Couple Info**: Shows bride and groom information
- [ ] **Love Story**: Timeline displays correctly
- [ ] **Important Info**: Dress code and requirements visible
- [ ] **Contact**: Help contact information working
- [ ] **No Errors**: Console shows no generic table errors

### **Phase 6: Cleanup and Finalization** (2-3 minutes)

#### 6.1 Remove Backup Schema (Optional)
```sql
-- Only after confirming everything works perfectly
-- DROP SCHEMA rollback_backup_20250113 CASCADE;
```

#### 6.2 Update Documentation
```bash
# Update deployment notes
echo "$(date): Successfully rolled back generic transformation" >> deployment_log.txt

# Commit rollback changes
git add .
git commit -m "Rollback: Revert generic event transformation to wedding-specific"
```

#### 6.3 Re-enable Application
```bash
# Disable maintenance mode
MAINTENANCE_MODE=false

# Restart services if needed
# systemctl start your-app-service
```

---

## 📊 **Rollback Validation Checklist**

### **Database Validation** ✅
- [ ] All wedding tables exist and contain data
- [ ] Generic tables have been removed
- [ ] Backup schema contains preserved data
- [ ] RLS policies are properly configured
- [ ] No orphaned foreign key constraints

### **Application Validation** ✅  
- [ ] useEventContent hook uses wedding tables
- [ ] No references to generic table names in code
- [ ] Wedding components display data correctly
- [ ] No TypeScript errors related to generic types
- [ ] Plugin system reverted to wedding-only mode

### **Functionality Validation** ✅
- [ ] Couple information displays correctly
- [ ] Love story timeline works
- [ ] Important information sections visible
- [ ] Contact information functional
- [ ] Hero section displays properly
- [ ] No 404 or database connection errors

---

## ⚠️ **Common Rollback Issues**

### **Issue 1: Missing Wedding Data**
**Symptoms**: Empty wedding tables after rollback
**Solution**: 
```sql
-- Check if data is in backup schema
SELECT COUNT(*) FROM rollback_backup_20250113.event_participants_backup;

-- Migrate data back if needed
INSERT INTO wedding_couple_info (/* columns */) 
SELECT /* mapped columns */ FROM rollback_backup_20250113.event_participants_backup;
```

### **Issue 2: TypeScript Errors**
**Symptoms**: Generic types still referenced in code
**Solution**:
```bash
# Search and replace generic types
find src/ -name "*.ts" -exec sed -i 's/event_participants/wedding_couple_info/g' {} +
find src/ -name "*.ts" -exec sed -i 's/event_stories/wedding_love_story/g' {} +
```

### **Issue 3: Plugin Configuration Errors**
**Symptoms**: Application trying to load generic plugins
**Solution**:
```javascript
// Force wedding-only mode
export const forceWeddingMode = true;
export const disableGenericPlugins = true;
```

### **Issue 4: View Dependencies**
**Symptoms**: Cannot drop tables due to view dependencies
**Solution**:
```sql
-- Drop all views first
SELECT 'DROP VIEW IF EXISTS ' || table_name || ' CASCADE;'
FROM information_schema.views 
WHERE table_schema = 'public';
-- Execute the generated DROP statements
```

---

## 🔄 **Emergency Rollback (< 5 minutes)**

For critical production issues requiring immediate rollback:

```bash
#!/bin/bash
# emergency_rollback.sh

echo "🚨 EXECUTING EMERGENCY ROLLBACK"

# 1. Quick backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Execute rollback
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/rollback_generic_transformation.sql

# 3. Revert code to last known good state
git checkout HEAD~5 -- src/hooks/useEventContent.ts
git checkout HEAD~5 -- src/components/

# 4. Restart application
npm run build
npm start

echo "✅ EMERGENCY ROLLBACK COMPLETED"
```

---

## 📞 **Support and Recovery**

### **If Rollback Fails:**
1. **Stop all operations immediately**
2. **Restore from most recent backup**
3. **Contact development team**
4. **Document failure details**

### **Contact Information:**
- **Development Team**: [Your contact info]
- **Database Admin**: [Your contact info] 
- **Emergency On-call**: [Your contact info]

### **Recovery Resources:**
- **Backup Location**: `database/backups/`
- **Rollback Logs**: `rollback_log` table
- **Monitoring**: Check application logs and database performance
- **Documentation**: This document and `DATABASE_SCHEMA_GENERIC.md`

---

## 📋 **Rollback Validation System**

### **Pre-Rollback Validation**
The system includes comprehensive validation with [`rollback-validation.ts`](../src/database/rollback-validation.ts):

```typescript
import { createRollbackValidationManager } from '../src/database/rollback-validation';

const validator = createRollbackValidationManager(supabase, dbConnection);
const validation = await validator.validatePreRollback();

if (!validation.isValid) {
  console.error('Rollback validation failed:', validation.errors);
}
```

### **Automated Rollback Steps**
Systematic 6-step rollback process:

1. **Backup Creation** (5 min) - Backup all generic tables
2. **Data Consistency Check** (2 min) - Validate data integrity
3. **Data Migration** (10 min) - Move data back to legacy tables
4. **Generic Table Cleanup** (1 min) - Drop generic tables safely
5. **Legacy Validation** (3 min) - Test legacy functionality
6. **App Configuration** (30 min) - Update hooks and components

### **Risk Assessment**
- **Low Risk**: All checks pass, data consistent
- **Medium Risk**: Minor inconsistencies, some warnings
- **High Risk**: Integrity failures, missing tables, data loss potential

### **Monitoring & Logging**
- Real-time progress updates during rollback
- Comprehensive error logging and recovery
- Post-rollback verification procedures

---

**Generated**: 2025-08-13T09:34:15Z
**Version**: 1.1.0
**Phase**: 2.2 Database Transformation Rollback Strategy (Updated)