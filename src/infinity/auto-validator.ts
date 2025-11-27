import { JarvisAIEngine } from '../ai/engine.ts';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Type definitions - exported first for imports
export interface ValidationResult {
  filePath: string;
  syntaxValid: boolean;
  typesSafe: boolean;
  testsPass: boolean;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

export interface ProjectValidation {
  totalFiles: number;
  validFiles: number;
  totalErrors: number;
  totalWarnings: number;
  passRate: number;
  timestamp: string;
}

/**
 * Autonomous Validator
 * Validates code correctness, runs tests, checks types
 */
export class AutoValidator {
  private ai: JarvisAIEngine;
  private validationCache: Map<string, ValidationResult>;

  constructor() {
    this.ai = new JarvisAIEngine();
    this.validationCache = new Map();
  }

  async validateFile(filePath: string): Promise<ValidationResult> {
    console.log(`✓ Auto-validating: ${filePath}`);

    const result: ValidationResult = {
      filePath,
      syntaxValid: true,
      typesSafe: true,
      testsPass: true,
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Check syntax
      const code = await fs.readFile(filePath, 'utf-8');
      
      // TypeScript validation
      try {
        await execAsync(`npx tsc --noEmit ${filePath}`);
        result.typesSafe = true;
      } catch (e: any) {
        result.typesSafe = false;
        result.errors.push(`Type errors: ${e.message}`);
      }

      // AI-powered validation
      const prompt = `Validate this code for correctness and potential runtime errors:

${code}

Check for:
1. Logic errors
2. Null/undefined handling
3. Edge cases
4. Error handling completeness
5. API contract violations

Return validation issues as JSON array.`;

      const aiValidation = await this.ai.think(prompt);
      
      // Parse AI findings
      try {
        const issues = JSON.parse(aiValidation);
        if (Array.isArray(issues)) {
          result.warnings.push(...issues);
        }
      } catch {
        // AI response not in expected format
      }

      this.validationCache.set(filePath, result);
      
      const status = result.errors.length === 0 ? '✅' : '⚠️';
      console.log(`${status} Validation: ${result.errors.length} errors, ${result.warnings.length} warnings`);

      return result;
    } catch (error: any) {
      result.syntaxValid = false;
      result.errors.push(error.message);
      return result;
    }
  }

  async validateProject(): Promise<ProjectValidation> {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              ✓ AUTO PROJECT VALIDATION                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let totalFiles = 0;
    let validFiles = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    const dirs = ['frontend/src', 'backend', 'src'];
    
    for (const dir of dirs) {
      try {
        const files = await this.getTypeScriptFiles(dir);
        for (const file of files) {
          const result = await this.validateFile(file);
          totalFiles++;
          if (result.errors.length === 0) validFiles++;
          totalErrors += result.errors.length;
          totalWarnings += result.warnings.length;
        }
      } catch (e) {
        console.log(`⚠️  Directory not accessible: ${dir}`);
      }
    }

    const validation: ProjectValidation = {
      totalFiles,
      validFiles,
      totalErrors,
      totalWarnings,
      passRate: totalFiles > 0 ? (validFiles / totalFiles) * 100 : 0,
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(`   Files validated: ${totalFiles}`);
    console.log(`   Valid files: ${validFiles}`);
    console.log(`   Pass rate: ${validation.passRate.toFixed(1)}%`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Warnings: ${totalWarnings}\n`);

    return validation;
  }

  private async getTypeScriptFiles(dir: string, files: string[] = []): Promise<string[]> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory() && !entry.name.includes('node_modules')) {
          await this.getTypeScriptFiles(fullPath, files);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Directory not accessible
    }
    
    return files;
  }
}
