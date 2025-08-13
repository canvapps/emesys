# Source Database - Connection & Application Layer

**Application-level database utilities dan business logic**

## 📁 Source Database Structure

```
src/database/
├── README.md               # This file - separation of concerns guide
├── connection.ts           # Database connection utilities
├── migrate.ts             # Migration runner (points to database/migrations/)
├── enhanced-migrate.ts    # Enhanced migration with rollback support
├── index.ts               # Clean exports for application use
├── models/                # Data models and TypeScript interfaces
│   ├── Tenant.ts          # Tenant model interface
│   ├── TenantUser.ts      # TenantUser model interface
│   ├── Event.ts           # Generic Event model (transformation target)
│   └── index.ts           # Model exports
└── repositories/          # Data access layer - business logic
    ├── TenantsRepository.ts    # Tenant CRUD operations
    ├── TenantUsersRepository.ts # TenantUser CRUD operations
    ├── EventRepository.ts      # Generic Event CRUD (transformation target)
    └── index.ts               # Repository exports
```

## 🎯 Purpose & Separation of Concerns

### **`database/` vs `src/database/` - Clear Separation**

| Folder | Purpose | Contains | Used By |
|--------|---------|----------|---------|
| **`database/`** | **Schema Definition** | Migrations, seeders, schema files | Database administrators, DevOps |
| **`src/database/`** | **Application Layer** | Connections, models, repositories | Application developers |

### **Key Principles:**

1. **`database/`** = **"What the database looks like"**
   - Pure SQL files
   - Migration scripts
   - Database structure
   - Infrastructure concerns

2. **`src/database/`** = **"How the application uses the database"**
   - TypeScript connection utilities
   - Business logic and repositories
   - Data models and interfaces
   - Application concerns

## 🔗 Connection Utilities

### **DatabaseConnection Class**

```typescript
import { DatabaseConnection } from '@/database/connection';

// Create connection instance
const db = new DatabaseConnection({
  host: 'localhost',
  database: 'weddinvite_enterprise',
  user: 'postgres',
  password: 'your_password'
});

// Connect and query
await db.connect();
const result = await db.query('SELECT * FROM tenants WHERE status = $1', ['active']);
await db.close();
```

### **Connection Features:**

- ✅ **Connection Pooling** - Production-ready connection management
- ✅ **Error Handling** - Comprehensive error catching and logging
- ✅ **Configuration** - Environment-based configuration support
- ✅ **SSL Support** - Secure connections for production
- ✅ **Query Logging** - Debug query performance

## 📊 Models & Interfaces

Data models provide TypeScript interfaces for database entities:

```typescript
// Example: Tenant model
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: 'wedding_agency' | 'event_organizer' | 'freelancer';
  status: 'active' | 'inactive' | 'suspended';
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  profile_data: {
    logo_url?: string;
    website?: string;
    phone?: string;
    email?: string;
  };
  created_at: Date;
  updated_at: Date;
}
```

### **Model Guidelines:**

- Use **TypeScript interfaces** for type safety
- Match **database column names** exactly
- Include **JSDoc comments** for documentation
- Support **optional fields** with `?` operator
- Use **union types** for enums

## 🏪 Repositories Pattern

Repositories encapsulate database access logic and provide clean APIs:

```typescript
import { TenantsRepository } from '@/database/repositories';

// Usage example
const repo = new TenantsRepository(dbConnection);

// CRUD operations
const tenant = await repo.create({
  name: 'Wedding Dreams Agency',
  type: 'wedding_agency',
  status: 'active',
  subscription_plan: 'premium'
});

const tenants = await repo.findByStatus('active');
await repo.updateById(tenant.id, { status: 'inactive' });
await repo.deleteById(tenant.id);
```

### **Repository Benefits:**

- ✅ **Business Logic Separation** - Keep SQL away from application logic
- ✅ **Reusability** - Share data access patterns across the app
- ✅ **Testing** - Easy to mock for unit tests
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Validation** - Input validation before database operations

## 🚀 Migration Runner

The migration runner bridges application and database layers:

```typescript
// Located in src/database/migrate.ts but points to database/migrations/
const migrationPath = join(process.cwd(), 'database/migrations', migrationFile);
```

### **Migration Features:**

- ✅ **Single Source** - Points to `database/migrations/` folder
- ✅ **Sequential Execution** - Runs migrations in order
- ✅ **Error Handling** - Comprehensive error reporting
- ✅ **Transaction Support** - Each migration in transaction
- ✅ **CLI Interface** - Run from command line

## 🏗️ Architecture Transformation Integration

This layer is being transformed as part of the **Event Management Engine** architecture:

### **Current State (Wedding-Specific):**
```typescript
// OLD: Wedding-specific repositories
TenantsRepository      // ✅ Generic (already good)
TenantUsersRepository  // ✅ Generic (already good)
WeddingEventsRepository // ❌ Wedding-specific (needs transformation)
```

### **Target State (Generic Event Platform):**
```typescript
// NEW: Generic event repositories
TenantsRepository       // ✅ Maintained
TenantUsersRepository   // ✅ Maintained
EventsRepository        // 🎯 Generic events (transformation target)
EventPluginsRepository  // 🎯 Plugin system support
```

## 📝 Development Guidelines

### **Adding New Models:**

1. Create interface in `models/` folder
2. Export from `models/index.ts`
3. Create corresponding repository in `repositories/`
4. Export from `repositories/index.ts`
5. Update `src/database/index.ts` for clean imports

### **Adding New Repositories:**

```typescript
// 1. Create repository class
export class EventsRepository {
  constructor(private db: DatabaseConnection) {}
  
  async create(eventData: CreateEventData): Promise<Event> {
    // Implementation
  }
  
  async findById(id: string, tenantId: string): Promise<Event | null> {
    // Implementation
  }
}

// 2. Add to repositories/index.ts
export { EventsRepository } from './EventsRepository';

// 3. Add to src/database/index.ts
export { EventsRepository } from './repositories';
```

### **Connection Best Practices:**

- ✅ Use **connection pooling** in production
- ✅ Always **close connections** in finally blocks
- ✅ Handle **connection errors** gracefully
- ✅ Use **environment variables** for configuration
- ❌ Never **hardcode credentials** in source code
- ❌ Don't **leave connections open** without cleanup

## 🔧 Testing Integration

This layer integrates with the test infrastructure:

```typescript
// Test database utilities are available
import { executeQuery, getConnection, closeAllConnections } from '@/__tests__/utilities/db-connection.util.cjs';

// Tests use the same connection patterns
const connection = new DatabaseConnection({
  database: 'weddinvite_enterprise_test'
});
```

## 📊 Performance Monitoring

Built-in performance monitoring utilities:

- **`index-monitor.ts`** - Database index performance monitoring
- **`slow-query-detector.ts`** - Slow query detection and logging
- **Connection pooling metrics** - Connection usage statistics

---

## 🧭 Quick Reference

### **Import Patterns:**

```typescript
// Clean imports from src/database/index.ts
import { DatabaseConnection, TenantsRepository, TenantUsersRepository } from '@/database';

// Or import specific utilities
import { DatabaseConnection } from '@/database/connection';
import { TenantsRepository } from '@/database/repositories/TenantsRepository';
```

### **Common Operations:**

```typescript
// Initialize
const db = new DatabaseConnection();
await db.connect();

// Use repositories
const tenantsRepo = new TenantsRepository(db);
const tenant = await tenantsRepo.findBySlug('my-agency');

// Cleanup
await db.close();
```

For database schema and migrations, see [`database/README.md`](../../database/README.md).