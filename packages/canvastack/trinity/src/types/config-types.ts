/**
 * Configuration Types for Trinity Protocol
 */

export interface TrinityProjectConfig {
  projectName?: string;
  projectPath?: string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go';
  framework?: string;
  version?: string;
}

export interface TrinityValidationConfig {
  minTrinityScore: number;
  requireAllLayers: boolean;
  enforceTestCoverage: boolean;
  enforceDocumentation: boolean;
  strictMode: boolean;
}

export interface TrinityFilePatterns {
  testPatterns: string[];
  implementationPatterns: string[];
  documentationPatterns: string[];
  excludePatterns: string[];
}

export interface TrinityDirectories {
  testDir: string[];
  sourceDir: string[];
  docsDir: string[];
  excludeDirs: string[];
}

export interface TrinityScoring {
  testWeight: number;
  implementationWeight: number;
  documentationWeight: number;
  errorPenalty: number;
  warningPenalty: number;
}

export interface TrinityGitIntegration {
  preCommitValidation: boolean;
  prePushValidation: boolean;
  blockCommitOnFailure: boolean;
  blockPushOnFailure: boolean;
  generateCommitMessages: boolean;
}

export interface TrinityReporting {
  outputFormat: 'console' | 'json' | 'html' | 'xml';
  outputFile?: string;
  verboseLogging: boolean;
  includeWarnings: boolean;
  generateReports: boolean;
  reportDirectory?: string;
}

export interface TrinityExtensions {
  customValidators: string[];
  plugins: string[];
  hooks: {
    beforeValidation?: string[];
    afterValidation?: string[];
    onError?: string[];
  };
}

export interface TrinityFullConfig {
  project: TrinityProjectConfig;
  validation: TrinityValidationConfig;
  patterns: TrinityFilePatterns;
  directories: TrinityDirectories;
  scoring: TrinityScoring;
  git: TrinityGitIntegration;
  reporting: TrinityReporting;
  extensions?: TrinityExtensions;
}

export interface TrinityConfigDefaults {
  [key: string]: Partial<TrinityFullConfig>;
}