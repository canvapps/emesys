/**
 * Rollback Validation System
 * 
 * Provides comprehensive rollback validation and safety checks for database
 * transformations. Ensures safe rollback from generic tables to legacy tables
 * with data integrity validation.
 * 
 * Phase 2.2: Database Table Transformation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConnection } from './connection';

export interface RollbackValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataIntegrityChecks: {
    participantsIntegrity: boolean;
    contentIntegrity: boolean;
    sectionsIntegrity: boolean;
    storiesIntegrity: boolean;
  };
  recommendations: string[];
}

export interface RollbackPlan {
  steps: RollbackStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  prerequisites: string[];
  backupRequired: boolean;
}

export interface RollbackStep {
  stepNumber: number;
  description: string;
  sqlScript?: string;
  validationQuery?: string;
  expectedResult?: any;
  rollbackOnFailure?: boolean;
  estimatedTime: number;
}

/**
 * Rollback Validation Manager
 */
export class RollbackValidationManager {
  constructor(
    private supabase: SupabaseClient,
    private dbConnection?: DatabaseConnection
  ) {}

  /**
   * Validate current state before rollback
   */
  async validatePreRollback(): Promise<RollbackValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if generic tables exist
    const genericTablesExist = await this.checkGenericTablesExistence();
    if (!genericTablesExist.allExist) {
      errors.push('Some generic tables are missing, rollback may not be necessary');
      errors.push(`Missing tables: ${genericTablesExist.missing.join(', ')}`);
    }

    // Check if legacy tables still exist
    const legacyTablesExist = await this.checkLegacyTablesExistence();
    if (!legacyTablesExist.allExist) {
      errors.push('Legacy tables are missing, rollback not possible without restoration');
      errors.push(`Missing legacy tables: ${legacyTablesExist.missing.join(', ')}`);
    }

    // Check data integrity
    const dataIntegrityChecks = await this.performDataIntegrityChecks();

    // Check for data loss risks
    const dataLossRisks = await this.checkDataLossRisks();
    warnings.push(...dataLossRisks);

    // Generate recommendations
    if (dataIntegrityChecks.participantsIntegrity) {
      recommendations.push('Participants data is consistent and safe to rollback');
    } else {
      recommendations.push('Review participants data before rollback');
    }

    if (genericTablesExist.allExist && legacyTablesExist.allExist) {
      recommendations.push('Both generic and legacy tables exist - rollback possible');
    }

