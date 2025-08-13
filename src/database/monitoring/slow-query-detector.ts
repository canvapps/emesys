/**
 * 🐌 CHUNK 1A.7: Slow Query Detection dan Logging System
 * =======================================================
 * 
 * Enterprise-grade slow query detection system untuk wedding invitation application.
 * Sistem ini akan:
 * - Monitor query execution time real-time
 * - Log slow queries dengan detailed metrics
 * - Analyze query patterns dan frequency
 * - Generate optimization recommendations
 * - Integrate dengan pg_stat_statements untuk advanced analytics
 * 
 * Performance Targets:
 * - Detect queries > 100ms (configurable threshold)
 * - Log dengan structured format untuk analysis
 * - Alert untuk queries > 1000ms (critical threshold)
 * - Maintain historical data untuk trend analysis
 * 
 * Created: 2025-01-12 21:31 WIB
 * Version: 1.0.0
 * Test Coverage Target: >95%
 */

import { Pool, Client, PoolClient } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration interfaces
export interface SlowQueryConfig {
  thresholds: {
    warning: number;    // Default: 100ms
    critical: number;   // Default: 1000ms
    timeout: number;    // Default: 30000ms
  };
  logging: {
    enabled: boolean;
    logFile: string;
    maxFileSize: number; // bytes
    rotateFiles: number;
  };
  monitoring: {
    enabled: boolean;
    sampleRate: number; // 0.0 - 1.0 (percentage of queries to analyze)
    batchSize: number;
  };
  alerts: {
    enabled: boolean;
    webhook?: string;
    email?: string[];
  };
}

// Query metrics interfaces
export interface QueryMetrics {
  query: string;
  queryId: string;
  executionTime: number;
  timestamp: Date;
  tenantId?: string;
  userId?: string;
  parameters?: any[];
  stackTrace?: string;
  planningTime?: number;
  executionPlan?: any;
  rowsReturned?: number;
  tables?: string[];
  indexesUsed?: string[];
  severity: 'WARNING' | 'CRITICAL' | 'TIMEOUT';
}

export interface SlowQueryStats {
  totalQueries: number;
  slowQueries: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  mostFrequentSlowQueries: Array<{
    query: string;
    count: number;
    avgTime: number;
    maxTime: number;
  }>;
  tenantDistribution: Map<string, number>;
}

export interface OptimizationRecommendation {
  queryPattern: string;
  issue: string;
  recommendation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedImprovement: string;
  implementation: string;
}

/**
 * Main Slow Query Detector Class
 */
export class SlowQueryDetector {
  private config: SlowQueryConfig;
  private pool: Pool;
  private isMonitoring: boolean = false;
  private queryHistory: QueryMetrics[] = [];
  private logBuffer: QueryMetrics[] = [];
  private statsCache: SlowQueryStats | null = null;

