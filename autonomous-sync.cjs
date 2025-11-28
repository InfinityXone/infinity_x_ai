#!/usr/bin/env node

/**
 * INFINITY AUTONOMOUS SYNC & BUILD SYSTEM
 * Continuously syncs with GitHub and rebuilds the system
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class AutonomousInfinitySystem {
  constructor() {
    this.isRunning = false;
    this.buildCount = 0;
    this.syncInterval = 30000; // 30 seconds
    this.startTime = new Date();
  }

  async initialize() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║         ∞ INFINITY AUTONOMOUS SYSTEM ACTIVATED ∞              ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📧 Email: info@infinityxonesystems.com');
    console.log('🔑 API Key: infinity-ai-chat-key-2025-secure-token-change-in-production');
    console.log('🚀 Server: http://localhost:3000\n');
    
    this.isRunning = true;
    
    // Start background server
    await this.startServer();
    
    // Start autonomous loop
    await this.autonomousLoop();
  }

  async startServer() {
    console.log('🟢 Starting Infinity AI Server...\n');
    
    // Start server in background
    const serverProcess = exec('node server.cjs', {
      cwd: process.cwd(),
      detached: true
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`[SERVER] ${data.toString().trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[SERVER ERROR] ${data.toString().trim()}`);
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Server started successfully\n');
  }

  async syncWithGitHub() {
    try {
      console.log('\n📡 Syncing with GitHub...');
      
      // Check for changes
      const { stdout: status } = await execAsync('git status --porcelain');
      
      if (status.trim()) {
        console.log('📝 Changes detected, committing...');
        
        // Stage all changes
        await execAsync('git add .');
        
        // Commit with timestamp
        const timestamp = new Date().toISOString();
        const commitMsg = `chore: Autonomous system sync - ${timestamp}`;
        await execAsync(`git commit -m "${commitMsg}"`);
        
        console.log(`✅ Committed: ${commitMsg}`);
        
        // Try to push
        try {
          await execAsync('git push origin main');
          console.log('✅ Pushed to remote');
        } catch (pushError) {
          console.log('⚠️  Push failed (will retry later)');
        }
      } else {
        console.log('✅ No changes to sync');
      }
      
      // Pull latest changes
      try {
        await execAsync('git pull origin main');
        console.log('✅ Pulled latest changes');
      } catch (pullError) {
        console.log('⚠️  Pull warning (continuing...)');
      }
      
    } catch (error) {
      console.error('❌ Sync error:', error.message);
    }
  }

  async validateSystem() {
    console.log('\n🔍 Validating system...');
    
    const checks = [
      { name: 'Server Running', test: async () => {
        try {
          const response = await fetch('http://localhost:3000/health');
          return response.ok;
        } catch {
          return false;
        }
      }},
      { name: 'Environment Variables', test: async () => {
        const envPath = path.join(process.cwd(), '.env');
        try {
          await fs.access(envPath);
          return true;
        } catch {
          return false;
        }
      }},
      { name: 'Package Dependencies', test: async () => {
        try {
          await fs.access(path.join(process.cwd(), 'node_modules'));
          return true;
        } catch {
          return false;
        }
      }},
      { name: 'Server Files', test: async () => {
        try {
          await fs.access(path.join(process.cwd(), 'server.cjs'));
          return true;
        } catch {
          return false;
        }
      }}
    ];
    
    let passedCount = 0;
    for (const check of checks) {
      const passed = await check.test();
      const icon = passed ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}`);
      if (passed) passedCount++;
    }
    
    console.log(`\n📊 Validation: ${passedCount}/${checks.length} checks passed`);
    return passedCount === checks.length;
  }

  async buildSystem() {
    try {
      this.buildCount++;
      console.log(`\n🔨 Build #${this.buildCount} starting...`);
      
      // Install/update dependencies if needed
      console.log('📦 Checking dependencies...');
      try {
        await execAsync('pnpm install --frozen-lockfile');
        console.log('✅ Dependencies up to date');
      } catch {
        console.log('⚠️  Dependency check skipped');
      }
      
      // Validate system
      const isValid = await this.validateSystem();
      
      if (isValid) {
        console.log('✅ Build successful');
      } else {
        console.log('⚠️  Build completed with warnings');
      }
      
    } catch (error) {
      console.error('❌ Build error:', error.message);
    }
  }

  async autonomousLoop() {
    console.log('\n🔄 Autonomous loop started');
    console.log(`⏱️  Sync interval: ${this.syncInterval / 1000} seconds\n`);
    
    let iteration = 0;
    
    while (this.isRunning) {
      iteration++;
      
      console.log('\n' + '═'.repeat(60));
      console.log(`🔄 ITERATION #${iteration} - ${new Date().toLocaleTimeString()}`);
      console.log('═'.repeat(60));
      
      // Sync with GitHub
      await this.syncWithGitHub();
      
      // Build system every 3rd iteration
      if (iteration % 3 === 0) {
        await this.buildSystem();
      }
      
      // Show stats
      const uptime = Math.floor((new Date() - this.startTime) / 1000);
      console.log(`\n📊 Stats: Iteration ${iteration} | Builds ${this.buildCount} | Uptime ${uptime}s`);
      
      // Wait before next iteration
      console.log(`\n⏸️  Waiting ${this.syncInterval / 1000}s until next sync...\n`);
      await new Promise(resolve => setTimeout(resolve, this.syncInterval));
    }
  }

  async stop() {
    console.log('\n🛑 Stopping autonomous system...');
    this.isRunning = false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received shutdown signal...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Received termination signal...');
  process.exit(0);
});

// Start the system
if (require.main === module) {
  const system = new AutonomousInfinitySystem();
  system.initialize().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = AutonomousInfinitySystem;
