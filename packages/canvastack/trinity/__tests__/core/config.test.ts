import { describe, it, expect, beforeEach } from '@jest/globals';
import * as path from 'path';
import { TrinityConfig } from '../../src/core/config';

describe('TrinityConfig', () => {
  let config: TrinityConfig;
  const projectRoot = path.join(__dirname, 'test-project');

  beforeEach(() => {
    config = new TrinityConfig(projectRoot);
  });

  describe('constructor', () => {
    it('should create a valid config instance with defaults', () => {
      const fullConfig = config.getConfig();
      expect(fullConfig.project.projectPath).toBe(projectRoot);
      expect(fullConfig.validation.minTrinityScore).toBe(90);
      expect(fullConfig.project.language).toBe('typescript');
    });
  });

  describe('validation', () => {
    it('should validate configuration', () => {
      const result = config.validateConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configurations', () => {
      config.updateConfig({
        validation: {
          minTrinityScore: 101,
          requireAllLayers: true,
          enforceTestCoverage: true,
          enforceDocumentation: true,
          strictMode: false
        }
      });
      const result = config.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minimum Trinity score must be between 0 and 100');
    });
  });

  describe('auto-detection', () => {
    it('should auto-detect project characteristics', () => {
      config.autoDetectProject();
      const projectInfo = config.getProjectInfo();
      expect(projectInfo.language).toBeDefined();
      expect(projectInfo.framework).toBeDefined();
      expect(projectInfo.type).toBeDefined();
    });
  });

  describe('configuration management', () => {
    it('should update configuration correctly', () => {
      config.updateConfig({
        validation: {
          minTrinityScore: 95,
          requireAllLayers: true,
          enforceTestCoverage: true,
          enforceDocumentation: true,
          strictMode: false
        }
      });
      expect(config.getValidationConfig().minTrinityScore).toBe(95);
    });

    it('should provide access to specific config sections', () => {
      expect(config.getProjectConfig()).toBeDefined();
      expect(config.getValidationConfig()).toBeDefined();
      expect(config.getFilePatterns()).toBeDefined();
      expect(config.getDirectories()).toBeDefined();
      expect(config.getScoringConfig()).toBeDefined();
      expect(config.getGitConfig()).toBeDefined();
      expect(config.getReportingConfig()).toBeDefined();
    });
  });

  describe('template handling', () => {
    it('should initialize with typescript template', async () => {
      // Create directory first
      const fs = require('fs');
      if (!fs.existsSync(projectRoot)) {
        fs.mkdirSync(projectRoot, { recursive: true });
      }
      
      await config.initialize({
        template: 'typescript',
        projectPath: projectRoot
      });
      
      const fullConfig = config.getConfig();
      expect(fullConfig.project.language).toBe('typescript');
      expect(fullConfig.patterns.testPatterns).toContain('**/*.test.ts');
      
      // Clean up
      if (fs.existsSync(path.join(projectRoot, 'trinity.config.js'))) {
        fs.unlinkSync(path.join(projectRoot, 'trinity.config.js'));
      }
    });

    it('should initialize with react template', async () => {
      // Create directory first
      const fs = require('fs');
      if (!fs.existsSync(projectRoot)) {
        fs.mkdirSync(projectRoot, { recursive: true });
      }
      
      await config.initialize({
        template: 'react',
        projectPath: projectRoot
      });
      
      const fullConfig = config.getConfig();
      expect(fullConfig.project.framework).toBe('react');
      expect(fullConfig.patterns.testPatterns).toContain('**/*.test.{ts,tsx,js,jsx}');
      
      // Clean up
      if (fs.existsSync(path.join(projectRoot, 'trinity.config.js'))) {
        fs.unlinkSync(path.join(projectRoot, 'trinity.config.js'));
      }
    });
  });
});
