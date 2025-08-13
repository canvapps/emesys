#!/usr/bin/env node

/**
 * 🔧 CHUNK 1A.7: Database Index Maintenance CLI Tool
 * ================================================
 * 
 * Enterprise-grade CLI tool untuk database index management
 * dan performance optimization pada multi-tenant wedding invitation system.
 * 
 * Commands Available:
 * - analyze: Analyze index performance and usage
 * - monitor: Start real-time monitoring
 * - maintain: Run maintenance tasks (REINDEX, ANALYZE, etc.)
 * - report: Generate comprehensive performance reports
 * - optimize: Get optimization recommendations
 * - help: Show detailed help information
 * 
 * Usage Examples:
 * node run-index-maintenance.cjs analyze
 * node run-index-maintenance.cjs monitor --interval 30
 * node run-index-maintenance.cjs maintain --reindex
 * node run-index-maintenance.cjs report --format json
 * 
 * Created: 2025-01-12 21:28 WIB
 * Target: Maintain >95% database performance efficiency
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// CLI Configuration
const CLI_CONFIG = {
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  },
  symbols: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    arrow: '➤',
    bullet: '•'
  }
};

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'weddinvite_enterprise',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

/**
 * Utility functions
 */
function colorize(text, color) {
  const colorCode = CLI_CONFIG.colors[color] || CLI_CONFIG.colors.reset;
  return `${colorCode}${text}${CLI_CONFIG.colors.reset}`;
}

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function printHeader(title) {
  const line = '='.repeat(60);
  console.log(colorize(line, 'cyan'));
  console.log(colorize(`🔧 ${title}`, 'bright'));
  console.log(colorize(line, 'cyan'));
}

function printSection(title) {
  console.log(colorize(`\n${CLI_CONFIG.symbols.arrow} ${title}`, 'blue'));
  console.log(colorize('-'.repeat(40), 'blue'));
}

/**
 * Database connection manager
 */
async function connectToDatabase() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error(colorize(`${CLI_CONFIG.symbols.error} Database connection failed:`, 'red'), error.message);
    throw error;
  }
}

/**
 * Command: analyze - Analyze index performance
 */
async function analyzeIndexes(options = {}) {
  printHeader('INDEX PERFORMANCE ANALYSIS');
  
  const client = await connectToDatabase();
  
  try {
    // Get comprehensive index metrics
    const indexQuery = `
      SELECT 
        schemaname||'.'||indexname as index_name,
        schemaname||'.'||tablename as table_name,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
        pg_relation_size(schemaname||'.'||indexname) as size_bytes,
        COALESCE(idx_scan, 0) as scans,
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
        END as efficiency
      FROM pg_stat_user_indexes pui
      JOIN pg_statio_user_indexes psui ON pui.indexrelid = psui.indexrelid
      WHERE schemaname = 'public'
        AND (tablename LIKE 'tenant%' OR tablename LIKE 'user_%' OR tablename = 'tenants')
      ORDER BY scans DESC;
    `;

    const result = await client.query(indexQuery);
    
    if (result.rows.length === 0) {
      console.log(colorize(`${CLI_CONFIG.symbols.warning} No indexes found for analysis`, 'yellow'));
      return;
    }

    // Calculate summary statistics
    const totalIndexes = result.rows.length;
    const totalSize = result.rows.reduce((sum, row) => sum + parseInt(row.size_bytes), 0);
    const avgEfficiency = result.rows.reduce((sum, row) => sum + parseFloat(row.efficiency), 0) / totalIndexes;
    const unusedIndexes = result.rows.filter(row => parseInt(row.scans) === 0);
    const lowEfficiency = result.rows.filter(row => parseFloat(row.efficiency) < 70);

    // Print summary
    printSection('SUMMARY STATISTICS');
    console.log(`${CLI_CONFIG.symbols.info} Total Indexes: ${colorize(totalIndexes, 'bright')}`);
    console.log(`${CLI_CONFIG.symbols.info} Total Size: ${colorize(formatBytes(totalSize), 'bright')}`);
    console.log(`${CLI_CONFIG.symbols.info} Average Efficiency: ${colorize(avgEfficiency.toFixed(2) + '%', 'bright')}`);
    console.log(`${CLI_CONFIG.symbols.warning} Unused Indexes: ${colorize(unusedIndexes.length, 'yellow')}`);
    console.log(`${CLI_CONFIG.symbols.warning} Low Efficiency: ${colorize(lowEfficiency.length, 'yellow')}`);

    // Print detailed index analysis
    printSection('DETAILED INDEX ANALYSIS');
    
    result.rows.forEach((row, index) => {
      const efficiency = parseFloat(row.efficiency);
      const scans = parseInt(row.scans);
      
      let status, statusColor;
      if (scans === 0) {
        status = 'UNUSED';
        statusColor = 'red';
      } else if (efficiency < 50) {
        status = 'LOW_EFF';
        statusColor = 'yellow';
      } else if (efficiency < 80) {
        status = 'MODERATE';
        statusColor = 'yellow';
      } else {
        status = 'OPTIMAL';
        statusColor = 'green';
      }

      console.log(`\n${index + 1}. ${colorize(row.index_name, 'bright')}`);
      console.log(`   Table: ${row.table_name}`);
      console.log(`   Size: ${row.index_size} | Scans: ${scans} | Efficiency: ${efficiency}%`);
      console.log(`   Status: ${colorize(status, statusColor)}`);
      
      if (scans === 0) {
        console.log(`   ${colorize('⚠️ Recommendation: Consider dropping this unused index', 'yellow')}`);
      } else if (efficiency < 70) {
        console.log(`   ${colorize('⚠️ Recommendation: Review index design or query patterns', 'yellow')}`);
      }
    });

    // Print optimization recommendations
    if (unusedIndexes.length > 0 || lowEfficiency.length > 0) {
      printSection('OPTIMIZATION RECOMMENDATIONS');
      
      if (unusedIndexes.length > 0) {
        console.log(colorize('🗑️ UNUSED INDEXES (Consider dropping):', 'yellow'));
        unusedIndexes.forEach(idx => {
          console.log(`   ${CLI_CONFIG.symbols.bullet} ${idx.index_name} (${idx.index_size})`);
        });
      }
      
      if (lowEfficiency.length > 0) {
        console.log(colorize('\n⚡ LOW EFFICIENCY INDEXES (Need optimization):', 'yellow'));
        lowEfficiency.forEach(idx => {
          console.log(`   ${CLI_CONFIG.symbols.bullet} ${idx.index_name} (${idx.efficiency}% efficiency)`);
        });
      }
    }

  } catch (error) {
    console.error(colorize(`${CLI_CONFIG.symbols.error} Analysis failed:`, 'red'), error.message);
  } finally {
    await client.end();
  }
}

