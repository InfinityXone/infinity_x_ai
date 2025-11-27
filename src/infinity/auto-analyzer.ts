import { JarvisAIEngine } from '../ai/engine.ts';
import fs from 'fs/promises';
import path from 'path';

/**
 * Autonomous Code Analyzer
 * Continuously analyzes generated code for quality, patterns, and improvements
 */
export class AutoAnalyzer {
  private ai: JarvisAIEngine;
  private analysisHistory: Map<string, AnalysisResult[]>;

  constructor() {
    this.ai = new JarvisAIEngine();
    this.analysisHistory = new Map();
  }

  async analyzeFile(filePath: string): Promise<AnalysisResult> {
    console.log(`🔍 Auto-analyzing: ${filePath}`);
    
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      
      const prompt = `Analyze this code and provide detailed feedback:

${code}

Analyze for:
1. Code quality and best practices
2. Security vulnerabilities
3. Performance optimizations
4. Type safety issues
5. Potential bugs
6. Architecture improvements

Return JSON format:
{
  "quality_score": 0-100,
  "issues": [{"type": "security|performance|bug|style", "severity": "high|medium|low", "description": "", "line": 0}],
  "suggestions": [""],
  "patterns_detected": [""],
  "complexity_score": 0-10
}`;

      const analysis = await this.ai.think(prompt);
      
      // Parse AI response
      let result: AnalysisResult;
      try {
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : this.createDefaultResult();
      } catch {
        result = this.createDefaultResult();
      }

      result.filePath = filePath;
      result.timestamp = new Date().toISOString();

      // Store in history
      if (!this.analysisHistory.has(filePath)) {
        this.analysisHistory.set(filePath, []);
      }
      this.analysisHistory.get(filePath)!.push(result);

      console.log(`✅ Analysis complete: Quality ${result.quality_score}/100, ${result.issues.length} issues found`);
      
      return result;
    } catch (error: any) {
      console.error(`❌ Analysis error: ${error.message}`);
      return this.createDefaultResult();
    }
  }

  async analyzeProject(projectRoot: string): Promise<ProjectAnalysis> {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              🔍 AUTO PROJECT ANALYSIS                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const results: AnalysisResult[] = [];
    const dirs = ['frontend/src/components', 'backend/routes', 'backend/api', 'backend/schemas'];

    for (const dir of dirs) {
      const fullPath = path.join(projectRoot, dir);
      try {
        const files = await fs.readdir(fullPath);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const filePath = path.join(fullPath, file);
            const result = await this.analyzeFile(filePath);
            results.push(result);
          }
        }
      } catch (e) {
        console.log(`⚠️  Directory not found: ${dir}`);
      }
    }

    const projectAnalysis: ProjectAnalysis = {
      totalFiles: results.length,
      averageQuality: results.reduce((sum, r) => sum + r.quality_score, 0) / results.length || 0,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
      highSeverityIssues: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'high').length, 0),
      patterns: this.extractCommonPatterns(results),
      recommendations: this.generateRecommendations(results),
      timestamp: new Date().toISOString()
    };

    console.log('\n📊 PROJECT ANALYSIS SUMMARY:');
    console.log(`   Files analyzed: ${projectAnalysis.totalFiles}`);
    console.log(`   Average quality: ${projectAnalysis.averageQuality.toFixed(1)}/100`);
    console.log(`   Total issues: ${projectAnalysis.totalIssues}`);
    console.log(`   High severity: ${projectAnalysis.highSeverityIssues}`);
    console.log(`   Patterns detected: ${projectAnalysis.patterns.length}\n`);

    return projectAnalysis;
  }

  private extractCommonPatterns(results: AnalysisResult[]): string[] {
    const patterns = new Set<string>();
    results.forEach(r => r.patterns_detected.forEach(p => patterns.add(p)));
    return Array.from(patterns);
  }

  private generateRecommendations(results: AnalysisResult[]): string[] {
    const recommendations = new Set<string>();
    results.forEach(r => r.suggestions.forEach(s => recommendations.add(s)));
    return Array.from(recommendations).slice(0, 10);
  }

  private createDefaultResult(): AnalysisResult {
    return {
      quality_score: 70,
      issues: [],
      suggestions: [],
      patterns_detected: [],
      complexity_score: 5,
      filePath: '',
      timestamp: new Date().toISOString()
    };
  }

  getHistory(filePath: string): AnalysisResult[] {
    return this.analysisHistory.get(filePath) || [];
  }
}

export interface AnalysisResult {
  quality_score: number;
  issues: Array<{
    type: 'security' | 'performance' | 'bug' | 'style';
    severity: 'high' | 'medium' | 'low';
    description: string;
    line?: number;
  }>;
  suggestions: string[];
  patterns_detected: string[];
  complexity_score: number;
  filePath?: string;
  timestamp?: string;
}

export interface ProjectAnalysis {
  totalFiles: number;
  averageQuality: number;
  totalIssues: number;
  highSeverityIssues: number;
  patterns: string[];
  recommendations: string[];
  timestamp: string;
}