  constructor(pool: Pool, config?: Partial<SlowQueryConfig>) {
    this.pool = pool;
    this.config = this.mergeConfig(config);
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(userConfig?: Partial<SlowQueryConfig>): SlowQueryConfig {
    const defaultConfig: SlowQueryConfig = {
      thresholds: {
        warning: 100,      // 100ms
        critical: 1000,    // 1s
        timeout: 30000     // 30s
      },
      logging: {
        enabled: true,
        logFile: 'logs/slow-queries.log',
        maxFileSize: 100 * 1024 * 1024, // 100MB
        rotateFiles: 5
      },
      monitoring: {
        enabled: true,
        sampleRate: 1.0,   // Monitor 100% of queries
        batchSize: 50
      },
      alerts: {
        enabled: true
      }
    };

    return {
      thresholds: { ...defaultConfig.thresholds, ...userConfig?.thresholds },
      logging: { ...defaultConfig.logging, ...userConfig?.logging },
      monitoring: { ...defaultConfig.monitoring, ...userConfig?.monitoring },
      alerts: { ...defaultConfig.alerts, ...userConfig?.alerts }
    };
  }

  /**
   * Start monitoring slow queries
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('SlowQueryDetector: Already monitoring');
      return;
    }

    console.log('🚀 Starting Slow Query Detection System...');
    
    // Setup pg_stat_statements if available
    await this.setupStatStatements();
    
    // Setup logging directory
    await this.setupLogging();
    
    // Start monitoring loop
    this.isMonitoring = true;
    this.startMonitoringLoop();
    
    console.log('✅ Slow Query Detection System started successfully');
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) return;

    console.log('🛑 Stopping Slow Query Detection System...');
    this.isMonitoring = false;
    
    // Flush remaining logs
    if (this.logBuffer.length > 0) {
      await this.flushLogBuffer();
    }
    
    console.log('✅ Slow Query Detection System stopped');
  }

  /**
   * Execute query with monitoring
   */
  async executeWithMonitoring<T = any>(
    query: string, 
    params?: any[], 
    context?: { tenantId?: string; userId?: string }
  ): Promise<T> {
    const startTime = Date.now();
    const timestamp = new Date();
    const queryId = this.generateQueryId(query);
    
    let client: PoolClient | null = null;
    let result: T;
    
    try {
      // Get connection
      client = await this.pool.connect();
      
      // Execute query
      const queryResult = await client.query(query, params);
      result = queryResult as T;
      
      const executionTime = Date.now() - startTime;
      
      // Check if query is slow
      if (executionTime >= this.config.thresholds.warning) {
        await this.handleSlowQuery({
          query: this.sanitizeQuery(query),
          queryId,
          executionTime,
          timestamp,
          tenantId: context?.tenantId,
          userId: context?.userId,
          parameters: this.sanitizeParameters(params),
          rowsReturned: Array.isArray(queryResult.rows) ? queryResult.rows.length : 0,
          severity: this.getSeverity(executionTime)
        });
      }
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Log failed queries that took significant time
      if (executionTime >= this.config.thresholds.warning) {
        await this.handleSlowQuery({
          query: this.sanitizeQuery(query),
          queryId,
          executionTime,
          timestamp,
          tenantId: context?.tenantId,
          userId: context?.userId,
          parameters: this.sanitizeParameters(params),
          severity: 'CRITICAL',
          stackTrace: error instanceof Error ? error.stack : String(error)
        });
      }
      
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Get slow query statistics
   */
  async getSlowQueryStats(refresh: boolean = false): Promise<SlowQueryStats> {
    if (this.statsCache && !refresh) {
      return this.statsCache;
    }

    const stats: SlowQueryStats = {
      totalQueries: this.queryHistory.length,
      slowQueries: this.queryHistory.filter(q => q.executionTime >= this.config.thresholds.warning).length,
      averageExecutionTime: 0,
      medianExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      mostFrequentSlowQueries: [],
      tenantDistribution: new Map()
    };

    if (this.queryHistory.length === 0) {
      this.statsCache = stats;
      return stats;
    }

    // Calculate execution time statistics
    const execTimes = this.queryHistory.map(q => q.executionTime).sort((a, b) => a - b);
    stats.averageExecutionTime = execTimes.reduce((sum, time) => sum + time, 0) / execTimes.length;
    stats.medianExecutionTime = this.getPercentile(execTimes, 50);
    stats.p95ExecutionTime = this.getPercentile(execTimes, 95);
    stats.p99ExecutionTime = this.getPercentile(execTimes, 99);

    // Calculate most frequent slow queries
    const queryFrequency = new Map<string, { count: number; totalTime: number; maxTime: number }>();
    
    this.queryHistory
      .filter(q => q.executionTime >= this.config.thresholds.warning)
      .forEach(q => {
        const normalized = this.normalizeQuery(q.query);
        const current = queryFrequency.get(normalized) || { count: 0, totalTime: 0, maxTime: 0 };
        
        current.count++;
        current.totalTime += q.executionTime;
        current.maxTime = Math.max(current.maxTime, q.executionTime);
        
        queryFrequency.set(normalized, current);
      });

    stats.mostFrequentSlowQueries = Array.from(queryFrequency.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgTime: Math.round(data.totalTime / data.count),
        maxTime: data.maxTime
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate tenant distribution
    this.queryHistory.forEach(q => {
      if (q.tenantId) {
        const current = stats.tenantDistribution.get(q.tenantId) || 0;
        stats.tenantDistribution.set(q.tenantId, current + 1);
      }
    });

    this.statsCache = stats;
    return stats;
  }

  /**
   * Generate optimization recommendations
   */
  async generateRecommendations(): Promise<OptimizationRecommendation[]> {
    const stats = await this.getSlowQueryStats(true);
    const recommendations: OptimizationRecommendation[] = [];

    // Analyze most frequent slow queries
    for (const slowQuery of stats.mostFrequentSlowQueries) {
      const query = slowQuery.query.toLowerCase();

      // Check for missing indexes
      if (query.includes('where') && !query.includes('index')) {
        if (query.includes('tenant_id') && !query.includes('idx_tenant')) {
          recommendations.push({
            queryPattern: slowQuery.query,
            issue: 'Missing tenant_id index',
            recommendation: 'Create composite index with tenant_id as first column',
            priority: 'HIGH',
            estimatedImprovement: `${Math.round(slowQuery.avgTime * 0.7)}ms reduction`,
            implementation: 'CREATE INDEX CONCURRENTLY idx_table_tenant_id ON table_name (tenant_id, other_columns);'
          });
        }
      }

      // Check for N+1 queries
      if (slowQuery.count > 50 && slowQuery.avgTime < 50) {
        recommendations.push({
          queryPattern: slowQuery.query,
          issue: 'Possible N+1 query pattern',
          recommendation: 'Consider using JOINs or batch loading',
          priority: 'MEDIUM',
          estimatedImprovement: '80% query reduction',
          implementation: 'Optimize application code to use batch queries or proper JOINs'
        });
      }

      // Check for full table scans
      if (query.includes('select') && !query.includes('where') && slowQuery.avgTime > 200) {
        recommendations.push({
          queryPattern: slowQuery.query,
          issue: 'Full table scan detected',
          recommendation: 'Add WHERE clause with indexed columns',
          priority: 'HIGH',
          estimatedImprovement: `${Math.round(slowQuery.avgTime * 0.9)}ms reduction`,
          implementation: 'Add appropriate WHERE conditions and ensure proper indexing'
        });
      }
    }

    return recommendations.slice(0, 10); // Return top 10 recommendations
  }

  /**
   * Private helper methods
   */
  private async setupStatStatements(): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      // Check if pg_stat_statements is available
      const result = await client.query(`
        SELECT 1 FROM pg_available_extensions 
        WHERE name = 'pg_stat_statements'
      `);
      
      if (result.rows.length > 0) {
        // Try to create extension (will fail if already exists, which is fine)
        try {
          await client.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
          console.log('✅ pg_stat_statements extension available');
        } catch (error) {
          console.warn('⚠️ Could not enable pg_stat_statements:', (error as Error).message);
        }
      }
      
      client.release();
    } catch (error) {
      console.warn('⚠️ pg_stat_statements setup failed:', (error as Error).message);
    }
  }

  private async setupLogging(): Promise<void> {
    if (!this.config.logging.enabled) return;

    try {
      const logDir = path.dirname(this.config.logging.logFile);
      await fs.mkdir(logDir, { recursive: true });
      console.log(`✅ Logging directory created: ${logDir}`);
    } catch (error) {
      console.error('❌ Failed to create logging directory:', (error as Error).message);
    }
  }

  private startMonitoringLoop(): void {
    if (!this.config.monitoring.enabled) return;

    const monitoringInterval = setInterval(async () => {
      if (!this.isMonitoring) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        // Flush log buffer if needed
        if (this.logBuffer.length >= this.config.monitoring.batchSize) {
          await this.flushLogBuffer();
        }

        // Cleanup old query history (keep last 1000 entries)
        if (this.queryHistory.length > 1000) {
          this.queryHistory = this.queryHistory.slice(-1000);
          this.statsCache = null; // Invalidate cache
        }

      } catch (error) {
        console.error('❌ Monitoring loop error:', (error as Error).message);
      }
    }, 5000); // Run every 5 seconds
  }

  private async handleSlowQuery(metrics: QueryMetrics): Promise<void> {
    // Add to history
    this.queryHistory.push(metrics);
    
    // Add to log buffer
    if (this.config.logging.enabled) {
      this.logBuffer.push(metrics);
    }
    
    // Invalidate stats cache
    this.statsCache = null;
    
    // Handle alerts
    if (this.config.alerts.enabled && metrics.severity === 'CRITICAL') {
      await this.sendAlert(metrics);
    }
    
    // Log to console for immediate visibility
    console.warn(
      `🐌 Slow Query Detected (${metrics.severity}): ` +
      `${metrics.executionTime}ms - ${metrics.query.substring(0, 100)}...`
    );
  }

  private async flushLogBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const logEntries = this.logBuffer.map(metrics => ({
        timestamp: metrics.timestamp.toISOString(),
        severity: metrics.severity,
        executionTime: metrics.executionTime,
        query: metrics.query,
        queryId: metrics.queryId,
        tenantId: metrics.tenantId,
        userId: metrics.userId,
        rowsReturned: metrics.rowsReturned,
        stackTrace: metrics.stackTrace
      }));

      const logData = logEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      await fs.appendFile(this.config.logging.logFile, logData);
      
      // Clear buffer
      this.logBuffer = [];
      
      console.log(`📝 Flushed ${logEntries.length} slow query logs`);
      
    } catch (error) {
      console.error('❌ Failed to flush log buffer:', (error as Error).message);
    }
  }

  private async sendAlert(metrics: QueryMetrics): Promise<void> {
    // Implementation for webhook/email alerts
    console.error(
      `🚨 CRITICAL SLOW QUERY ALERT:\n` +
      `Time: ${metrics.executionTime}ms\n` +
      `Query: ${metrics.query}\n` +
      `Tenant: ${metrics.tenantId || 'N/A'}\n` +
      `User: ${metrics.userId || 'N/A'}`
    );
  }

  private generateQueryId(query: string): string {
    // Simple hash function for query identification
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from queries for logging
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sanitizeParameters(params?: any[]): any[] | undefined {
    if (!params) return undefined;
    
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return param.substring(0, 100) + '...';
      }
      return param;
    });
  }

  private getSeverity(executionTime: number): 'WARNING' | 'CRITICAL' | 'TIMEOUT' {
    if (executionTime >= this.config.thresholds.timeout) return 'TIMEOUT';
    if (executionTime >= this.config.thresholds.critical) return 'CRITICAL';
    return 'WARNING';
  }

  private normalizeQuery(query: string): string {
    // Normalize query for pattern matching (remove parameters, extra spaces, etc.)
    return query
      .replace(/\$\d+/g, '?') // Replace $1, $2, etc. with ?
      .replace(/'\w+'/g, "'?'") // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }
}