/**
 * Command: monitor - Real-time monitoring
 */
async function monitorPerformance(options = {}) {
  const interval = options.interval || 60; // seconds
  printHeader(`REAL-TIME PERFORMANCE MONITORING (${interval}s interval)`);
  
  console.log(colorize(`${CLI_CONFIG.symbols.info} Starting monitoring... Press Ctrl+C to stop`, 'blue'));

  let iterationCount = 0;

  const monitoringLoop = setInterval(async () => {
    try {
      iterationCount++;
      const client = await connectToDatabase();

      // Quick performance check
      const perfQuery = `
        SELECT 
          COUNT(*) as total_indexes,
          SUM(pg_relation_size(schemaname||'.'||indexname)) as total_size,
          AVG(CASE WHEN idx_scan > 0 THEN 100.0 * idx_tup_fetch / GREATEST(idx_tup_read, 1) ELSE 0 END) as avg_efficiency
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND (tablename LIKE 'tenant%' OR tablename LIKE 'user_%' OR tablename = 'tenants');
      `;

      const result = await client.query(perfQuery);
      const metrics = result.rows[0];

      console.log(`\n${colorize(`[${new Date().toLocaleTimeString()}] Iteration ${iterationCount}`, 'cyan')}`);
      console.log(`  Indexes: ${metrics.total_indexes} | Size: ${formatBytes(metrics.total_size)}`);
      console.log(`  Avg Efficiency: ${parseFloat(metrics.avg_efficiency).toFixed(2)}%`);

      await client.end();
    } catch (error) {
      console.error(colorize(`${CLI_CONFIG.symbols.error} Monitoring error:`, 'red'), error.message);
    }
  }, interval * 1000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(monitoringLoop);
    console.log(colorize(`\n${CLI_CONFIG.symbols.info} Monitoring stopped`, 'blue'));
    process.exit(0);
  });
}

/**
 * Command: maintain - Database maintenance
 */
