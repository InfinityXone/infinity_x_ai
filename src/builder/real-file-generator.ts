import fs from 'fs/promises';
import path from 'path';
import { JarvisAIEngine } from '../ai/engine.ts';

export class RealFileGenerator {
  private ai: JarvisAIEngine;
  private projectRoot: string;

  constructor() {
    this.ai = new JarvisAIEngine();
    this.projectRoot = process.cwd();
  }

  async generateReactComponent(name: string, description: string): Promise<string> {
    console.log(`📝 Generating React component: ${name}`);
    
    const prompt = `Generate a production-ready React TypeScript component for: ${description}

Requirements:
- Component name: ${name}
- Use TypeScript with proper types
- Use TailwindCSS for styling
- Include proper imports
- Export as default
- Add JSDoc comments
- Make it functional and complete

Return ONLY the code, no explanations.`;

    const code = await this.ai.think(prompt);
    
    // Extract code if wrapped in markdown
    const match = code.match(/```(?:tsx?|typescript|javascript)?\n([\s\S]*?)\n```/);
    const cleanCode = match ? match[1] : code;
    
    const filePath = path.join(this.projectRoot, 'frontend', 'src', 'components', `${name}.tsx`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, cleanCode, 'utf-8');
    
    console.log(`✅ Created: frontend/src/components/${name}.tsx`);
    return filePath;
  }

  async generateExpressRoute(name: string, description: string): Promise<string> {
    console.log(`📝 Generating Express route: ${name}`);
    
    const prompt = `Generate a production-ready Express TypeScript route for: ${description}

Requirements:
- Route name: ${name}
- Use TypeScript with proper types
- Include proper error handling
- Use async/await
- Add validation
- Include JSDoc comments
- Export as Router

Return ONLY the code, no explanations.`;

    const code = await this.ai.think(prompt);
    
    const match = code.match(/```(?:tsx?|typescript|javascript)?\n([\s\S]*?)\n```/);
    const cleanCode = match ? match[1] : code;
    
    const filePath = path.join(this.projectRoot, 'backend', 'routes', `${name}.ts`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, cleanCode, 'utf-8');
    
    console.log(`✅ Created: backend/routes/${name}.ts`);
    return filePath;
  }

  async generateAPIEndpoint(name: string, description: string): Promise<string> {
    console.log(`📝 Generating API endpoint: ${name}`);
    
    const prompt = `Generate a production-ready API endpoint handler for: ${description}

Requirements:
- Endpoint: /api/${name}
- Use TypeScript
- Include GET, POST methods
- Add proper error handling
- Return JSON responses
- Add validation

Return ONLY the code, no explanations.`;

    const code = await this.ai.think(prompt);
    
    const match = code.match(/```(?:tsx?|typescript|javascript)?\n([\s\S]*?)\n```/);
    const cleanCode = match ? match[1] : code;
    
    const filePath = path.join(this.projectRoot, 'backend', 'api', `${name}.ts`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, cleanCode, 'utf-8');
    
    console.log(`✅ Created: backend/api/${name}.ts`);
    return filePath;
  }

  async generateDatabaseSchema(name: string, description: string): Promise<string> {
    console.log(`📝 Generating database schema: ${name}`);
    
    const prompt = `Generate a database schema for: ${description}

Requirements:
- Schema name: ${name}
- Use TypeScript interfaces
- Include proper types
- Add timestamps
- Include relationships

Return ONLY the code, no explanations.`;

    const code = await this.ai.think(prompt);
    
    const match = code.match(/```(?:tsx?|typescript|javascript)?\n([\s\S]*?)\n```/);
    const cleanCode = match ? match[1] : code;
    
    const filePath = path.join(this.projectRoot, 'backend', 'schemas', `${name}.ts`);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, cleanCode, 'utf-8');
    
    console.log(`✅ Created: backend/schemas/${name}.ts`);
    return filePath;
  }
}
