import { type QuantumThought } from './quantum-prompt-engine.ts';

/**
 * THOUGHT PROCESSOR
 * Processes quantum thoughts into actionable intelligence
 */
export class ThoughtProcessor {
  
  /**
   * Process quantum thought into structured intelligence
   */
  async process(thought: QuantumThought): Promise<ProcessedThought> {
    console.log(`\n🧮 Processing quantum thought...`);

    const processed: ProcessedThought = {
      original: thought,
      components: this.extractComponents(thought.insight),
      actionables: this.extractActionables(thought.insight),
      architecturePatterns: this.extractArchitecturePatterns(thought.insight),
      codeStructures: this.extractCodeStructures(thought.insight),
      relationships: this.extractRelationships(thought.insight),
      priority: this.calculatePriority(thought),
      complexity: this.estimateComplexity(thought.insight),
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Thought processed:`);
    console.log(`   - Components: ${processed.components.length}`);
    console.log(`   - Actionables: ${processed.actionables.length}`);
    console.log(`   - Patterns: ${processed.architecturePatterns.length}`);
    console.log(`   - Priority: ${processed.priority}`);

    return processed;
  }

  /**
   * Extract system components from thought
   */
  private extractComponents(insight: string): Component[] {
    const components: Component[] = [];
    
    // Look for component-like mentions
    const patterns = [
      /(?:build|create|implement|develop)\s+(?:a\s+)?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/g,
      /([A-Z][a-zA-Z]+Engine|[A-Z][a-zA-Z]+Manager|[A-Z][a-zA-Z]+Builder|[A-Z][a-zA-Z]+Processor)/g,
      /class\s+([A-Z][a-zA-Z]+)/g
    ];

    patterns.forEach(pattern => {
      const matches = insight.matchAll(pattern);
      for (const match of matches) {
        const name = match[1];
        if (name && name.length > 3 && name.length < 50) {
          components.push({
            name: name.trim(),
            type: this.determineComponentType(name),
            description: this.extractComponentDescription(insight, name)
          });
        }
      }
    });

    // Deduplicate
    return Array.from(new Map(components.map(c => [c.name, c])).values())
      .slice(0, 10); // Limit to top 10
  }

  /**
   * Determine component type
   */
  private determineComponentType(name: string): string {
    if (name.includes('Engine')) return 'engine';
    if (name.includes('Manager')) return 'manager';
    if (name.includes('Builder')) return 'builder';
    if (name.includes('Processor')) return 'processor';
    if (name.includes('Analyzer')) return 'analyzer';
    if (name.includes('Generator')) return 'generator';
    return 'service';
  }

  /**
   * Extract component description
   */
  private extractComponentDescription(insight: string, componentName: string): string {
    const sentences = insight.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.includes(componentName)) {
        return sentence.trim().slice(0, 200);
      }
    }
    return `Component for ${componentName}`;
  }

  /**
   * Extract actionable items
   */
  private extractActionables(insight: string): string[] {
    const actionables: string[] = [];
    
    // Extract imperative sentences and action items
    const actionVerbs = ['create', 'build', 'implement', 'develop', 'design', 'integrate', 'establish', 'generate'];
    const sentences = insight.split(/[.!?]+/);

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      if (actionVerbs.some(verb => lowerSentence.includes(verb))) {
        const cleaned = sentence.trim();
        if (cleaned.length > 10 && cleaned.length < 300) {
          actionables.push(cleaned);
        }
      }
    });

    return actionables.slice(0, 15); // Limit to 15 actionables
  }

  /**
   * Extract architecture patterns
   */
  private extractArchitecturePatterns(insight: string): string[] {
    const patterns: Set<string> = new Set();
    
    const architectureKeywords = [
      'microservices', 'monolithic', 'event-driven', 'layered',
      'pipeline', 'pub-sub', 'observer', 'factory', 'singleton',
      'repository', 'mvc', 'mvvm', 'clean architecture', 'hexagonal',
      'orchestration', 'choreography', 'saga', 'cqrs'
    ];

    const lowerInsight = insight.toLowerCase();
    architectureKeywords.forEach(keyword => {
      if (lowerInsight.includes(keyword)) {
        patterns.add(keyword);
      }
    });

    return Array.from(patterns);
  }

  /**
   * Extract code structures
   */
  private extractCodeStructures(insight: string): CodeStructure[] {
    const structures: CodeStructure[] = [];

    // Look for class/interface definitions
    const classMatches = insight.matchAll(/(?:class|interface)\s+([A-Z][a-zA-Z]+)(?:\s+(?:extends|implements)\s+([A-Z][a-zA-Z]+))?/g);
    
    for (const match of classMatches) {
      structures.push({
        type: match[0].includes('class') ? 'class' : 'interface',
        name: match[1],
        extends: match[2] || undefined
      });
    }

    return structures;
  }

  /**
   * Extract relationships between components
   */
  private extractRelationships(insight: string): Relationship[] {
    const relationships: Relationship[] = [];
    
    // Look for relationship patterns
    const patterns = [
      /([A-Z][a-zA-Z]+)\s+uses?\s+([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s+depends?\s+on\s+([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s+extends?\s+([A-Z][a-zA-Z]+)/g,
      /([A-Z][a-zA-Z]+)\s+implements?\s+([A-Z][a-zA-Z]+)/g
    ];

    patterns.forEach(pattern => {
      const matches = insight.matchAll(pattern);
      for (const match of matches) {
        relationships.push({
          from: match[1],
          to: match[2],
          type: this.determineRelationshipType(match[0])
        });
      }
    });

    return relationships;
  }

  /**
   * Determine relationship type
   */
  private determineRelationshipType(text: string): string {
    if (text.includes('uses')) return 'uses';
    if (text.includes('depends')) return 'depends-on';
    if (text.includes('extends')) return 'extends';
    if (text.includes('implements')) return 'implements';
    return 'related-to';
  }

  /**
   * Calculate priority of thought
   */
  private calculatePriority(thought: QuantumThought): number {
    let priority = 5; // Base priority

    // Higher evolution level = higher priority
    priority += thought.evolutionLevel;

    // Longer, more detailed thoughts = higher priority
    if (thought.insight.length > 2000) priority += 2;
    else if (thought.insight.length > 1000) priority += 1;

    return Math.min(priority, 10); // Cap at 10
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(insight: string): number {
    let complexity = 1;

    // Count technical terms
    const technicalTerms = ['algorithm', 'optimization', 'distributed', 'concurrent', 'async', 'quantum'];
    technicalTerms.forEach(term => {
      if (insight.toLowerCase().includes(term)) complexity++;
    });

    // Count components mentioned
    const componentMatches = insight.match(/[A-Z][a-zA-Z]+(?:Engine|Manager|Builder|Processor)/g);
    if (componentMatches) complexity += Math.min(componentMatches.length, 5);

    return Math.min(complexity, 10); // Cap at 10
  }
}

export interface ProcessedThought {
  original: QuantumThought;
  components: Component[];
  actionables: string[];
  architecturePatterns: string[];
  codeStructures: CodeStructure[];
  relationships: Relationship[];
  priority: number;
  complexity: number;
  timestamp: string;
}

export interface Component {
  name: string;
  type: string;
  description: string;
}

export interface CodeStructure {
  type: 'class' | 'interface' | 'function';
  name: string;
  extends?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
}
