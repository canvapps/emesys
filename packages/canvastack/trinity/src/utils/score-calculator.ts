/**
 * Score Calculator for Trinity Protocol
 * Handles Trinity score calculations and penalties
 */

import { TrinityScore } from '../types/trinity-types';
import { TRINITY_CONSTANTS } from '../constants/validation-constants';

export class ScoreCalculator {
  
  /**
   * Calculate test layer score
   */
  calculateTestScore(
    totalTestFiles: number,
    dependencyErrors: number,
    structureValid: boolean
  ): number {
    let score: number = TRINITY_CONSTANTS.PERFECT_SCORE;
    
    // Penalty for dependency errors
    score -= dependencyErrors * TRINITY_CONSTANTS.PENALTIES.MISSING_DEPENDENCY;
    
    // Penalty for invalid structure
    if (!structureValid) {
      score -= 20; // Structure penalty
    }
    
    // Minimum files requirement bonus/penalty
    if (totalTestFiles === 0) {
      score = 0; // No tests at all
    } else if (totalTestFiles < 3) {
      score -= 10; // Very few tests
    }
    
    return Math.max(0, Math.min(TRINITY_CONSTANTS.PERFECT_SCORE, score));
  }

  /**
   * Calculate implementation layer score
   */
  calculateImplementationScore(
    totalImplFiles: number,
    importErrors: number,
    missingUtilities: number
  ): number {
    let score: number = TRINITY_CONSTANTS.PERFECT_SCORE;
    
    // Penalty for import errors
    score -= importErrors * TRINITY_CONSTANTS.PENALTIES.BROKEN_IMPORT;
    
    // Penalty for missing utilities
    score -= missingUtilities * TRINITY_CONSTANTS.PENALTIES.CRITICAL_FILE_MISSING;
    
    // Implementation files requirement
    if (totalImplFiles === 0) {
      score = 0; // No implementation files
    }
    
    return Math.max(0, Math.min(TRINITY_CONSTANTS.PERFECT_SCORE, score));
  }

  /**
   * Calculate documentation layer score
   */
  calculateDocumentationScore(
    completenessScore: number,
    brokenLinks: number
  ): number {
    let score = completenessScore;
    
    // Penalty for broken links
    score -= brokenLinks * 5;
    
    return Math.max(0, Math.min(TRINITY_CONSTANTS.PERFECT_SCORE, score));
  }

