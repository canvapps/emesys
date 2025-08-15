/**
 * Trinity Reporter
 * Generates and formats validation reports
 */

import * as fs from 'fs';
import * as path from 'path';
import { TrinityValidationResult, LayerValidationResult } from '../types/validation-result';
import { CLI_COLORS, VALIDATION_MESSAGES } from '../constants/validation-constants';

export class TrinityReporter {
  
  /**
   * Print console report
   */
  printConsoleReport(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    if (!result) {
      console.log('No validation result provided');
      return;
    }
    
    this.printHeader();
    this.printOverallStatus(result, options);
    this.printScoreBreakdown(result, options);
    this.printLayerDetails(result, options);
    this.printErrorsAndWarnings(result, options);
    this.printRecommendations(result, options);
    this.printFooter(result, options);
  }

  /**
   * Generate console report
   */
  generateConsoleReport(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    this.printConsoleReport(result, options);
  }


  /**
   * Generate JSON report
   */
  generateJSONReport(result: TrinityValidationResult): string {
    const jsonReport = {
      timestamp: result.metadata.timestamp,
      trinityVersion: result.metadata.trinityVersion,
      projectName: result.metadata.projectName,
      valid: result.valid,
      score: result.score,
      errors: result.errors,
      warnings: result.warnings,
      layers: result.layers,
      synchronization: result.synchronization,
      recommendations: result.recommendations,
      metadata: result.metadata
    };

    return JSON.stringify(jsonReport, null, 2);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(result: TrinityValidationResult): string {
    const overallScore = result.score.overall || 0;
    const status = result.valid ? 'PASS' : 'FAIL';
    const statusColor = result.valid ? '#28a745' : '#dc3545';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trinity Protocol Report - ${result.metadata.projectName}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .title { color: #333; margin-bottom: 10px; }
        .status { font-size: 1.5em; font-weight: bold; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .status.pass { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status.fail { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .score-card { text-align: center; padding: 20px; border-radius: 5px; }
        .score-card.test { background: #e3f2fd; border: 2px solid #2196f3; }
        .score-card.implementation { background: #f3e5f5; border: 2px solid #9c27b0; }
        .score-card.documentation { background: #e8f5e8; border: 2px solid #4caf50; }
        .score-card.overall { background: #fff3e0; border: 2px solid #ff9800; }
        .score-value { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .errors, .warnings { margin: 30px 0; }
        .error-item, .warning-item { padding: 10px; margin: 5px 0; border-left: 4px solid; }
        .error-item { background: #ffebee; border-color: #f44336; }
        .warning-item { background: #fff8e1; border-color: #ffc107; }
        .recommendations { margin: 30px 0; }
        .recommendation { background: #e8f4fd; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2196f3; }
        .metadata { margin: 30px 0; background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metadata-item { display: flex; justify-content: space-between; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🛡️ Trinity Protocol Report</h1>
            <h2>${result.metadata.projectName}</h2>
            <div class="status ${status.toLowerCase()}" style="color: ${statusColor};">
                Status: ${status} | Overall Score: ${overallScore}%
            </div>
        </div>

        <div class="score-grid">
            <div class="score-card test">
                <h3>🧪 Test Layer</h3>
                <div class="score-value">${result.score.test}%</div>
                <p>${result.layers.test.details.totalFiles} files</p>
            </div>
            <div class="score-card implementation">
                <h3>⚙️ Implementation</h3>
                <div class="score-value">${result.score.implementation}%</div>
                <p>${result.layers.implementation.details.totalFiles} files</p>
            </div>
            <div class="score-card documentation">
                <h3>📚 Documentation</h3>
                <div class="score-value">${result.score.documentation}%</div>
                <p>${result.layers.documentation.details.totalFiles} files</p>
            </div>
            <div class="score-card overall">
                <h3>🎯 Overall Trinity</h3>
                <div class="score-value">${overallScore}%</div>
                <p>${result.errors.length} errors, ${result.warnings.length} warnings</p>
            </div>
        </div>

        ${result.errors.length > 0 ? `
        <div class="errors">
            <h3>❌ Errors (${result.errors.length})</h3>
            ${result.errors.map(error => `
                <div class="error-item">
                    <strong>${error.category}:</strong> ${error.message}
                    ${error.file ? `<br><small>File: ${error.file}</small>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${result.warnings.length > 0 ? `
        <div class="warnings">
            <h3>⚠️ Warnings (${result.warnings.length})</h3>
            ${result.warnings.map(warning => `
                <div class="warning-item">
                    <strong>${warning.category}:</strong> ${warning.message}
                    ${warning.file ? `<br><small>File: ${warning.file}</small>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${result.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            ${result.recommendations.map(rec => `
                <div class="recommendation">${rec}</div>
            `).join('')}
        </div>
        ` : ''}

        <div class="metadata">
            <h3>📋 Report Metadata</h3>
            <div class="metadata-item">
                <span><strong>Generated:</strong></span>
                <span>${new Date(result.metadata.timestamp).toLocaleString()}</span>
            </div>
            <div class="metadata-item">
                <span><strong>Trinity Version:</strong></span>
                <span>${result.metadata.trinityVersion}</span>
            </div>
            <div class="metadata-item">
                <span><strong>Execution Time:</strong></span>
                <span>${result.metadata.executionTime}ms</span>
            </div>
            <div class="metadata-item">
                <span><strong>Total Files Analyzed:</strong></span>
                <span>${result.metadata.totalFiles}</span>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Save report to file
   */
  saveReport(
    content: string, 
    outputPath: string, 
    format: 'json' | 'html' | 'txt' = 'json'
  ): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Report saved to: ${outputPath}`);
  }

  /**
   * Print header
   */
  private printHeader(): void {
    console.log('='.repeat(60));
    console.log('🛡️  TRINITY PROTOCOL VALIDATION REPORT');
    console.log('='.repeat(60));
  }

  /**
   * Print overall status
   */
  private printOverallStatus(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    if (!result || !result.score) {
      console.log('Invalid validation result');
      return;
    }
    
    const overallScore = result.score.overall || 0;
    const status = result.valid ? '✅ PASS' : '❌ FAIL';
    const color = result.valid ? CLI_COLORS.SUCCESS : CLI_COLORS.ERROR;

    console.log(`\n📊 OVERALL STATUS: ${color}${status}${CLI_COLORS.RESET}`);
    console.log(`🎯 Trinity Score: ${this.colorizeScore(overallScore)}% (Required: ≥90%)`);
  }

  /**
   * Print score breakdown
   */
  private printScoreBreakdown(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    console.log('\n📊 TRINITY SCORE BREAKDOWN:');
    console.log(`   🧪 Test Layer:          ${this.colorizeScore(result.score.test)}%`);
    console.log(`   ⚙️  Implementation:     ${this.colorizeScore(result.score.implementation)}%`);  
    console.log(`   📚 Documentation:       ${this.colorizeScore(result.score.documentation)}%`);
    console.log(`   🎯 Overall Trinity:     ${this.colorizeScore(result.score.overall || 0)}%`);
  }

  /**
   * Print layer details
   */
  private printLayerDetails(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    console.log('\n📋 LAYER DETAILS:');
    
    Object.values(result.layers).forEach(layer => {
      const icon = this.getLayerIcon(layer.layer);
      console.log(`\n${icon} ${layer.layer.toUpperCase()} LAYER:`);
      console.log(`   Files: ${layer.details.totalFiles}`);
      console.log(`   Errors: ${layer.details.errorCount}`);
      console.log(`   Warnings: ${layer.details.warningCount}`);
    });
  }

  /**
   * Print errors and warnings
   */
  private printErrorsAndWarnings(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    if (result.errors.length > 0) {
      console.log(`\n❌ ERRORS (${result.errors.length}):`);
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
        if (error.file) {
          console.log(`      File: ${error.file}`);
        }
      });
    }
    
    if (result.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${result.warnings.length}):`);
      result.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning.message}`);
        if (warning.file) {
          console.log(`      File: ${warning.file}`);
        }
      });
    }
  }

  /**
   * Print recommendations
   */
  private printRecommendations(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    if (result.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      result.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
  }

  /**
   * Print footer
   */
  private printFooter(result: TrinityValidationResult, options: { compact?: boolean, verbose?: boolean, mode?: string } = {}): void {
    if (result.valid) {
      console.log(`\n${CLI_COLORS.SUCCESS}✅ Trinity validation passed! Ready to proceed.${CLI_COLORS.RESET}`);
    } else {
      console.log(`\n${CLI_COLORS.ERROR}❌ Trinity validation failed! Please fix issues above.${CLI_COLORS.RESET}`);
    }
    
    console.log('='.repeat(60));
    console.log(`Generated: ${new Date(result.metadata.timestamp).toLocaleString()}`);
    console.log(`Execution Time: ${result.metadata.executionTime}ms`);
    console.log(`Trinity Version: ${result.metadata.trinityVersion}`);
  }

  /**
   * Colorize score based on value
   */
  private colorizeScore(score: number): string {
    let color: string = CLI_COLORS.ERROR; // Red for low scores
    
    if (score >= 95) color = CLI_COLORS.SUCCESS; // Green for excellent
    else if (score >= 90) color = CLI_COLORS.INFO; // Cyan for good
    else if (score >= 80) color = CLI_COLORS.WARNING; // Yellow for acceptable
    
    return `${color}${score}${CLI_COLORS.RESET}`;
  }

  /**
   * Get icon for layer type
   */
  private getLayerIcon(layer: string): string {
    switch (layer) {
      case 'test': return '🧪';
      case 'implementation': return '⚙️';
      case 'documentation': return '📚';
      default: return '📋';
    }
  }

  /**
   * Generate summary report for multiple projects
   */
  generateSummaryReport(results: TrinityValidationResult[]): string {
    const summary = {
      totalProjects: results.length,
      passingProjects: results.filter(r => r.valid).length,
      averageScore: Math.round(results.reduce((sum, r) => sum + (r.score.overall || 0), 0) / results.length),
      totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
      projects: results.map(r => ({
        name: r.metadata.projectName,
        valid: r.valid,
        score: r.score.overall || 0,
        errors: r.errors.length,
        warnings: r.warnings.length
      }))
    };

    return JSON.stringify(summary, null, 2);
  }

  /**
   * Generate trend report (comparing with historical data)
   */
  generateTrendReport(current: TrinityValidationResult, previous: TrinityValidationResult[]): string {
    // Simple trend analysis - in production this would be more sophisticated
    const trends = {
      current: {
        score: current.score.overall || 0,
        errors: current.errors.length,
        warnings: current.warnings.length,
        timestamp: current.metadata.timestamp
      },
      trend: 'stable', // This would calculate actual trends
      improvements: [] as string[],
      regressions: [] as string[]
    };

    return JSON.stringify(trends, null, 2);
  }
}