async function runMaintenance(options = {}) {
  printHeader('DATABASE MAINTENANCE');
  
  const client = await connectToDatabase();
  
  try {
    if (options.reindex) {
      printSection('REINDEXING OPERATIONS');
      console.log(colorize(`${CLI_CONFIG.symbols.info} Starting REINDEX operations...`, 'blue'));
      
      // Get all indexes to reindex
      const indexQuery = `
        SELECT schemaname||'.'||indexname as index_name, tablename
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND (tablename LIKE 'tenant%' OR tablename LIKE 'user_%' OR tablename = 'tenants')
          AND idx_scan > 0
        ORDER BY tablename;
      `;

      const result = await client.query(indexQuery);
      
      for (const row of result.rows) {
        try {
          console.log(`  Reindexing ${row.index_name}...`);
          await client.query(`REINDEX INDEX CONCURRENTLY ${row.index_name}`);
          console.log(colorize(`    ${CLI_CONFIG.symbols.success} Success`, 'green'));
        } catch (error) {
          console.log(colorize(`    ${CLI_CONFIG.symbols.error} Failed: ${error.message}`, 'red'));
        }
      }
    }

    if (options.analyze) {
      printSection('ANALYZE OPERATIONS');
      console.log(colorize(`${CLI_CONFIG.symbols.info} Running ANALYZE on tables...`, 'blue'));
      
      const tables = ['tenants', 'tenant_users', 'user_roles', 'user_role_assignments', 'role_permissions'];
      
      for (const table of tables) {
        try {
          console.log(`  Analyzing ${table}...`);
          await client.query(`ANALYZE ${table}`);
          console.log(colorize(`    ${CLI_CONFIG.symbols.success} Success`, 'green'));
        } catch (error) {
          console.log(colorize(`    ${CLI_CONFIG.symbols.error} Failed: ${error.message}`, 'red'));
        }
      }
    }

    if (options.vacuum) {
      printSection('VACUUM OPERATIONS');
      console.log(colorize(`${CLI_CONFIG.symbols.info} Running VACUUM on tables...`, 'blue'));
      
      const tables = ['tenants', 'tenant_users', 'user_roles', 'user_role_assignments', 'role_permissions'];
      
      for (const table of tables) {
        try {
          console.log(`  Vacuuming ${table}...`);
          await client.query(`VACUUM ${table}`);
          console.log(colorize(`    ${CLI_CONFIG.symbols.success} Success`, 'green'));
        } catch (error) {
          console.log(colorize(`    ${CLI_CONFIG.symbols.error} Failed: ${error.message}`, 'red'));
        }
      }
    }

    if (!options.reindex && !options.analyze && !options.vacuum) {
      console.log(colorize(`${CLI_CONFIG.symbols.warning} No maintenance operations specified`, 'yellow'));
      console.log('Available options: --reindex, --analyze, --vacuum');
    }

  } catch (error) {
    console.error(colorize(`${CLI_CONFIG.symbols.error} Maintenance failed:`, 'red'), error.message);
  } finally {
    await client.end();
  }
}

/**
 * Command: report - Generate performance report
 */
