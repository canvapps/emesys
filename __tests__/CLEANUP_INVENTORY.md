# 🧹 TEST FILES CLEANUP INVENTORY

**Date**: 2025-08-12  
**Author**: Kilo Code  
**Purpose**: Complete inventory of scattered test files untuk cleanup

## 📋 SCATTERED TEST FILES DISCOVERED

### 📂 ROOT DIRECTORY (/) - 15 files
```
test-basic.test.js
test-basic.test.ts  
test-cjs.test.cjs
test-db-connection.cjs
test-debug.test.js
test-enhanced-migration-simple.cjs
test-enhanced-migration-system.cjs
test-explicit.test.js
test-globals.test.js
test-js.test.js
test-realtime-crud.cjs
test-rls-isolation.cjs
test-roles-permissions.cjs
test-slow-query-detector.cjs
test-working.test.ts
```

### 📂 src/database/ - 15 files  
```
simple.test.ts
slow-query-detector.ts (utility, not test)
tenant-users-simple.test.ts
tenant-users.test.ts
tenants.simple.test.ts
tenants.test.ts
test-basic.test.ts
test-index-performance.cjs
test-tenant-users-manual.js
test-tenant-users-manual.mjs
test-tenants-manual-js.cjs
test-tenants-manual.ts
verify-database-realtime.ts
```

## 🎯 CLEANUP STRATEGY

### ✅ KEEP & MIGRATE (Valuable Tests)
- **test-realtime-crud.cjs** → Integration category
- **test-rls-isolation.cjs** → Security/database category  
- **test-roles-permissions.cjs** → Security category
- **tenant-users.test.ts** → Database validation category
- **tenants.test.ts** → Database validation category
- **test-index-performance.cjs** → Performance category (if not duplicate)

### 🗂️ ARCHIVE (Experimental/Duplicate)
- **test-basic.test.js/ts** (multiple versions - experimental)
- **test-debug.test.js** (debugging utility)
- **test-explicit.test.js** (experimental)  
- **test-globals.test.js** (experimental)
- **test-js.test.js** (experimental)
- **test-working.test.ts** (experimental)
- **test-cjs.test.cjs** (format testing)
- **simple.test.ts** (likely basic/experimental)
- Manual test files (test-*-manual.*)

### 🔧 UTILITIES TO PRESERVE  
- **slow-query-detector.ts** → move to utilities/
- **verify-database-realtime.ts** → move to utilities/

### ❌ DELETE (Obvious duplicates/outdated)
- Multiple versions of same basic tests
- Files that are clearly experimental iterations

## 📊 CLEANUP STATISTICS
- **Total files found**: 30+ scattered test files
- **Estimated keep**: 8-10 valuable tests  
- **Estimated archive**: 15-20 experimental
- **Estimated delete**: 5-10 obvious duplicates

## 🚀 EXECUTION PLAN
1. Create archive directory for experimental tests
2. Migrate valuable tests to proper __tests__ structure  
3. Move utilities to proper locations
4. Delete obvious duplicates
5. Update global test runner if needed
6. Update documentation