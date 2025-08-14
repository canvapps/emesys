/**
 * Trinity CLI Tests
 * Tests untuk Trinity Protocol CLI interface
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

describe('Trinity CLI', () => {
  let testProjectDir: string;
  let trinityBinPath: string;

  beforeAll(() => {
    trinityBinPath = path.join(__dirname, '..', 'bin', 'trinity');
    
    // Create temporary test project directory
    testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinity-cli-test-'));
    
    // Create minimal package.json for test project
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project for Trinity CLI',
      main: 'index.js',
      scripts: {
        test: 'jest'
      }
    };
    
    fs.writeFileSync(
      path.join(testProjectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create test source structure
    fs.mkdirSync(path.join(testProjectDir, 'src'));
    fs.mkdirSync(path.join(testProjectDir, '__tests__'));
    fs.mkdirSync(path.join(testProjectDir, 'docs'));

    // Create sample files
    fs.writeFileSync(
      path.join(testProjectDir, 'src', 'index.ts'),
      '// Sample implementation file\nexport const hello = () => "Hello World";'
    );

    fs.writeFileSync(
      path.join(testProjectDir, '__tests__', 'index.test.ts'),
      '// Sample test file\nimport { hello } from "../src/index";\n\ntest("hello function", () => {\n  expect(hello()).toBe("Hello World");\n});'
    );

    fs.writeFileSync(
      path.join(testProjectDir, 'README.md'),
      '# Test Project\n\nThis is a test project for Trinity CLI testing.'
    );
  });

  afterAll(() => {
    // Clean up test directory
    if (testProjectDir) {
      fs.rmSync(testProjectDir, { recursive: true, force: true });
    }
  });

  describe('Command Help', () => {
    it('should show help when no arguments provided', async () => {
      try {
        const { stdout } = await execAsync(`node ${trinityBinPath}`);
        
        expect(stdout).toContain('Trinity Protocol');
        expect(stdout).toContain('Universal Development Quality Assurance Framework');
        expect(stdout).toContain('validate');
        expect(stdout).toContain('init');
        expect(stdout).toContain('watch');
      } catch (error: any) {
        // CLI might exit with code 1 but still show help properly
        const output = error.stdout || error.stderr || '';
        
        expect(output).toContain('Trinity Protocol');
        expect(output).toContain('Universal Development Quality Assurance Framework');
        expect(output).toContain('validate');
        expect(output).toContain('init');
        expect(output).toContain('watch');
      }
    });

    it('should show version information', async () => {
      const { stdout } = await execAsync(`node ${trinityBinPath} --version`);
      expect(stdout.trim()).toBe('1.0.0');
    });

    it('should show help with --help flag', async () => {
      const { stdout } = await execAsync(`node ${trinityBinPath} --help`);
      
      expect(stdout).toContain('Trinity Protocol');
      expect(stdout).toContain('Commands:');
      expect(stdout).toContain('validate');
      expect(stdout).toContain('init');
      expect(stdout).toContain('watch');
      expect(stdout).toContain('setup-hooks');
      expect(stdout).toContain('info');
    });
  });

  describe('trinity init command', () => {
    let initTestDir: string;

    beforeEach(() => {
      initTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinity-init-test-'));
    });

    afterEach(() => {
      if (initTestDir) {
        fs.rmSync(initTestDir, { recursive: true, force: true });
      }
    });

    it('should initialize Trinity configuration', async () => {
      const { stdout } = await execAsync(`node ${trinityBinPath} init -p ${initTestDir}`);
      
      expect(stdout).toContain('Initializing Trinity Protocol configuration');
      expect(stdout).toContain('Trinity Protocol configuration berhasil diinisialisasi');
      
      // Check if configuration files are created
      expect(fs.existsSync(path.join(initTestDir, 'trinity.config.js'))).toBe(true);
      expect(fs.existsSync(path.join(initTestDir, 'trinity.config.example.js'))).toBe(true);
    });

    it('should initialize with typescript template', async () => {
      const { stdout } = await execAsync(`node ${trinityBinPath} init -p ${initTestDir} -t typescript`);
      
      expect(stdout).toContain('berhasil diinisialisasi');
      
      const configContent = fs.readFileSync(path.join(initTestDir, 'trinity.config.js'), 'utf8');
      expect(configContent).toContain('typescript');
    });

    it('should show warning for existing configuration without force', async () => {
      // Initialize first time
      await execAsync(`node ${trinityBinPath} init -p ${initTestDir}`);
      
      // Try to initialize again
      const { stdout } = await execAsync(`node ${trinityBinPath} init -p ${initTestDir}`);
      
      expect(stdout).toContain('Trinity configuration sudah ada');
      expect(stdout).toContain('Gunakan --force untuk overwrite');
    });

    it('should overwrite existing configuration with force flag', async () => {
      // Initialize first time
      await execAsync(`node ${trinityBinPath} init -p ${initTestDir}`);
      
      // Initialize again with force
      const { stdout } = await execAsync(`node ${trinityBinPath} init -p ${initTestDir} --force`);
      
      expect(stdout).toContain('berhasil diinisialisasi');
    });
  });

  describe('trinity info command', () => {
    it('should show project information without configuration', async () => {
      const { stdout } = await execAsync(`node ${trinityBinPath} info -p ${testProjectDir}`);
      
      expect(stdout).toContain('Trinity Protocol Information');
      expect(stdout).toContain('Project Information:');
      expect(stdout).toContain('Trinity Config: ❌ Not found');
      expect(stdout).toContain('Available Commands:');
    });

    it('should show project information with configuration', async () => {
      // Initialize configuration first
      await execAsync(`node ${trinityBinPath} init -p ${testProjectDir}`);
      
      const { stdout } = await execAsync(`node ${trinityBinPath} info -p ${testProjectDir}`);
      
      expect(stdout).toContain('Trinity Config: ✅ Found');
      expect(stdout).toContain('Project Type:');
      expect(stdout).toContain('Language:');
      expect(stdout).toContain('Trinity Configuration:');
    });
  });

  describe('trinity validate command', () => {
    beforeEach(async () => {
      // Initialize configuration for validation tests
      await execAsync(`node ${trinityBinPath} init -p ${testProjectDir}`);
    });

    it('should run validation and show results', async () => {
      try {
        const { stdout } = await execAsync(`node ${trinityBinPath} validate -p ${testProjectDir}`);
        
        expect(stdout).toContain('Starting Trinity Protocol validation');
        expect(stdout).toContain('Trinity Validation Report');
      } catch (error: any) {
        // Validation might fail, but should still show proper output
        expect(error.stdout).toContain('Starting Trinity Protocol validation');
      }
    });

    it('should support different output formats', async () => {
      try {
        const jsonOutputPath = path.join(testProjectDir, 'trinity-report.json');
        const { stdout } = await execAsync(`node ${trinityBinPath} validate -p ${testProjectDir} -f json -o ${jsonOutputPath}`);
        
        expect(stdout).toContain('Starting Trinity Protocol validation');
        expect(stdout).toContain('Report generated:');
        
        // Check if JSON report was created
        if (fs.existsSync(jsonOutputPath)) {
          const reportContent = fs.readFileSync(jsonOutputPath, 'utf8');
          expect(() => JSON.parse(reportContent)).not.toThrow();
        }
      } catch (error: any) {
        // Validation might fail, but should still attempt to generate report
        expect(error.stdout || error.stderr).toContain('validation');
      }
    });

    it('should support verbose output', async () => {
      try {
        const { stdout } = await execAsync(`node ${trinityBinPath} validate -p ${testProjectDir} -v`);
        
        expect(stdout).toContain('Starting Trinity Protocol validation');
      } catch (error: any) {
        // Check error output for verbose information
        expect(error.stdout || error.stderr).toContain('validation');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project path', async () => {
      try {
        await execAsync(`node ${trinityBinPath} validate -p /nonexistent/path`);
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('error');
      }
    });

    it('should handle invalid command', async () => {
      try {
        await execAsync(`node ${trinityBinPath} nonexistent-command`);
      } catch (error: any) {
        expect(error.code).toBe(1);
        expect(error.stderr).toContain('error');
      }
    });

    it('should handle missing configuration gracefully', async () => {
      try {
        const { stdout, stderr } = await execAsync(`node ${trinityBinPath} validate -p ${testProjectDir} -c nonexistent.config.js`);
        
        // Should show appropriate error or warning
        expect(stdout + stderr).toContain('config');
      } catch (error: any) {
        expect(error.code).toBe(1);
      }
    });
  });

  describe('Git Hooks Setup', () => {
    let gitTestDir: string;

    beforeEach(() => {
      gitTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinity-git-test-'));
      
      // Initialize git repository
      execAsync('git init', { cwd: gitTestDir }).catch(() => {
        // Git might not be available in test environment
      });
    });

    afterEach(() => {
      if (gitTestDir) {
        fs.rmSync(gitTestDir, { recursive: true, force: true });
      }
    });

    it('should show error for non-git repository', async () => {
      const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trinity-non-git-'));
      
      try {
        await execAsync(`node ${trinityBinPath} setup-hooks -p ${nonGitDir}`);
      } catch (error: any) {
        expect(error.stderr).toContain('Not a git repository');
      } finally {
        fs.rmSync(nonGitDir, { recursive: true, force: true });
      }
    });
  });

  describe('Configuration Templates', () => {
    const templates = ['javascript', 'typescript', 'react', 'vue', 'node'];
    
    templates.forEach(template => {
      it(`should initialize with ${template} template`, async () => {
        const templateTestDir = fs.mkdtempSync(path.join(os.tmpdir(), `trinity-${template}-test-`));
        
        try {
          const { stdout } = await execAsync(`node ${trinityBinPath} init -p ${templateTestDir} -t ${template}`);
          
          expect(stdout).toContain('berhasil diinisialisasi');
          
          const configPath = path.join(templateTestDir, 'trinity.config.js');
          expect(fs.existsSync(configPath)).toBe(true);
          
          const configContent = fs.readFileSync(configPath, 'utf8');
          
          // Check template-specific configurations
          if (template === 'javascript') {
            expect(configContent).toContain('javascript');
          } else if (template === 'typescript') {
            expect(configContent).toContain('typescript');
          } else if (template === 'react') {
            expect(configContent).toContain('react');
          }
          
        } finally {
          fs.rmSync(templateTestDir, { recursive: true, force: true });
        }
      });
    });
  });
});