async function generateReport(options = {}) {
  printHeader('PERFORMANCE REPORT GENERATION');
  
  const client = await connectToDatabase();
  
  try {
    // Collect comprehensive metrics
    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      indexes: [],
      slowQueries: [],
      recommendations: []
    };

    // Index metrics
    const indexQuery = `
      SELECT 
        schemaname||'.'||indexname as index_name,
        schemaname||'.'||tablename as table_name,
        pg_relation_size(schemaname||'.'||indexname) as size_bytes,
        COALESCE(idx_scan, 0) as scans,
        CASE
          WHEN idx_scan = 0 THEN 0
          WHEN idx_tup_read = 0 THEN 100
          ELSE ROUND(100.0 * idx_tup_fetch / GREATEST(idx_tup_read, 1), 2)
        END as efficiency
      FROM pg_stat_user_indexes pui
      JOIN pg_statio_user_indexes psui ON pui.indexrelid = psui.indexrelid
      WHERE schemaname = 'public'
        AND (tablename LIKE 'tenant%' OR tablename LIKE 'user_%' OR tablename = 'tenants')
      ORDER BY scans DESC;
    `;

    const indexResult = await client.query(indexQuery);
    report.indexes = indexResult.rows;

    // Calculate summary
    report.summary = {
      totalIndexes: indexResult.rows.length,
      totalSize: indexResult.rows.reduce((sum, row) => sum + parseInt(row.size_bytes), 0),
      averageEfficiency: indexResult.rows.reduce((sum, row) => sum + parseFloat(row.efficiency), 0) / indexResult.rows.length,
      unusedIndexes: indexResult.rows.filter(row => parseInt(row.scans) === 0).length,
      lowEfficiencyIndexes: indexResult.rows.filter(row => parseFloat(row.efficiency) < 70).length
    };

    // Generate recommendations
    report.recommendations = [];
    indexResult.rows.forEach(row => {
      if (parseInt(row.scans) === 0) {
        report.recommendations.push({
          type: 'DROP_UNUSED',
          target: row.index_name,
          reason: 'Index has never been used',
          priority: 'HIGH'
        });
      } else if (parseFloat(row.efficiency) < 50) {
        report.recommendations.push({
          type: 'OPTIMIZE_INDEX',
          target: row.index_name,
          reason: `Low efficiency: ${row.efficiency}%`,
          priority: 'MEDIUM'
        });
      }
    });

    // Output report
    if (options.format === 'json') {
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Human-readable format
      printSection('REPORT SUMMARY');
      console.log(`Generated: ${report.timestamp}`);
      console.log(`Total Indexes: ${report.summary.totalIndexes}`);
      console.log(`Total Size: ${formatBytes(report.summary.totalSize)}`);
      console.log(`Average Efficiency: ${report.summary.averageEfficiency.toFixed(2)}%`);
      console.log(`Unused Indexes: ${report.summary.unusedIndexes}`);
      console.log(`Low Efficiency: ${report.summary.lowEfficiencyIndexes}`);

      if (report.recommendations.length > 0) {
        printSection('RECOMMENDATIONS');
        report.recommendations.forEach((rec, index) => {
          const priority = rec.priority === 'HIGH' ? colorize(rec.priority, 'red') : colorize(rec.priority, 'yellow');
          console.log(`${index + 1}. [${priority}] ${rec.type}: ${rec.target}`);
          console.log(`   ${rec.reason}`);
        });
      }
    }

    // Save report to file
    if (options.save) {
      const filename = `performance_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      console.log(colorize(`\n${CLI_CONFIG.symbols.success} Report saved to ${filename}`, 'green'));
    }

  } catch (error) {
    console.error(colorize(`${CLI_CONFIG.symbols.error} Report generation failed:`, 'red'), error.message);
  } finally {
    await client.end();
  }
}

/**
 * Command: help - Show help information
 */
function showHelp() {
  printHeader('DATABASE INDEX MAINTENANCE CLI HELP');
  
  console.log(colorize('USAGE:', 'bright'));
  console.log('  node run-index-maintenance.cjs <command> [options]');
  
  console.log(colorize('\nCOMMANDS:', 'bright'));
  console.log('  analyze   - Analyze index performance and usage');
  console.log('  monitor   - Start real-time performance monitoring');
  console.log('  maintain  - Run database maintenance operations');
  console.log('  report    - Generate comprehensive performance report');
  console.log('  help      - Show this help information');

  console.log(colorize('\nOPTIONS:', 'bright'));
  console.log('  Monitor:');
  console.log('    --interval <seconds>  Set monitoring interval (default: 60)');
  
  console.log('  Maintain:');
  console.log('    --reindex            Run REINDEX on active indexes');
  console.log('    --analyze            Run ANALYZE on tables');
  console.log('    --vacuum             Run VACUUM on tables');
  
  console.log('  Report:');
  console.log('    --format <type>      Output format: text, json (default: text)');
  console.log('    --save               Save report to file');

  console.log(colorize('\nEXAMPLES:', 'bright'));
  console.log('  node run-index-maintenance.cjs analyze');
  console.log('  node run-index-maintenance.cjs monitor --interval 30');
  console.log('  node run-index-maintenance.cjs maintain --reindex --analyze');
  console.log('  node run-index-maintenance.cjs report --format json --save');
  
  console.log(colorize('\nDATABASE CONFIGURATION:', 'bright'));
  console.log(`  Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`  Database: ${dbConfig.database}`);
  console.log(`  User: ${dbConfig.user}`);
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Parse options
  const options = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      options[key] = value;
    }
  }

  try {
    switch (command) {
      case 'analyze':
        await analyzeIndexes(options);
        break;
      
      case 'monitor':
        await monitorPerformance(options);
        break;
      
      case 'maintain':
        await runMaintenance(options);
        break;
      
      case 'report':
        await generateReport(options);
        break;
      
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      
      default:
        console.error(colorize(`${CLI_CONFIG.symbols.error} Unknown command: ${command}`, 'red'));
        console.log('\nUse "help" command for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(colorize(`${CLI_CONFIG.symbols.error} Command failed:`, 'red'), error.message);
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzeIndexes,
  monitorPerformance,
  runMaintenance,
  generateReport,
  showHelp
};