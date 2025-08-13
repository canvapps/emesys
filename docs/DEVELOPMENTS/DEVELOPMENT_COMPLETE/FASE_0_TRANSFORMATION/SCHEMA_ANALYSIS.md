# FASE 0: Database Schema Analysis untuk Platform Transformation

## Overview
Analisis komprehensif terhadap current database schema untuk transformasi dari **Wedding Invitation System** ke **Generic Event Management Engine**.

## Current Schema Status (✅ Analyzed)

### **1. Core Multi-Tenant Architecture** ✅ RETAINED
- **Table**: [`tenants`](src/database/migrations/001_create_tenants_table.sql:9)
- **Status**: Strong foundation, perlu minor updates
- **Strengths**: 
  - Multi-tenant isolation sudah sempurna
  - Subscription plans architecture
  - Settings JSONB untuk flexibility
- **Required Changes**: 
  - Update [`tenant.type`](src/database/migrations/001_create_tenants_table.sql:12) values dari wedding-specific ke generic
  - Transform comments dan descriptions

### **2. User Management System** ✅ RETAINED  
- **Table**: [`tenant_users`](src/database/migrations/002_create_tenant_users_table.sql:9)
- **Status**: Excellent foundation, minimal changes needed
- **Strengths**:
  - Proper tenant isolation dengan FK constraints
  - Comprehensive user lifecycle management
  - JSONB profile_data untuk extensibility
- **Required Changes**:
  - Update role constraints untuk generic event roles
  - Modify business logic functions untuk generic context

### **3. RBAC System** ✅ RETAINED + EXPANDED
- **Tables**: [`permissions`](src/database/migrations/003_create_roles_permissions_tables.sql:9), [`user_roles`](src/database/migrations/003_create_roles_permissions_tables.sql:32), [`role_permissions`](src/database/migrations/003_create_roles_permissions_tables.sql:61)
- **Status**: Robust foundation, perlu permission expansion
- **Strengths**:
  - Granular permission system
  - Hierarchical role management
  - Tenant-scoped roles
- **Required Changes**:
  - Add generic event permissions
  - Create plugin-based permission architecture
  - Transform wedding-specific permissions

### **4. Row Level Security** ✅ RETAINED
- **File**: [`004_create_rls_policies.sql`](src/database/migrations/004_create_rls_policies.sql)
- **Status**: Perfect untuk multi-tenant events, no changes needed
- **Strengths**:
  - Enterprise-grade tenant isolation
  - Security functions already generic
  - Performance-optimized policies

### **5. Performance Optimization** ✅ RETAINED
- **File**: [`005_create_database_indexes.sql`](src/database/migrations/005_create_database_indexes.sql)
- **Status**: Excellent foundation, akan extended untuk event tables
- **Strengths**:
  - Comprehensive indexing strategy
  - Multi-tenant aware indexes
  - Performance monitoring functions

---

## Wedding-Specific Elements Requiring Transformation

### **🔄 TRANSFORM: Tenant Types**
**Current** ([`tenants.type`](src/database/migrations/001_create_tenants_table.sql:12)):
```sql
CHECK (type IN ('super_admin', 'wedding_agency', 'couple'))
```

**New Generic**:
```sql
CHECK (type IN ('super_admin', 'event_agency', 'event_organizer', 'individual'))
```

### **🔄 TRANSFORM: Permission System**
**Current Wedding-Focused** ([`permissions`](src/database/migrations/003_create_roles_permissions_tables.sql:301)):
- `templates_create` → "Create new wedding invitation templates"
- `invitations_create` → "Create wedding invitations"

**New Generic Event-Focused**:
- `event_templates_create` → "Create new event templates"
- `events_create` → "Create events" 
- `participants_manage` → "Manage event participants"

