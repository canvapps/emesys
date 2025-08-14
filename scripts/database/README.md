# Database Management Tools

Collection of database management and maintenance utilities for the Event Management Platform.

## Available Tools

### 🚀 Migration Tools

#### `run-migrations.cjs`
Basic database migration runner.
```bash
node scripts/database/run-migrations.cjs
```
- Executes SQL migration files from `src/database/migrations/`
- Creates migration tracking table
- Transactional execution with rollback support

#### `run-enhanced-migrations.cjs`
Advanced migration system with enhanced features.
```bash
# Run all pending migrations
node scripts/database/run-enhanced-migrations.cjs migrate

# Run seeders for development
node scripts/database/run-enhanced-migrations.cjs seed development

# Check migration status
node scripts/database/run-enhanced-migrations.cjs status

# Rollback specific migration
node scripts/database/run-enhanced-migrations.cjs rollback 001_create_table.sql

# Show help
node scripts/database/run-enhanced-migrations.cjs help
```

**Features:**
- Checksum validation to prevent modified migrations
- Rollback SQL support
- Dependency tracking
- Environment-specific seeders
- Execution time tracking
- Enhanced logging and reporting

#### `sync-existing-migrations.cjs`
Synchronizes existing migrations to enhanced migration system.
```bash
node scripts/database/sync-existing-migrations.cjs
```
- Populates enhanced migration table with existing migrations
- Calculates checksums for existing files
- One-time sync utility for migration system upgrade

### 🔧 Maintenance Tools

#### `run-index-maintenance.cjs`
Enterprise-grade database index maintenance and performance monitoring.

```bash
# Analyze index performance
node scripts/database/run-index-maintenance.cjs analyze

# Real-time monitoring (60s intervals)
node scripts/database/run-index-maintenance.cjs monitor --interval 60

# Run maintenance operations
node scripts/database/run-index-maintenance.cjs maintain --reindex --analyze --vacuum

# Generate performance report
node scripts/database/run-index-maintenance.cjs report --format json --save

# Show help
node scripts/database/run-index-maintenance.cjs help
```

**Features:**
- Index usage analysis and optimization recommendations
- Real-time performance monitoring
- REINDEX, ANALYZE, and VACUUM operations
- Comprehensive performance reporting
- Unused index detection
- Efficiency metrics and optimization suggestions

## Database Configuration

All tools read configuration from `.env.local`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=emesys_dev
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
```

## Usage Guidelines

### Migration Workflow
1. **Development**: Use `run-migrations.cjs` for simple migrations
2. **Production**: Use `run-enhanced-migrations.cjs` for enhanced tracking and rollback capabilities
3. **Maintenance**: Run `run-index-maintenance.cjs analyze` regularly to monitor performance

### Best Practices
- Always backup database before running migrations in production
- Use `run-enhanced-migrations.cjs status` to verify migration state
- Monitor index performance with regular analysis
- Use environment-specific seeders for different deployment stages

### Performance Monitoring
```bash
# Daily analysis
node scripts/database/run-index-maintenance.cjs analyze

# Weekly maintenance
node scripts/database/run-index-maintenance.cjs maintain --analyze --vacuum

# Monthly comprehensive report
node scripts/database/run-index-maintenance.cjs report --save
```

## Trinity Protocol Integration

These tools are integrated with the Trinity Protocol validation system:
- All operations are logged and tracked
- Error handling follows Trinity standards
- Performance metrics contribute to overall system health
- Documentation maintained according to Trinity guidelines

## Support

For issues or questions regarding database tools:
1. Check tool help: `node <tool> help`
2. Review Trinity Protocol documentation
3. Verify environment configuration
4. Check database connection and permissions