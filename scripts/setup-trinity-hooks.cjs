#!/usr/bin/env node

/**
 * Trinity Protocol Setup Script
 * Installs git hooks and configures Trinity Protocol validation system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOOKS_DIR = '.githooks';
const GIT_HOOKS_DIR = '.git/hooks';

class TrinitySetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.success = [];
    this.warnings = [];
    this.errors = [];
  }

  async setup() {
    console.log('🛡️  Trinity Protocol Setup Starting...\n');

    try {
      await this.checkPrerequisites();
      await this.configureGitHooks();
      await this.setupNPMScripts();
      await this.validateInstallation();
      
      this.showResults();
      return this.errors.length === 0;
    } catch (error) {
      console.error('❌ Trinity setup failed:', error.message);
      return false;
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      this.success.push('Git repository detected');
    } catch {
      this.errors.push('Not in a Git repository. Please run "git init" first.');
      return;
    }

    // Check if Node.js is available
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      this.success.push(`Node.js available: ${nodeVersion}`);
    } catch {
      this.errors.push('Node.js is required but not found');
    }

    // Check if npm is available
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.success.push(`NPM available: ${npmVersion}`);
    } catch {
      this.warnings.push('NPM not found - some features may not work');
    }

    // Check if Trinity validation script exists
    if (fs.existsSync('scripts/trinity-validation.js')) {
      this.success.push('Trinity validation script found');
    } else {
      this.errors.push('Trinity validation script missing: scripts/trinity-validation.js');
    }
  }

  async configureGitHooks() {
    console.log('\n⚙️  Configuring Git hooks...');

    // Ensure .git/hooks directory exists
    const gitHooksPath = path.join(this.projectRoot, GIT_HOOKS_DIR);
    if (!fs.existsSync(gitHooksPath)) {
      fs.mkdirSync(gitHooksPath, { recursive: true });
      this.success.push('Created .git/hooks directory');
    }

    // Copy and setup hooks
    const hooks = ['pre-commit', 'pre-push'];
    
    for (const hook of hooks) {
      const sourcePath = path.join(this.projectRoot, HOOKS_DIR, hook);
      const destPath = path.join(gitHooksPath, hook);
      
      if (fs.existsSync(sourcePath)) {
        try {
          // Copy hook file
          const content = fs.readFileSync(sourcePath, 'utf8');
          fs.writeFileSync(destPath, content);
          
          // Make executable (on Unix systems)
          if (process.platform !== 'win32') {
            fs.chmodSync(destPath, 0o755);
          }
          
          this.success.push(`Installed ${hook} hook`);
        } catch (error) {
          this.errors.push(`Failed to install ${hook} hook: ${error.message}`);
        }
      } else {
        this.errors.push(`Hook source not found: ${sourcePath}`);
      }
    }

    // Configure Git to use local hooks directory (optional)
    try {
      execSync(`git config core.hooksPath ${HOOKS_DIR}`, { stdio: 'pipe' });
      this.success.push('Configured Git to use .githooks directory');
    } catch {
      this.warnings.push('Could not configure Git hooks path - hooks copied to .git/hooks instead');
    }
  }

  async setupNPMScripts() {
    console.log('\n📦 Setting up NPM scripts...');

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.warnings.push('package.json not found - skipping NPM scripts setup');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add Trinity scripts if they don't exist
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      const trinityScripts = {
        'trinity:validate': 'node scripts/trinity-validation.js all',
        'trinity:pre-commit': 'node scripts/trinity-validation.js pre-commit',
        'trinity:pre-push': 'node scripts/trinity-validation.js pre-push',
        'trinity:mid-dev': 'node scripts/trinity-validation.js mid-dev',
        'trinity:setup': 'node scripts/setup-trinity-hooks.js'
      };

      let added = 0;
      for (const [script, command] of Object.entries(trinityScripts)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          added++;
        }
      }

      if (added > 0) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        this.success.push(`Added ${added} Trinity NPM scripts`);
      } else {
        this.success.push('Trinity NPM scripts already configured');
      }

    } catch (error) {
      this.errors.push(`Failed to setup NPM scripts: ${error.message}`);
    }
  }

  async validateInstallation() {
    console.log('\n✅ Validating installation...');

    // Test Trinity validation script
    try {
      execSync('node scripts/trinity-validation.js --help', { stdio: 'pipe' });
      this.success.push('Trinity validation script is executable');
    } catch {
      // Try running without --help (script might not support it)
      this.warnings.push('Trinity validation script found but could not test execution');
    }

    // Check hook permissions (Unix systems)
    if (process.platform !== 'win32') {
      const hooks = ['pre-commit', 'pre-push'];
      for (const hook of hooks) {
        const hookPath = path.join(this.projectRoot, GIT_HOOKS_DIR, hook);
        if (fs.existsSync(hookPath)) {
          const stats = fs.statSync(hookPath);
          const isExecutable = (stats.mode & parseInt('755', 8)) === parseInt('755', 8);
          
          if (isExecutable) {
            this.success.push(`${hook} hook is executable`);
          } else {
            this.warnings.push(`${hook} hook may not be executable`);
          }
        }
      }
    }

    // Test a simple validation
    try {
      const result = execSync('node scripts/trinity-validation.js mid-dev', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 30000 
      });
      this.success.push('Trinity validation test completed successfully');
    } catch (error) {
      this.warnings.push('Trinity validation test had issues - please check manually');
    }
  }

  showResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  TRINITY PROTOCOL SETUP RESULTS');
    console.log('='.repeat(60));

    if (this.success.length > 0) {
      console.log('\n✅ SUCCESS:');
      this.success.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (this.errors.length === 0) {
      console.log('🎉 Trinity Protocol setup completed successfully!');
      console.log('\nAvailable commands:');
      console.log('  npm run trinity:validate    # Full Trinity validation');
      console.log('  npm run trinity:mid-dev     # Development validation');
      console.log('  npm run trinity:pre-commit  # Pre-commit validation');
      console.log('  npm run trinity:pre-push    # Pre-push validation');
      console.log('\nGit hooks are now active and will run automatically.');
    } else {
      console.log('❌ Trinity Protocol setup completed with errors.');
      console.log('Please fix the errors above before using Trinity Protocol.');
    }

    console.log('='.repeat(60));
  }
}

// CLI Interface
async function main() {
  const setup = new TrinitySetup();
  const success = await setup.setup();
  
  process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = TrinitySetup;

// Run if called directly
if (require.main === module) {
  main();
}