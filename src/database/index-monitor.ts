/**
 * 🎯 CHUNK 1A.7: Index Performance Monitoring System
 * ================================================
 * 
 * Enterprise-grade database index monitoring and analysis system
 * untuk multi-tenant wedding invitation application.
 * 
 * Features:
 * - Real-time index usage monitoring
 * - Performance metrics collection
 * - Slow query detection and analysis
 * - Index efficiency recommendations
 * - Automated maintenance suggestions
 * 
 * Created: 2025-01-12 21:26 WIB
 * Target: Maintain >95% index efficiency across all tenant operations
 */

import { DatabaseConnection } from './connection';
import { Client } from 'pg';

// Helper function untuk compatibility
async function connectToDatabase(): Promise<Client> {
  const db = new DatabaseConnection();
  const connected = await db.connect();
  if (!connected) {
    throw new Error('Failed to connect to database');
  }
  return db.getClient();
}

// Performance monitoring configuration
export interface IndexMonitorConfig {
  slowQueryThreshold: number;    // ms - queries above this are flagged
  indexUsageThreshold: number;   // % - indexes below this usage are flagged
  monitoringInterval: number;    // ms - how often to collect metrics
  retentionDays: number;        // days - how long to keep historical data
  alertThreshold: number;       // % - when to trigger performance alerts
}

export const DEFAULT_MONITOR_CONFIG: IndexMonitorConfig = {
  slowQueryThreshold: 100,      // 100ms
  indexUsageThreshold: 10,      // 10%
  monitoringInterval: 60000,    // 1 minute
  retentionDays: 30,           // 30 days
  alertThreshold: 80           // 80% efficiency threshold
};

// Index performance metrics interface
export interface IndexMetrics {
  indexName: string;
  tableName: string;
  indexSize: string;
  indexSizeBytes: number;
  indexScans: number;
  tupsRead: number;
  tupsReturned: number;
  indexScanRatio: number;
  efficiency: number;
  lastUsed: Date | null;
  recommendation: string;
}

// Slow query analysis interface
export interface SlowQueryMetrics {
  queryId: string;
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  maxTime: number;
  minTime: number;
  stdDevTime: number;
  affectedTables: string[];
  suggestedIndexes: string[];
}