### **🔄 TRANSFORM: Business Logic Functions**
Functions yang perlu di-update untuk generic context:
- [`validate_tenant_hierarchy()`](src/database/migrations/001_create_tenants_table.sql:45)
- [`user_can_access_feature()`](src/database/migrations/002_create_tenant_users_table.sql:108)
- Feature access rules perlu di-generickan

---

## Required New Tables untuk Event Management Engine

### **🆕 NEW: Core Event Architecture**

#### **1. `event_types` Table** (Plugin Architecture Foundation)
```sql
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- 'wedding', 'conference', 'seminar'
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    plugin_config JSONB DEFAULT '{}',
    form_schema JSONB DEFAULT '{}', -- Dynamic form configuration
    default_permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    is_system_type BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **2. `events` Table** (Core Event Entity)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type_id UUID NOT NULL REFERENCES event_types(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    location JSONB DEFAULT '{}', -- Flexible location data
    settings JSONB DEFAULT '{}', -- Event-specific settings
    form_data JSONB DEFAULT '{}', -- Dynamic form data
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_by UUID NOT NULL REFERENCES tenant_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **3. `event_participants` Table** (Generic Participant Management)
```sql
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_type VARCHAR(100) NOT NULL, -- 'guest', 'speaker', 'organizer', etc.
    contact_info JSONB NOT NULL, -- name, email, phone, etc.
    custom_fields JSONB DEFAULT '{}', -- Event-type specific fields
    status VARCHAR(50) DEFAULT 'invited',
    rsvp_status VARCHAR(50),
    rsvp_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### **4. `event_templates` Table** (Generic Template System)
```sql
CREATE TABLE event_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type_id UUID NOT NULL REFERENCES event_types(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL, -- Template content
    is_public BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES tenant_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **🆕 NEW: Plugin Architecture Tables**

#### **5. `plugin_configurations` Table**
```sql
CREATE TABLE plugin_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    plugin_name VARCHAR(100) NOT NULL,
    configuration JSONB DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## Transformation Strategy

### **Phase 1: Schema Evolution** (Backward Compatible)
1. **Add new generic tables** (events, event_types, participants)
2. **Extend existing tables** dengan generic columns
3. **Create migration functions** untuk data transformation
4. **Add generic permissions** dan roles

### **Phase 2: Data Migration** (Seamless Transition)  
1. **Create wedding event_type** sebagai default
2. **Migrate existing wedding data** ke generic event structure
3. **Update tenant types** dan permissions
4. **Validate data integrity**

### **Phase 3: Code Transformation** (Application Layer)
1. **Update application code** untuk generic event handling
2. **Create plugin system** architecture
3. **Implement dynamic form builder**
4. **Add event-type specific business logic**

### **Phase 4: Documentation & Testing** (Quality Assurance)
1. **Update all documentation** untuk generic platform
2. **Create plugin development guides**
3. **Comprehensive testing** dengan existing test suites
4. **Performance optimization** untuk generic queries

---

## Success Criteria

### **✅ Technical Requirements**
- [x] Multi-tenant architecture preserved
- [ ] Generic event model implemented
- [ ] Plugin architecture functional
- [ ] Backward compatibility maintained
- [ ] Performance targets met (<50ms queries)
- [ ] 100% test coverage maintained

### **✅ Business Requirements**
- [ ] Wedding functionality preserved as plugin
- [ ] New event types supportable
- [ ] Dynamic form system operational
- [ ] Enterprise scalability maintained
- [ ] Migration completed without downtime

---

## Next Steps
1. **Design generic event model architecture** dengan detailed schema
2. **Create database migration strategy** dengan rollback plans
3. **Design plugin architecture framework** dengan wedding sebagai reference
4. **Implement JSON-based configuration system** untuk dynamic forms
5. **Create transformation migration scripts** dengan comprehensive testing

---

**Status**: ✅ Schema Analysis Complete  
**Next**: Generic Event Model Architecture Design  
**Timeline**: 1-2 weeks untuk complete transformation  
**Risk Level**: Low (strong foundation, incremental approach)