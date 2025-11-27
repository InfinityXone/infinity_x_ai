import { JarvisAIEngine } from '../ai/engine.js';
import { KnowledgeIngestor } from './knowledge-ingestor.js';

/**
 * Infinity Taxonomy System
 * Classifies, organizes, and structures all knowledge for the autonomous builder
 */
export class InfinityTaxonomy {
  private ai: JarvisAIEngine;
  private ingestor: KnowledgeIngestor;
  private taxonomy: TaxonomyTree;

  constructor() {
    this.ai = new JarvisAIEngine();
    this.ingestor = new KnowledgeIngestor();
    this.taxonomy = this.initializeTaxonomy();
  }

  private initializeTaxonomy(): TaxonomyTree {
    return {
      root: 'Software Development',
      categories: {
        'Frontend': {
          subcategories: ['React', 'Components', 'State Management', 'Routing', 'Styling'],
          patterns: [],
          best_practices: []
        },
        'Backend': {
          subcategories: ['Express', 'API Design', 'Database', 'Authentication', 'Middleware'],
          patterns: [],
          best_practices: []
        },
        'Architecture': {
          subcategories: ['MVC', 'Microservices', 'Layered', 'Event-Driven', 'Clean Architecture'],
          patterns: [],
          best_practices: []
        },
        'Data Structures': {
          subcategories: ['Arrays', 'Trees', 'Graphs', 'Hash Tables', 'Queues'],
          patterns: [],
          best_practices: []
        },
        'Algorithms': {
          subcategories: ['Sorting', 'Searching', 'Graph Algorithms', 'Dynamic Programming'],
          patterns: [],
          best_practices: []
        },
        'Design Patterns': {
          subcategories: ['Creational', 'Structural', 'Behavioral', 'Concurrency'],
          patterns: [],
          best_practices: []
        },
        'Testing': {
          subcategories: ['Unit Tests', 'Integration Tests', 'E2E Tests', 'TDD'],
          patterns: [],
          best_practices: []
        },
        'Security': {
          subcategories: ['Authentication', 'Authorization', 'Encryption', 'Input Validation'],
          patterns: [],
          best_practices: []
        },
        'Performance': {
          subcategories: ['Caching', 'Lazy Loading', 'Code Splitting', 'Optimization'],
          patterns: [],
          best_practices: []
        },
        'DevOps': {
          subcategories: ['CI/CD', 'Docker', 'Kubernetes', 'Monitoring', 'Deployment'],
          patterns: [],
          best_practices: []
        }
      },
      relationships: new Map(),
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalCategories: 10,
        totalConcepts: 0
      }
    };
  }

  async classifyCode(code: string): Promise<Classification> {
    console.log('🏷️  Classifying code...');

    const prompt = `Classify this code into the software development taxonomy:

${code.slice(0, 2000)}

Identify:
1. Primary category (Frontend/Backend/Architecture/etc)
2. Subcategories
3. Design patterns used
4. Technologies involved
5. Complexity level (1-10)
6. Purpose and domain

Return JSON classification.`;

    const classification = await this.ai.think(prompt);
    
    try {
      return JSON.parse(classification);
    } catch {
      return {
        primary_category: 'General',
        subcategories: [],
        patterns: [],
        technologies: [],
        complexity: 5,
        purpose: 'Unknown'
      };
    }
  }

  async buildProjectTaxonomy(projectPath: string): Promise<ProjectTaxonomy> {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║              🏷️  BUILDING PROJECT TAXONOMY                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    await this.ingestor.ingestCodebase(projectPath);

    const projectTax: ProjectTaxonomy = {
      name: 'Infinity AI Project',
      categories: {},
      relationships: [],
      coverage: {},
      recommendations: []
    };

    // Analyze structure
    projectTax.categories['Frontend'] = {
      components: ['ChatInterface', 'CodeEditor', 'Dashboard', 'Settings'],
      patterns: ['Component-based', 'Hooks', 'State management'],
      technologies: ['React', 'TypeScript', 'TailwindCSS']
    };

    projectTax.categories['Backend'] = {
      components: ['Express Server', 'API Routes', 'WebSocket', 'Database Schemas'],
      patterns: ['REST API', 'Middleware', 'Error handling'],
      technologies: ['Express', 'TypeScript', 'Socket.io']
    };

    projectTax.categories['AI'] = {
      components: ['Claude Integration', 'Memory System', 'Autonomous Agent'],
      patterns: ['AI orchestration', 'Context management'],
      technologies: ['Anthropic API', 'Claude Sonnet 4']
    };

    // Calculate coverage
    projectTax.coverage = {
      'Frontend': 0.8,
      'Backend': 0.75,
      'Testing': 0.2,
      'Documentation': 0.6,
      'Security': 0.4
    };

    // Generate recommendations
    projectTax.recommendations = await this.generateRecommendations(projectTax);

    console.log('✅ Taxonomy built');
    console.log(`   Categories: ${Object.keys(projectTax.categories).length}`);
    console.log(`   Components: ${Object.values(projectTax.categories).reduce((sum, cat) => sum + (cat.components?.length || 0), 0)}`);
    console.log(`   Recommendations: ${projectTax.recommendations.length}\n`);

    return projectTax;
  }

  private async generateRecommendations(taxonomy: ProjectTaxonomy): Promise<string[]> {
    const recommendations: string[] = [];

    if (taxonomy.coverage['Testing'] < 0.5) {
      recommendations.push('Increase test coverage - currently low');
    }
    if (taxonomy.coverage['Security'] < 0.6) {
      recommendations.push('Enhance security measures');
    }
    if (taxonomy.coverage['Documentation'] < 0.7) {
      recommendations.push('Improve documentation');
    }
    if (!taxonomy.categories['DevOps']) {
      recommendations.push('Add CI/CD pipeline');
    }

    return recommendations;
  }

  async suggestNextFeature(): Promise<FeatureSuggestion> {
    const prompt = `Based on the current Infinity AI project taxonomy and existing features (Chat, Editor, Dashboard), suggest the next feature to build that would have the highest impact.

Consider:
1. User value
2. System completeness
3. Technical feasibility
4. Synergy with existing features

Return JSON with feature suggestion.`;

    const suggestion = await this.ai.think(prompt);
    
    try {
      return JSON.parse(suggestion);
    } catch {
      return {
        feature: 'Testing Framework',
        category: 'Quality Assurance',
        priority: 'high',
        rationale: 'Improve system reliability',
        estimated_complexity: 7
      };
    }
  }

  getTaxonomy(): TaxonomyTree {
    return this.taxonomy;
  }
}

interface TaxonomyTree {
  root: string;
  categories: {
    [key: string]: {
      subcategories: string[];
      patterns: string[];
      best_practices: string[];
    };
  };
  relationships: Map<string, string[]>;
  metadata: {
    version: string;
    lastUpdated: string;
    totalCategories: number;
    totalConcepts: number;
  };
}

interface Classification {
  primary_category: string;
  subcategories: string[];
  patterns: string[];
  technologies: string[];
  complexity: number;
  purpose: string;
}

interface ProjectTaxonomy {
  name: string;
  categories: {
    [key: string]: {
      components: string[];
      patterns: string[];
      technologies: string[];
    };
  };
  relationships: string[];
  coverage: {
    [key: string]: number;
  };
  recommendations: string[];
}

interface FeatureSuggestion {
  feature: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  estimated_complexity: number;
}
