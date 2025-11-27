import { JarvisAIEngine } from '../ai/engine.ts';
import { AutoAnalyzer, type AnalysisResult } from './auto-analyzer.ts';
import { AutoValidator, type ValidationResult } from './auto-validator.ts';
import fs from 'fs/promises';

/**
 * Autonomous Code Fixer
 * Automatically fixes issues found by analyzer and validator
 */
export class AutoFixer {
  private ai: JarvisAIEngine;
  private analyzer: AutoAnalyzer;
  private validator: AutoValidator;
  private fixHistory: FixHistoryEntry[];

  constructor() {
    this.ai = new JarvisAIEngine();
    this.analyzer = new AutoAnalyzer();
    this.validator = new AutoValidator();
    this.fixHistory = [];
  }

  async fixFile(filePath: string): Promise<FixResult> {
    console.log(`🔧 Auto-fixing: ${filePath}`);

    try {
      // Analyze first
      const analysis = await this.analyzer.analyzeFile(filePath);
      const validation = await this.validator.validateFile(filePath);

      if (analysis.issues.length === 0 && validation.errors.length === 0) {
        console.log('✅ No issues to fix');
        return { success: true, fixesApplied: 0, filePath };
      }

      const code = await fs.readFile(filePath, 'utf-8');

      // Generate fix with AI
      const prompt = `Fix the following code based on these issues:

ANALYSIS ISSUES:
${JSON.stringify(analysis.issues, null, 2)}

VALIDATION ERRORS:
${JSON.stringify(validation.errors, null, 2)}

ORIGINAL CODE:
${code}

Generate the COMPLETE fixed code with all issues resolved. Return ONLY the code, no explanations.`;

      const fixedCode = await this.ai.think(prompt);

      // Extract code if wrapped in markdown
      const codeMatch = fixedCode.match(/```(?:tsx?|typescript|javascript)?\n([\s\S]*?)\n```/);
      const cleanCode = codeMatch ? codeMatch[1] : fixedCode;

      // Create backup
      await fs.writeFile(`${filePath}.backup`, code, 'utf-8');

      // Apply fix
      await fs.writeFile(filePath, cleanCode, 'utf-8');

      // Validate fix
      const newValidation = await this.validator.validateFile(filePath);
      const success = newValidation.errors.length < validation.errors.length;

      if (!success) {
        // Revert if fix made things worse
        await fs.writeFile(filePath, code, 'utf-8');
        console.log('⚠️  Fix reverted - made issues worse');
      } else {
        console.log(`✅ Fixed: ${validation.errors.length} → ${newValidation.errors.length} errors`);
      }

      const result: FixResult = {
        success,
        fixesApplied: validation.errors.length - newValidation.errors.length,
        filePath,
        timestamp: new Date().toISOString()
      };

      this.fixHistory.push({
        filePath,
        issuesFound: analysis.issues.length + validation.errors.length,
        issuesFixed: result.fixesApplied,
        timestamp: result.timestamp!
      });

      return result;
    } catch (error: any) {
      console.error(`❌ Fix error: ${error.message}`);
      return { success: false, fixesApplied: 0, filePath };
    }
  }

  async autoFixProject(): Promise<ProjectFixResult> {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              🔧 AUTO PROJECT FIXING                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let totalFiles = 0;
    let fixedFiles = 0;
    let totalFixes = 0;

    const dirs = ['frontend/src/components', 'backend/routes', 'backend/api'];

    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const result = await this.fixFile(`${dir}/${file}`);
            totalFiles++;
            if (result.success) {
              fixedFiles++;
              totalFixes += result.fixesApplied;
            }
          }
        }
      } catch (e) {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }

    console.log('\n📊 FIX SUMMARY:');
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Files fixed: ${fixedFiles}`);
    console.log(`   Total fixes applied: ${totalFixes}\n`);

    return {
      totalFiles,
      fixedFiles,
      totalFixes,
      timestamp: new Date().toISOString()
    };
  }

  getFixHistory(): FixHistoryEntry[] {
    return this.fixHistory;
  }
}

export interface FixResult {
  success: boolean;
  fixesApplied: number;
  filePath: string;
  timestamp?: string;
}

export interface ProjectFixResult {
  totalFiles: number;
  fixedFiles: number;
  totalFixes: number;
  timestamp: string;
}

interface FixHistoryEntry {
  filePath: string;
  issuesFound: number;
  issuesFixed: number;
  timestamp: string;
}