/**
 * Factory function to create SlowQueryDetector instance
 */
export function createSlowQueryDetector(
  pool: Pool, 
  config?: Partial<SlowQueryConfig>
): SlowQueryDetector {
  return new SlowQueryDetector(pool, config);
}

/**
 * Utility functions for external use
 */
export class SlowQueryUtils {
  static async analyzeLogFile(logFilePath: string): Promise<{
    totalEntries: number;
    severityDistribution: Record<string, number>;
    topSlowQueries: Array<{ query: string; maxTime: number; count: number }>;
  }> {
    try {
      const logData = await fs.readFile(logFilePath, 'utf-8');
      const lines = logData.trim().split('\n').filter(line => line.trim());
      
      const entries = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const severityDistribution: Record<string, number> = {};
      const queryFrequency = new Map<string, { maxTime: number; count: number }>();

      entries.forEach((entry: any) => {
        // Count by severity
        severityDistribution[entry.severity] = (severityDistribution[entry.severity] || 0) + 1;
        
        // Track query frequency
        const normalized = entry.query?.substring(0, 100) || 'unknown';
        const current = queryFrequency.get(normalized) || { maxTime: 0, count: 0 };
        current.count++;
        current.maxTime = Math.max(current.maxTime, entry.executionTime || 0);
        queryFrequency.set(normalized, current);
      });

      const topSlowQueries = Array.from(queryFrequency.entries())
        .map(([query, data]) => ({ query, ...data }))
        .sort((a, b) => b.maxTime - a.maxTime)
        .slice(0, 10);

      return {
        totalEntries: entries.length,
        severityDistribution,
        topSlowQueries
      };
    } catch (error) {
      throw new Error(`Failed to analyze log file: ${(error as Error).message}`);
    }
  }
}