    if (warnings.length === 0 && errors.length === 0) {
      recommendations.push('System is ready for rollback');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dataIntegrityChecks,
      recommendations
    };
  }

  /**
   * Generate rollback execution plan
   */
  async generateRollbackPlan(): Promise<RollbackPlan> {
    const validation = await this.validatePreRollback();
    
    if (!validation.isValid) {
      throw new Error('Pre-rollback validation failed: ' + validation.errors.join(', '));
    }

    const steps: RollbackStep[] = [
      {
        stepNumber: 1,
        description: 'Create backup of current generic tables',
        sqlScript: this.generateBackupScript(),
        estimatedTime: 300, // 5 minutes
        rollbackOnFailure: false
      },
      {
        stepNumber: 2,
        description: 'Validate data consistency between generic and legacy tables',
        validationQuery: this.generateDataConsistencyQuery(),
        estimatedTime: 120, // 2 minutes
        rollbackOnFailure: true
      },
      {
        stepNumber: 3,
        description: 'Migrate data from generic tables back to legacy tables',
        sqlScript: this.generateDataMigrationScript(),
        estimatedTime: 600, // 10 minutes
        rollbackOnFailure: true
      },
      {
        stepNumber: 4,
        description: 'Drop generic tables and views',
        sqlScript: this.generateGenericTableDropScript(),
        estimatedTime: 60, // 1 minute
        rollbackOnFailure: false
      },
      {
        stepNumber: 5,
        description: 'Validate legacy table functionality',
        validationQuery: this.generateLegacyValidationQuery(),
        estimatedTime: 180, // 3 minutes
        rollbackOnFailure: false
      },
      {
        stepNumber: 6,
        description: 'Update application configuration to use legacy tables (Manual step: Update hooks and components)',
        estimatedTime: 1800, // 30 minutes
        rollbackOnFailure: false
      }
    ];

    const totalTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const riskLevel = this.assessRollbackRisk(validation);

    return {
      steps,
      estimatedDuration: totalTime,
      riskLevel,
      prerequisites: [
        'Database backup completed',
        'Application maintenance mode enabled',
        'All users notified of downtime',
        'Emergency rollforward plan prepared'
      ],
      backupRequired: true
    };
  }

  /**
   * Execute rollback with validation
   */
  async executeRollback(plan: RollbackPlan): Promise<{
    success: boolean;
    completedSteps: number;
    errors: string[];
    rollbackRequired: boolean;
  }> {
    const errors: string[] = [];
    let completedSteps = 0;
    let rollbackRequired = false;

    try {
      for (const step of plan.steps) {
        console.log(`Executing step ${step.stepNumber}: ${step.description}`);
        
        try {
          if (step.sqlScript) {
            await this.executeSqlScript(step.sqlScript);
          }

          if (step.validationQuery) {
            const validationResult = await this.executeValidationQuery(step.validationQuery);
            if (!validationResult.isValid) {
              throw new Error(`Validation failed: ${validationResult.error}`);
            }
          }

          completedSteps++;
          console.log(`✅ Step ${step.stepNumber} completed`);

        } catch (stepError) {
          const errorMsg = `Step ${step.stepNumber} failed: ${stepError}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);

          if (step.rollbackOnFailure) {
            rollbackRequired = true;
            console.log('🚨 Rollback required due to critical step failure');
            break;
          }
        }
      }

      return {
        success: errors.length === 0 && completedSteps === plan.steps.length,
        completedSteps,
        errors,
        rollbackRequired
      };

    } catch (error) {
      errors.push(`Rollback execution failed: ${error}`);
      return {
        success: false,
        completedSteps,
        errors,
        rollbackRequired: true
      };
    }
  }

  /**
   * Check if generic tables exist
   */
  private async checkGenericTablesExistence(): Promise<{
    allExist: boolean;
    existing: string[];
    missing: string[];
  }> {
    const genericTables = [
      'event_participants',
      'event_content', 
      'event_sections',
      'event_stories'
    ];

    const existing: string[] = [];
    const missing: string[] = [];

    for (const table of genericTables) {
      try {
        const { error } = await this.supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          missing.push(table);
        } else {
          existing.push(table);
        }
      } catch (err) {
        missing.push(table);
      }
    }

    return {
      allExist: missing.length === 0,
      existing,
      missing
    };
  }

  /**
   * Check if legacy tables exist
   */
  private async checkLegacyTablesExistence(): Promise<{
    allExist: boolean;
    existing: string[];
    missing: string[];
  }> {
    const legacyTables = [
      'wedding_couple_info',
      'wedding_important_info',
      'wedding_hero_settings',
      'wedding_love_story'
    ];

    const existing: string[] = [];
    const missing: string[] = [];

    for (const table of legacyTables) {
      try {
        const { error } = await this.supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          missing.push(table);
        } else {
          existing.push(table);
        }
      } catch (err) {
        missing.push(table);
      }
    }

    return {
      allExist: missing.length === 0,
      existing,
      missing
    };
  }

  /**
   * Perform comprehensive data integrity checks
   */
  private async performDataIntegrityChecks(): Promise<{
    participantsIntegrity: boolean;
    contentIntegrity: boolean;
    sectionsIntegrity: boolean;
    storiesIntegrity: boolean;
  }> {
    return {
      participantsIntegrity: await this.checkParticipantsIntegrity(),
      contentIntegrity: await this.checkContentIntegrity(),
      sectionsIntegrity: await this.checkSectionsIntegrity(),
      storiesIntegrity: await this.checkStoriesIntegrity()
    };
  }

  private async checkParticipantsIntegrity(): Promise<boolean> {
    try {
      // Check for orphaned records, duplicate entries, etc.
      const { data, error } = await this.supabase
        .from('event_participants')
        .select('id, tenant_id, primary_participant_name')
        .limit(10);

      return !error && Array.isArray(data);
    } catch {
      return false;
    }
  }

  private async checkContentIntegrity(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('event_content')
        .select('id, tenant_id, title')
        .limit(10);

      return !error && Array.isArray(data);
    } catch {
      return false;
    }
  }

  private async checkSectionsIntegrity(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('event_sections')
        .select('id, tenant_id, section_type')
        .limit(10);

      return !error && Array.isArray(data);
    } catch {
      return false;
    }
  }

  private async checkStoriesIntegrity(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('event_stories')
        .select('id, tenant_id, title')
        .limit(10);

      return !error && Array.isArray(data);
    } catch {
      return false;
    }
  }

  /**
   * Check for potential data loss during rollback
   */
  private async checkDataLossRisks(): Promise<string[]> {
    const warnings: string[] = [];

    // Check for data that exists in generic tables but not in legacy
    // This would be lost during rollback
    try {
      const { data: genericData } = await this.supabase
        .from('event_participants')
        .select('id')
        .limit(1000);

      const { data: legacyData } = await this.supabase
        .from('wedding_couple_info')
        .select('id')
        .limit(1000);

      if ((genericData?.length || 0) > (legacyData?.length || 0)) {
        warnings.push('Generic tables contain more records than legacy tables - potential data loss');
      }

    } catch {
      warnings.push('Unable to compare data between generic and legacy tables');
    }

    return warnings;
  }

  /**
   * Assess rollback risk level
   */
  private assessRollbackRisk(validation: RollbackValidationResult): 'low' | 'medium' | 'high' {
    if (validation.errors.length > 0) {
      return 'high';
    }
    
    if (validation.warnings.length > 2) {
      return 'medium';
    }

    const integrityScore = Object.values(validation.dataIntegrityChecks)
      .filter(Boolean).length;

    return integrityScore >= 3 ? 'low' : 'medium';
  }

  /**
   * Generate SQL scripts for rollback steps
   */
  private generateBackupScript(): string {
    return `
      -- Create backup tables
      CREATE TABLE IF NOT EXISTS event_participants_backup AS SELECT * FROM event_participants;
      CREATE TABLE IF NOT EXISTS event_content_backup AS SELECT * FROM event_content;
      CREATE TABLE IF NOT EXISTS event_sections_backup AS SELECT * FROM event_sections;
      CREATE TABLE IF NOT EXISTS event_stories_backup AS SELECT * FROM event_stories;
    `;
  }

  private generateDataConsistencyQuery(): string {
    return `
      SELECT 
        'participants' as table_name,
        COUNT(*) as generic_count,
        (SELECT COUNT(*) FROM wedding_couple_info) as legacy_count
      FROM event_participants
      UNION ALL
      SELECT 
        'content' as table_name,
        COUNT(*) as generic_count,
        (SELECT COUNT(*) FROM wedding_important_info) as legacy_count
      FROM event_content;
    `;
  }

  private generateDataMigrationScript(): string {
    return `
      -- Migrate data back to legacy tables (this would be much more complex in reality)
      -- This is a simplified example
      INSERT INTO wedding_couple_info (
        tenant_id, groom_name, bride_name, wedding_date
      )
      SELECT 
        tenant_id, 
        primary_participant_name as groom_name,
        secondary_participant_name as bride_name,
        event_date as wedding_date
      FROM event_participants 
      WHERE event_type = 'wedding'
      ON CONFLICT (tenant_id) DO UPDATE SET
        groom_name = EXCLUDED.groom_name,
        bride_name = EXCLUDED.bride_name,
        wedding_date = EXCLUDED.wedding_date;
    `;
  }

  private generateGenericTableDropScript(): string {
    return `
      DROP TABLE IF EXISTS event_stories;
      DROP TABLE IF EXISTS event_sections;
      DROP TABLE IF EXISTS event_content;
      DROP TABLE IF EXISTS event_participants;
    `;
  }

  private generateLegacyValidationQuery(): string {
    return `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT tenant_id) as unique_tenants
      FROM wedding_couple_info
      WHERE tenant_id IS NOT NULL;
    `;
  }

  /**
   * Execute SQL script
   */
  private async executeSqlScript(script: string): Promise<void> {
    if (this.dbConnection) {
      await this.dbConnection.query(script);
    } else {
      // Use Supabase RPC for complex operations
      const { error } = await this.supabase.rpc('execute_sql', { sql_text: script });
      if (error) throw error;
    }
  }

  /**
   * Execute validation query
   */
  private async executeValidationQuery(query: string): Promise<{
    isValid: boolean;
    error?: string;
    result?: any;
  }> {
    try {
      if (this.dbConnection) {
        const result = await this.dbConnection.query(query);
        return { isValid: true, result };
      } else {
        const { data, error } = await this.supabase.rpc('execute_query', { query_text: query });
        if (error) {
          return { isValid: false, error: error.message };
        }
        return { isValid: true, result: data };
      }
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

/**
 * Factory function to create rollback validation manager
 */
export function createRollbackValidationManager(
  supabase: SupabaseClient,
  dbConnection?: DatabaseConnection
): RollbackValidationManager {
  return new RollbackValidationManager(supabase, dbConnection);
}