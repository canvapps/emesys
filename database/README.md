# Database Structure - Event Management Engine

**Single Source of Truth untuk Database Operations**

## 📁 Database Structure

```
database/
├── schema.sql              # Master database schema
├── migrations/             # All database migrations (SINGLE LOCATION)
│   ├── 001_create_tenants_table.sql
│   ├── 002_create_tenant_users_table.sql
│   ├── 003_create_roles_permissions_tables.sql
│   ├── 004_create_rls_policies.sql
│   ├── 005_create_database_indexes.sql
│   ├── create-compatibility-views.cjs
│   ├── execute-transformation-migration.cjs
│   ├── fix-performance-indexes.cjs
│   └── FASE_0_TRANSFORMATION/
└── seeders/                # Database seed data
    ├── 001_initial_super_admin.sql
    └── 002_demo_tenant_data.sql
```

## 🎯 Purpose

This folder contains **ALL database-related files** that define the database structure, migrations, and seed data. This is the **SINGLE SOURCE OF TRUTH** for database schema management.

## 📋 Migration Guidelines

### **Running Migrations**

```bash
# Run all migrations
node src/database/migrate.ts

# Or use the enhanced migration runner
node src/database/enhanced-migrate.ts
```

### **Creating New Migrations**

1. **File Naming Convention:**
   ```
   XXX_descriptive_name.sql
   ```
   - Use 3-digit sequential numbers (006, 007, etc.)
   - Use descriptive names that explain the change
   - Use snake_case naming

2. **Migration Structure:**
   ```sql
   -- Migration: 006_add_event_plugins_table.sql
   -- Purpose: Add plugin system support for events
   -- Date: 2025-01-13
   
   CREATE TABLE event_plugins (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       name VARCHAR(255) NOT NULL,
       version VARCHAR(50) NOT NULL,
       config JSONB DEFAULT '{}',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   
   -- Create indexes
   CREATE INDEX idx_event_plugins_name ON event_plugins(name);
   
   -- Add constraints if needed
   ALTER TABLE event_plugins ADD CONSTRAINT unique_plugin_name_version UNIQUE(name, version);
   ```

3. **Add to Migration Runner:**
   Update [`src/database/migrate.ts`](../src/database/migrate.ts) to include new migration:
   ```typescript
   const migrations = [
       '001_create_tenants_table.sql',
       '002_create_tenant_users_table.sql',
       // ... existing migrations
       '006_add_event_plugins_table.sql'  // Add new migration here
   ];
   ```

### **Migration Best Practices**

- ✅ **Always backup database** before running migrations
- ✅ **Test migrations** in development environment first
- ✅ **Make migrations reversible** when possible
- ✅ **Use transactions** for complex migrations
- ✅ **Document purpose** at the top of each migration
- ❌ **Never modify existing migration files** after they've been applied
- ❌ **Never delete migration files** from this directory

## 🌱 Seeders

Seeders populate the database with initial or test data:

- **`001_initial_super_admin.sql`** - Creates initial super admin user
- **`002_demo_tenant_data.sql`** - Demo tenant data for development

### **Running Seeders**

```sql
-- Connect to your database and run:
\i database/seeders/001_initial_super_admin.sql
\i database/seeders/002_demo_tenant_data.sql
```

## 🔧 Developer Guide

### **For New Developers:**

1. **Database Setup:**
   ```bash
   # 1. Create PostgreSQL database
   createdb weddinvite_enterprise
   
   # 2. Run all migrations
   node src/database/migrate.ts
   
   # 3. Run seeders (optional)
   psql -d weddinvite_enterprise -f database/seeders/001_initial_super_admin.sql
   ```

2. **Understanding the Structure:**
   - **`database/`** folder contains all schema definitions, migrations, and seeds
   - **`src/database/`** folder contains connection utilities, models, and repositories
   - **NEVER put migrations in `src/database/migrations/`** - they belong in `database/migrations/`

### **For Code Changes:**

1. **Schema Changes:** Always create a new migration file in `database/migrations/`
2. **Data Changes:** Create seeder files in `database/seeders/`
3. **Connection Logic:** Modify files in `src/database/`

## 📊 Database Schema Overview

The Event Management Engine uses a multi-tenant architecture with the following core tables:

- **`tenants`** - Tenant organizations (wedding agencies, event planners)
- **`tenant_users`** - Users within each tenant with role-based access
- **`roles`** - Role definitions (admin, manager, member, etc.)
- **`permissions`** - Granular permissions system
- **Row-Level Security (RLS)** - Automatic tenant isolation

## 🚀 Performance Considerations

- **Indexes:** Properly indexed for multi-tenant queries
- **RLS Policies:** Automatic tenant isolation for security
- **Connection Pooling:** Use connection pooling for production
- **Query Optimization:** Monitor slow queries using built-in detection

## 🔐 Security

- **Row-Level Security (RLS)** enabled on all tenant-scoped tables
- **Password hashing** using bcrypt
- **JWT token-based authentication**
- **Role-based permissions** system

## 📝 Troubleshooting

### **Common Issues:**

1. **Migration Fails:**
   ```bash
   # Check database connection
   node src/database/connection.ts
   
   # Verify migration syntax
   psql -d weddinvite_enterprise -f database/migrations/XXX_migration_name.sql
   ```

2. **Permission Denied:**
   ```sql
   -- Check RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
   
   -- Temporary disable RLS for debugging (DANGEROUS!)
   ALTER TABLE your_table_name DISABLE ROW LEVEL SECURITY;
   ```

3. **Performance Issues:**
   ```bash
   # Run database performance monitor
   node src/database/index-monitor.ts
   
   # Check slow query logs
   node src/database/slow-query-detector.ts
   ```

---

## 🏗️ Architecture Transformation Note

This database structure is part of the **Event Management Engine** transformation. The system is designed to be:
- **Generic** - Support multiple event types (weddings, seminars, conferences)
- **Plugin-based** - Extensible event type system
- **Multi-tenant** - Multiple agencies/organizers on single instance
- **Scalable** - Performance optimized for growth

For more details, see [`REAL_TRANSFORMATION_ROADMAP.md`](../REAL_TRANSFORMATION_ROADMAP.md).