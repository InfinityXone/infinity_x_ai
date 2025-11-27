import { JarvisAIEngine } from '../ai/engine.ts';
import fs from 'fs/promises';

/**
 * Autonomous Code Enhancer
 * Continuously improves code quality, performance, and features
 */
export class AutoEnhancer {
  private ai: JarvisAIEngine;
  private enhancementHistory: EnhancementEntry[];

  constructor() {
    this.ai = new JarvisAIEngine();
    this.enhancementHistory = [];
  }

  async enhanceFile(filePath: string, enhancementType: EnhancementType = 'all'): Promise<EnhancementResult> {
    console.log(`✨ Auto-enhancing: ${filePath} (${enhancementType})`);

    try {
      const code = await fs.readFile(filePath, 'utf-8');

      const enhancementPrompts = {
        performance: 'Optimize for performance: reduce complexity, improve algorithms, add caching',
        readability: 'Improve readability: better naming, comments, structure',
        features: 'Add missing features: error handling, edge cases, accessibility',
        security: 'Enhance security: input validation, sanitization, safe practices',
        all: 'Comprehensively enhance: performance, readability, features, and security'
      };

      const prompt = `Enhance this code:

${code}

Focus: ${enhancementPrompts[enhancementType]}

Requirements:
1. Maintain all existing functionality
2. Add improvements incrementally
3. Include JSDoc comments
4. Use modern best practices
5. Ensure type safety

Return the COMPLETE enhanced code. No explanations.`;

      const enhanced = await this.ai.think(prompt);
      
      const codeMatch = enhanced.match(/```(?:tsx?|typescript|javascript)?\n([\s\S]*?)\n```/);
      const enhancedCode = codeMatch ? codeMatch[1] : enhanced;

      // Backup original
      await fs.writeFile(`${filePath}.pre-enhance`, code, 'utf-8');
      
      // Apply enhancement
      await fs.writeFile(filePath, enhancedCode, 'utf-8');

      const entry: EnhancementEntry = {
        filePath,
        enhancementType,
        timestamp: new Date().toISOString(),
        improvements: this.detectImprovements(code, enhancedCode)
      };

      this.enhancementHistory.push(entry);

      console.log(`✅ Enhanced: ${entry.improvements.length} improvements`);

      return {
        success: true,
        improvements: entry.improvements,
        filePath
      };
    } catch (error: any) {
      console.error(`❌ Enhancement error: ${error.message}`);
      return {
        success: false,
        improvements: [],
        filePath
      };
    }
  }

  private detectImprovements(oldCode: string, newCode: string): string[] {
    const improvements: string[] = [];
    
    if (newCode.length > oldCode.length * 1.1) {
      improvements.push('Added comprehensive documentation');
    }
    if (newCode.includes('try') && !oldCode.includes('try')) {
      improvements.push('Added error handling');
    }
    if (newCode.includes('interface') && !oldCode.includes('interface')) {
      improvements.push('Added type definitions');
    }
    if (newCode.includes('async') && !oldCode.includes('async')) {
      improvements.push('Converted to async/await');
    }
    if (newCode.includes('cache') || newCode.includes('memo')) {
      improvements.push('Added performance optimizations');
    }

    return improvements.length > 0 ? improvements : ['Code enhanced'];
  }

  async enhanceProject(enhancementType: EnhancementType = 'all'): Promise<ProjectEnhancement> {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log(`║              ✨ AUTO PROJECT ENHANCEMENT (${enhancementType.toUpperCase()})         ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let totalFiles = 0;
    let enhancedFiles = 0;
    const allImprovements: string[] = [];

    const dirs = ['frontend/src/components', 'backend/routes', 'backend/api'];

    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const result = await this.enhanceFile(`${dir}/${file}`, enhancementType);
            totalFiles++;
            if (result.success) {
              enhancedFiles++;
              allImprovements.push(...result.improvements);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (e) {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }

    console.log('\n📊 ENHANCEMENT SUMMARY:');
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Files enhanced: ${enhancedFiles}`);
    console.log(`   Total improvements: ${allImprovements.length}\n`);

    return {
      totalFiles,
      enhancedFiles,
      improvements: allImprovements,
      timestamp: new Date().toISOString()
    };
  }

  getHistory(): EnhancementEntry[] {
    return this.enhancementHistory;
  }
}

export type EnhancementType = 'performance' | 'readability' | 'features' | 'security' | 'all';

export interface EnhancementResult {
  success: boolean;
  improvements: string[];
  filePath: string;
}

export interface ProjectEnhancement {
  totalFiles: number;
  enhancedFiles: number;
  improvements: string[];
  timestamp: string;
}

interface EnhancementEntry {
  filePath: string;
  enhancementType: EnhancementType;
  timestamp: string;
  improvements: string[];
}