// Performance monitoring class
export class IndexPerformanceMonitor {
  private client: Client | null = null;
  private config: IndexMonitorConfig;
  private monitoringActive: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: IndexMonitorConfig = DEFAULT_MONITOR_CONFIG) {
    this.config = config;
  }

  /**
   * Initialize monitoring system
   */
  async initialize(): Promise<void> {
    try {
      this.client = await connectToDatabase();
      await this.setupMonitoringTables();
      console.log('✅ Index Performance Monitor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Index Performance Monitor:', error);
      throw error;
    }
  }

  /**
   * Setup monitoring tables for historical data
   */
  private async setupMonitoringTables(): Promise<void> {
    if (!this.client) throw new Error('Database client not initialized');

    const createTablesSQL = `
      -- Index performance history table
      CREATE TABLE IF NOT EXISTS index_performance_history (
        id SERIAL PRIMARY KEY,
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        index_name TEXT NOT NULL,
        table_name TEXT NOT NULL,
        index_size_bytes BIGINT NOT NULL,
        index_scans BIGINT DEFAULT 0,
        tuples_read BIGINT DEFAULT 0,
        tuples_returned BIGINT DEFAULT 0,
        scan_ratio NUMERIC(5,2) DEFAULT 0,
        efficiency_score NUMERIC(5,2) DEFAULT 0
      );

      -- Slow queries history table
      CREATE TABLE IF NOT EXISTS slow_queries_history (
        id SERIAL PRIMARY KEY,
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        query_hash TEXT NOT NULL,
        query_text TEXT NOT NULL,
        execution_count BIGINT DEFAULT 1,
        total_time_ms NUMERIC(10,3) NOT NULL,
        mean_time_ms NUMERIC(10,3) NOT NULL,
        max_time_ms NUMERIC(10,3) NOT NULL,
        affected_tables TEXT[] DEFAULT '{}',
        suggested_indexes TEXT[] DEFAULT '{}'
      );

      -- Performance alerts table
      CREATE TABLE IF NOT EXISTS performance_alerts (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        details JSONB DEFAULT '{}',
        resolved_at TIMESTAMPTZ NULL,
        resolution_notes TEXT NULL
      );

      -- Create indexes on monitoring tables
      CREATE INDEX IF NOT EXISTS idx_index_perf_hist_recorded 
        ON index_performance_history (recorded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_slow_queries_hist_recorded 
        ON slow_queries_history (recorded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_performance_alerts_created 
        ON performance_alerts (created_at DESC, resolved_at);
    `;

    await this.client.query(createTablesSQL);
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('⚠️ Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    console.log('🔍 Starting index performance monitoring...');

    // Initial metrics collection
    await this.collectMetrics();

    // Setup recurring monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('❌ Error during monitoring cycle:', error);
      }
    }, this.config.monitoringInterval);

    console.log(`✅ Monitoring started (interval: ${this.config.monitoringInterval}ms)`);
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    this.monitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.client) {
      await this.client.end();
      this.client = null;
    }

    console.log('⏹️ Index performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<{
    indexMetrics: IndexMetrics[],
    slowQueries: SlowQueryMetrics[]
  }> {
    if (!this.client) throw new Error('Monitor not initialized');

    const indexMetrics = await this.getIndexMetrics();
    const slowQueries = await this.getSlowQueries();

    // Store metrics in history
    await this.storeIndexMetrics(indexMetrics);
    await this.storeSlowQueries(slowQueries);

    // Check for performance issues
    await this.checkPerformanceAlerts(indexMetrics, slowQueries);

    console.log(`📊 Collected metrics: ${indexMetrics.length} indexes, ${slowQueries.length} slow queries`);

    return { indexMetrics, slowQueries };
  }

  /**
   * Get comprehensive index performance metrics
   */
  async getIndexMetrics(): Promise<IndexMetrics[]> {
    if (!this.client) throw new Error('Monitor not initialized');

    const query = `
      SELECT 
        schemaname||'.'||indexname as index_name,
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
        pg_relation_size(schemaname||'.'||indexname) as index_size_bytes,
        COALESCE(idx_scan, 0) as index_scans,
        COALESCE(idx_tup_read, 0) as tuples_read,
        COALESCE(idx_tup_fetch, 0) as tuples_returned,
        CASE 
          WHEN (idx_scan + seq_scan) > 0 
          THEN ROUND(100.0 * idx_scan / (idx_scan + seq_scan), 2)
          ELSE 0 
        END as scan_ratio,
        CASE
          WHEN idx_scan = 0 THEN 0
          WHEN idx_tup_read = 0 THEN 100
          ELSE ROUND(100.0 * idx_tup_fetch / GREATEST(idx_tup_read, 1), 2)
        END as efficiency,
        last_idx_scan as last_used
      FROM pg_stat_user_indexes pui
      JOIN pg_statio_user_indexes psui ON pui.indexrelid = psui.indexrelid
      WHERE schemaname = 'public'
        AND (tablename LIKE 'tenant%' OR tablename LIKE 'user_%' OR tablename = 'tenants')
      ORDER BY index_scans DESC;
    `;

    const result = await this.client.query(query);
    
    return result.rows.map(row => ({
      indexName: row.index_name,
      tableName: row.table_name,
      indexSize: row.index_size,
      indexSizeBytes: parseInt(row.index_size_bytes),
      indexScans: parseInt(row.index_scans),
      tupsRead: parseInt(row.tuples_read),
      tupsReturned: parseInt(row.tuples_returned),
      indexScanRatio: parseFloat(row.scan_ratio),
      efficiency: parseFloat(row.efficiency),
      lastUsed: row.last_used ? new Date(row.last_used) : null,
      recommendation: this.generateIndexRecommendation(row)
    }));
  }

  /**
   * Get slow query analysis
   */
  async getSlowQueries(): Promise<SlowQueryMetrics[]> {
    if (!this.client) throw new Error('Monitor not initialized');

    try {
      // Check if pg_stat_statements is available
      const extensionCheck = await this.client.query(`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
        ) as has_extension;
      `);

      if (!extensionCheck.rows[0].has_extension) {
        console.log('⚠️ pg_stat_statements extension not available for slow query analysis');
        return [];
      }

      const query = `
        SELECT 
          md5(query) as query_id,
          query,
          calls,
          ROUND(total_exec_time::numeric, 3) as total_time,
          ROUND(mean_exec_time::numeric, 3) as mean_time,
          ROUND(max_exec_time::numeric, 3) as max_time,
          ROUND(min_exec_time::numeric, 3) as min_time,
          ROUND(stddev_exec_time::numeric, 3) as stddev_time
        FROM pg_stat_statements
        WHERE (query ILIKE '%tenant%' OR query ILIKE '%user%')
          AND mean_exec_time > $1
          AND calls > 1
        ORDER BY mean_exec_time DESC
        LIMIT 50;
      `;

      const result = await this.client.query(query, [this.config.slowQueryThreshold]);
      
      return result.rows.map(row => ({
        queryId: row.query_id,
        query: row.query.substring(0, 500), // Truncate for storage
        calls: parseInt(row.calls),
        totalTime: parseFloat(row.total_time),
        meanTime: parseFloat(row.mean_time),
        maxTime: parseFloat(row.max_time),
        minTime: parseFloat(row.min_time),
        stdDevTime: parseFloat(row.stddev_time),
        affectedTables: this.extractTablesFromQuery(row.query),
        suggestedIndexes: this.generateIndexSuggestions(row.query)
      }));
    } catch (error) {
      console.log('⚠️ Could not retrieve slow query data:', error.message);
      return [];
    }
  }

  /**
   * Generate index performance recommendations
   */
  private generateIndexRecommendation(indexData: any): string {
    const scans = parseInt(indexData.index_scans);
    const ratio = parseFloat(indexData.scan_ratio);
    const efficiency = parseFloat(indexData.efficiency);

    if (scans === 0) {
      return 'UNUSED - Consider dropping this index';
    }

    if (ratio < this.config.indexUsageThreshold) {
      return 'LOW_USAGE - Review necessity and consider dropping';
    }

    if (efficiency < 50) {
      return 'LOW_EFFICIENCY - Index may need optimization or redesign';
    }

    if (efficiency < 80) {
      return 'MODERATE_EFFICIENCY - Monitor and consider optimization';
    }

    return 'OPTIMAL - Index performing well';
  }

  /**
   * Extract table names from SQL query
   */
  private extractTablesFromQuery(query: string): string[] {
    const tablePattern = /(?:FROM|JOIN|UPDATE|INSERT\s+INTO)\s+([a-zA-Z_]\w*)/gi;
    const matches = query.match(tablePattern) || [];
    const tables = matches
      .map(match => match.replace(/^(FROM|JOIN|UPDATE|INSERT\s+INTO)\s+/i, ''))
      .filter(table => ['tenants', 'tenant_users', 'user_roles', 'user_role_assignments', 'role_permissions'].includes(table));
    
    return [...new Set(tables)]; // Remove duplicates
  }

  /**
   * Generate index suggestions for slow queries
   */
  private generateIndexSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    
    // Simple pattern matching for common scenarios
    if (query.includes('WHERE tenant_id =') && query.includes('tenant_users')) {
      suggestions.push('Consider composite index on (tenant_id, status)');
    }
    
    if (query.includes('WHERE email =') && query.includes('tenant_users')) {
      suggestions.push('Consider index on (tenant_id, email)');
    }
    
    if (query.includes('ORDER BY created_at')) {
      suggestions.push('Consider index including created_at for sorting');
    }
    
    if (query.includes('JOIN user_role_assignments')) {
      suggestions.push('Verify index on user_role_assignments foreign keys');
    }

    return suggestions;
  }

  /**
   * Store index metrics in history
   */
  private async storeIndexMetrics(metrics: IndexMetrics[]): Promise<void> {
    if (!this.client || metrics.length === 0) return;

    const values = metrics.map(m => 
      `('${m.indexName}', '${m.tableName}', ${m.indexSizeBytes}, ${m.indexScans}, ${m.tupsRead}, ${m.tupsReturned}, ${m.indexScanRatio}, ${m.efficiency})`
    ).join(',');

    const query = `
      INSERT INTO index_performance_history 
      (index_name, table_name, index_size_bytes, index_scans, tuples_read, tuples_returned, scan_ratio, efficiency_score)
      VALUES ${values};
    `;

    await this.client.query(query);
  }

  /**
   * Store slow queries in history  
   */
  private async storeSlowQueries(queries: SlowQueryMetrics[]): Promise<void> {
    if (!this.client || queries.length === 0) return;

    for (const query of queries) {
      const insertQuery = `
        INSERT INTO slow_queries_history 
        (query_hash, query_text, execution_count, total_time_ms, mean_time_ms, max_time_ms, affected_tables, suggested_indexes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (query_hash) DO UPDATE SET
          execution_count = EXCLUDED.execution_count,
          total_time_ms = EXCLUDED.total_time_ms,
          mean_time_ms = EXCLUDED.mean_time_ms,
          max_time_ms = EXCLUDED.max_time_ms,
          recorded_at = NOW();
      `;

      await this.client.query(insertQuery, [
        query.queryId,
        query.query,
        query.calls,
        query.totalTime,
        query.meanTime,
        query.maxTime,
        query.affectedTables,
        query.suggestedIndexes
      ]);
    }
  }

  /**
   * Check for performance issues and create alerts
   */
  private async checkPerformanceAlerts(
    indexMetrics: IndexMetrics[], 
    slowQueries: SlowQueryMetrics[]
  ): Promise<void> {
    if (!this.client) return;

    // Check for unused indexes
    const unusedIndexes = indexMetrics.filter(idx => idx.indexScans === 0);
    for (const idx of unusedIndexes) {
      await this.createAlert('UNUSED_INDEX', 'WARNING', 
        `Index ${idx.indexName} has never been used`, 
        { index: idx });
    }

    // Check for low efficiency indexes
    const lowEfficiencyIndexes = indexMetrics.filter(idx => 
      idx.efficiency < this.config.alertThreshold && idx.indexScans > 0);
    for (const idx of lowEfficiencyIndexes) {
      await this.createAlert('LOW_EFFICIENCY_INDEX', 'WARNING',
        `Index ${idx.indexName} has low efficiency: ${idx.efficiency}%`,
        { index: idx });
    }

    // Check for consistently slow queries
    const criticalSlowQueries = slowQueries.filter(q => 
      q.meanTime > this.config.slowQueryThreshold * 2 && q.calls > 10);
    for (const query of criticalSlowQueries) {
      await this.createAlert('SLOW_QUERY', 'CRITICAL',
        `Query averaging ${query.meanTime}ms needs optimization`,
        { query: query });
    }
  }

  /**
   * Create performance alert
   */
  private async createAlert(
    alertType: string, 
    severity: string, 
    message: string, 
    details: any
  ): Promise<void> {
    if (!this.client) return;

    const query = `
      INSERT INTO performance_alerts (alert_type, severity, message, details)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING;
    `;

    await this.client.query(query, [alertType, severity, message, JSON.stringify(details)]);
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(): Promise<{
    indexSummary: any,
    slowQueriesSummary: any,
    alerts: any[]
  }> {
    if (!this.client) throw new Error('Monitor not initialized');

    const { indexMetrics, slowQueries } = await this.collectMetrics();
    
    // Generate summary statistics
    const indexSummary = {
      totalIndexes: indexMetrics.length,
      totalSizeBytes: indexMetrics.reduce((sum, idx) => sum + idx.indexSizeBytes, 0),
      averageEfficiency: indexMetrics.length > 0 
        ? indexMetrics.reduce((sum, idx) => sum + idx.efficiency, 0) / indexMetrics.length 
        : 0,
      unusedCount: indexMetrics.filter(idx => idx.indexScans === 0).length,
      lowEfficiencyCount: indexMetrics.filter(idx => idx.efficiency < 70).length
    };

    const slowQueriesSummary = {
      totalSlowQueries: slowQueries.length,
      averageTime: slowQueries.length > 0 
        ? slowQueries.reduce((sum, q) => sum + q.meanTime, 0) / slowQueries.length 
        : 0,
      criticalQueries: slowQueries.filter(q => q.meanTime > this.config.slowQueryThreshold * 2).length
    };

    // Get recent alerts
    const alertsQuery = `
      SELECT alert_type, severity, message, created_at, resolved_at
      FROM performance_alerts
      WHERE created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 20;
    `;
    const alertsResult = await this.client.query(alertsQuery);

    return {
      indexSummary,
      slowQueriesSummary,
      alerts: alertsResult.rows
    };
  }
}

// Export utilities
export const createIndexMonitor = (config?: Partial<IndexMonitorConfig>) => {
  const finalConfig = { ...DEFAULT_MONITOR_CONFIG, ...config };
  return new IndexPerformanceMonitor(finalConfig);
};

export default IndexPerformanceMonitor;