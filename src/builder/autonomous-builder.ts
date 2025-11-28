import { JarvisAIEngine } from '../ai/engine.ts';
import { MemoryManager } from '../ai/memory/memory-manager.ts';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class AutonomousSystemBuilder {
  private aiEngine: JarvisAIEngine;
  private memory: MemoryManager;
  private isActive = false;
  private buildQueue: string[] = [];

  constructor() {
    this.aiEngine = new JarvisAIEngine();
    this.memory = new MemoryManager();
    console.log('🏗️  Autonomous System Builder initialized');
  }

  async start() {
    this.isActive = true;
    console.log('✅ Autonomous Builder ACTIVATED');
    console.log('🤖 I can now build features autonomously!');
    console.log('');
    console.log('📋 Available commands:');
    console.log('   - build <feature>: Build a new feature');
    console.log('   - analyze: Analyze current codebase');
    console.log('   - optimize: Optimize existing code');
    console.log('   - commit: Auto-commit all changes');
    console.log('');
  }

  async buildFeature(description: string): Promise<void> {
    console.log(
🏗️  Building feature: \\);
    
    try {
      // Step 1: Plan the feature
      const plan = await this.aiEngine.think(
        \Create a detailed implementation plan for: \\,
        'You are an expert software architect. Provide a step-by-step plan.'
      );
      
      console.log('\n📋 Implementation Plan:');
      console.log(plan);
      console.log('');

      // Step 2: Generate code
      const code = await this.aiEngine.think(
        \Generate TypeScript code for: \\,
        \Implementation plan: \\
      );

      console.log('💻 Code Generated:');
      console.log(code);
      console.log('');

      // Step 3: Save to memory
      await this.memory.saveToLongTerm(\eature_\\, {
        description,
        plan,
        code,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Feature built and saved to memory!');
      
    } catch (error: any) {
      console.error('❌ Build failed:', error.message);
    }
  }

  async analyzeCodebase(): Promise<void> {
    console.log('\n🔍 Analyzing codebase...');
    
    try {
      const srcFiles = await this.getAllFiles('src');
      console.log(
📊 Found \ files\);
      
      for (const file of srcFiles.slice(0, 5)) {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n').length;
        console.log(\   📄 \src/autonomous/agent.ts: \ lines\);
      }

      const analysis = await this.aiEngine.think(
        'Analyze this codebase structure and suggest improvements',
        \Files: \\
      );

      console.log('\n💡 Analysis:');
      console.log(analysis);
      
    } catch (error: any) {
      console.error('❌ Analysis failed:', error.message);
    }
  }

  async autoCommit(message?: string): Promise<void> {
    console.log('\n📤 Auto-committing changes...');
    
    try {
      await execAsync('git add .');
      const commitMsg = message || \Auto-commit: \\;
      await execAsync(\git commit -m "\"\);
      console.log('✅ Changes committed!');
      
      // Try to push if remote exists
      try {
        await execAsync('git push');
        console.log('✅ Pushed to remote repository!');
      } catch {
        console.log('⚠️  No remote repository configured');
      }
      
    } catch (error: any) {
      console.error('❌ Commit failed:', error.message);
    }
  }

  async createFile(filePath: string, content: string): Promise<void> {
    console.log(
📝 Creating file: \\);
    
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      console.log('✅ File created successfully!');
      
      // Auto-commit the new file
      await this.autoCommit(\Created \\);
      
    } catch (error: any) {
      console.error('❌ File creation failed:', error.message);
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          files.push(...await this.getAllFiles(fullPath));
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch {}
    
    return files;
  }

  stop() {
    this.isActive = false;
    console.log('⏸️  Autonomous Builder DEACTIVATED');
  }

  getStatus() {
    return {
      isActive: this.isActive,
      queueLength: this.buildQueue.length,
    };
  }
}