  /**
   * Calculate overall Trinity score from layer scores
   */
  calculateOverallScore(layerScores: TrinityScore): number {
    const { test, implementation, documentation } = layerScores;
    const weights = TRINITY_CONSTANTS.LAYER_WEIGHTS;
    
    const totalWeight = weights.TEST + weights.IMPLEMENTATION + weights.DOCUMENTATION;
    const weightedSum = (
      test * weights.TEST +
      implementation * weights.IMPLEMENTATION +
      documentation * weights.DOCUMENTATION
    );
    
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Calculate score with custom weights
   */
  calculateWeightedScore(
    layerScores: TrinityScore,
    customWeights: { test: number; implementation: number; documentation: number }
  ): number {
    const { test, implementation, documentation } = layerScores;
    const totalWeight = customWeights.test + customWeights.implementation + customWeights.documentation;
    
    const weightedSum = (
      test * customWeights.test +
      implementation * customWeights.implementation +
      documentation * customWeights.documentation
    );
    
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Get score grade (A+, A, B, C, D, F)
   */
  getScoreGrade(score: number): string {
    if (score >= 98) return 'A+';
    if (score >= 95) return 'A';
    if (score >= 90) return 'B+';
    if (score >= 85) return 'B';
    if (score >= 80) return 'C+';
    if (score >= 75) return 'C';
    if (score >= 70) return 'D+';
    if (score >= 65) return 'D';
    return 'F';
  }

  /**
   * Check if score passes Trinity minimum requirements
   */
  isPassingScore(score: number, minimumScore: number = TRINITY_CONSTANTS.MIN_TRINITY_SCORE): boolean {
    return score >= minimumScore;
  }

  /**
   * Calculate score improvement needed to reach target
   */
  getScoreImprovement(
    currentScore: number,
    targetScore: number = TRINITY_CONSTANTS.MIN_TRINITY_SCORE
  ): number {
    return Math.max(0, targetScore - currentScore);
  }

  /**
   * Estimate fixes needed based on penalties
   */
  estimateFixesNeeded(currentScore: number, targetScore: number): {
    dependencyErrors: number;
    missingTests: number;
    missingDocs: number;
  } {
    const improvement = this.getScoreImprovement(currentScore, targetScore);
    
    return {
      dependencyErrors: Math.ceil(improvement / TRINITY_CONSTANTS.PENALTIES.MISSING_DEPENDENCY),
      missingTests: Math.ceil(improvement / TRINITY_CONSTANTS.PENALTIES.MISSING_TEST),
      missingDocs: Math.ceil(improvement / TRINITY_CONSTANTS.PENALTIES.MISSING_DOCUMENTATION)
    };
  }

  /**
   * Calculate penalty for specific error type
   */
  calculatePenalty(errorType: keyof typeof TRINITY_CONSTANTS.PENALTIES, count: number): number {
    return TRINITY_CONSTANTS.PENALTIES[errorType] * count;
  }

  /**
   * Get score color for console output
   */
  getScoreColor(score: number): string {
    if (score >= 95) return '\x1b[32m'; // Green
    if (score >= 90) return '\x1b[36m'; // Cyan
    if (score >= 80) return '\x1b[33m'; // Yellow
    if (score >= 70) return '\x1b[35m'; // Magenta
    return '\x1b[31m'; // Red
  }

  /**
   * Format score for display
   */
  formatScore(score: number, includeGrade: boolean = true): string {
    const grade = includeGrade ? ` (${this.getScoreGrade(score)})` : '';
    const color = this.getScoreColor(score);
    const reset = '\x1b[0m';
    
    return `${color}${score}%${grade}${reset}`;
  }

  /**
   * Calculate score breakdown by category
   */
  calculateScoreBreakdown(
    layerScores: TrinityScore,
    errors: { test: number; implementation: number; documentation: number },
    warnings: { test: number; implementation: number; documentation: number }
  ): {
    baseScore: TrinityScore;
    errorPenalties: TrinityScore;
    warningPenalties: TrinityScore;
    finalScore: TrinityScore;
  } {
    const baseScore: TrinityScore = {
      test: TRINITY_CONSTANTS.PERFECT_SCORE,
      implementation: TRINITY_CONSTANTS.PERFECT_SCORE,
      documentation: TRINITY_CONSTANTS.PERFECT_SCORE
    };

    const errorPenalties: TrinityScore = {
      test: errors.test * TRINITY_CONSTANTS.PENALTIES.MISSING_DEPENDENCY,
      implementation: errors.implementation * TRINITY_CONSTANTS.PENALTIES.BROKEN_IMPORT,
      documentation: errors.documentation * TRINITY_CONSTANTS.PENALTIES.MISSING_DOCUMENTATION
    };

    const warningPenalties: TrinityScore = {
      test: warnings.test * 2,
      implementation: warnings.implementation * 2,
      documentation: warnings.documentation * 2
    };

    const finalScore: TrinityScore = {
      test: Math.max(0, baseScore.test - errorPenalties.test - warningPenalties.test),
      implementation: Math.max(0, baseScore.implementation - errorPenalties.implementation - warningPenalties.implementation),
      documentation: Math.max(0, baseScore.documentation - errorPenalties.documentation - warningPenalties.documentation)
    };

    return {
      baseScore,
      errorPenalties,
      warningPenalties,
      finalScore
    };
  }

  /**
   * Calculate trend score (comparing with previous results)
   */
  calculateTrend(currentScore: TrinityScore, previousScore?: TrinityScore): {
    trend: 'improving' | 'declining' | 'stable';
    difference: number;
    layerTrends: {
      test: 'up' | 'down' | 'stable';
      implementation: 'up' | 'down' | 'stable';
      documentation: 'up' | 'down' | 'stable';
    };
  } {
    if (!previousScore) {
      return {
        trend: 'stable',
        difference: 0,
        layerTrends: {
          test: 'stable',
          implementation: 'stable',
          documentation: 'stable'
        }
      };
    }

    const currentOverall = this.calculateOverallScore(currentScore);
    const previousOverall = this.calculateOverallScore(previousScore);
    const difference = currentOverall - previousOverall;

    const getTrend = (diff: number) => {
      if (diff > 2) return 'up' as const;
      if (diff < -2) return 'down' as const;
      return 'stable' as const;
    };

    return {
      trend: difference > 2 ? 'improving' : difference < -2 ? 'declining' : 'stable',
      difference,
      layerTrends: {
        test: getTrend(currentScore.test - previousScore.test),
        implementation: getTrend(currentScore.implementation - previousScore.implementation),
        documentation: getTrend(currentScore.documentation - previousScore.documentation)
      }
    };
  }
}