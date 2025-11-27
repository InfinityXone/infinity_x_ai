```typescript
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

interface CodeSession {
  id: string;
  language: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AutocompleteRequest {
  language: string;
  code: string;
  position: {
    line: number;
    column: number;
  };
}

interface SyntaxCheckRequest {
  language: string;
  code: string;
}

interface CodeResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'sql',
  'html',
  'css',
  'json',
  'xml',
  'yaml',
  'markdown'
];

// In-memory storage (replace with database in production)
const codeSessions = new Map<string, CodeSession>();

// Validation rules
export const validateCodeSession = [
  body('language')
    .isString()
    .isIn(SUPPORTED_LANGUAGES)
    .withMessage('Invalid or unsupported language'),
  body('code')
    .isString()
    .isLength({ max: 1000000 })
    .withMessage('Code content is required and must be less than 1MB'),
];

export const validateAutocomplete = [
  body('language')
    .isString()
    .isIn(SUPPORTED_LANGUAGES)
    .withMessage('Invalid or unsupported language'),
  body('code')
    .isString()
    .withMessage('Code content is required'),
  body('position.line')
    .isInt({ min: 0 })
    .withMessage('Line position must be a non-negative integer'),
  body('position.column')
    .isInt({ min: 0 })
    .withMessage('Column position must be a non-negative integer'),
];

export const validateSyntaxCheck = [
  body('language')
    .isString()
    .isIn(SUPPORTED_LANGUAGES)
    .withMessage('Invalid or unsupported language'),
  body('code')
    .isString()
    .withMessage('Code content is required'),
];

class CodeEditorService {
  static getLanguageConfig(language: string) {
    const configs = {
      javascript: { id: 'javascript', extensions: ['.js'], mimeTypes: ['text/javascript'] },
      typescript: { id: 'typescript', extensions: ['.ts'], mimeTypes: ['text/typescript'] },
      python: { id: 'python', extensions: ['.py'], mimeTypes: ['text/x-python'] },
      java: { id: 'java', extensions: ['.java'], mimeTypes: ['text/x-java-source'] },
      cpp: { id: 'cpp', extensions: ['.cpp', '.c', '.h'], mimeTypes: ['text/x-c++src'] },
      csharp: { id: 'csharp', extensions: ['.cs'], mimeTypes: ['text/x-csharp'] },
      go: { id: 'go', extensions: ['.go'], mimeTypes: ['text/x-go'] },
      rust: { id: 'rust', extensions: ['.rs'], mimeTypes: ['text/x-rust'] },
      php: { id: 'php', extensions: ['.php'], mimeTypes: ['text/x-php'] },
      ruby: { id: 'ruby', extensions: ['.rb'], mimeTypes: ['text/x-ruby'] },
      sql: { id: 'sql', extensions: ['.sql'], mimeTypes: ['text/x-sql'] },
      html: { id: 'html', extensions: ['.html', '.htm'], mimeTypes: ['text/html'] },
      css: { id: 'css', extensions: ['.css'], mimeTypes: ['text/css'] },
      json: { id: 'json', extensions: ['.json'], mimeTypes: ['application/json'] },
      xml: { id: 'xml', extensions: ['.xml'], mimeTypes: ['text/xml'] },
      yaml: { id: 'yaml', extensions: ['.yml', '.yaml'], mimeTypes: ['text/yaml'] },
      markdown: { id: 'markdown', extensions: ['.md'], mimeTypes: ['text/markdown'] }
    };
    return configs[language as keyof typeof configs];
  }

  static generateAutocomplete(request: AutocompleteRequest) {
    const { language, code, position } = request;
    const lines = code.split('\n');
    const currentLine = lines[position.line] || '';
    const currentWord = currentLine.substring(0, position.column).split(/\s/).pop() || '';

    // Basic autocomplete suggestions based on language
    const suggestions = {
      javascript: ['console', 'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return'],
      typescript: ['interface', 'type', 'enum', 'class', 'extends', 'implements', 'public', 'private', 'protected'],
      python: ['def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'try', 'except'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final'],
      cpp: ['#include', 'namespace', 'using', 'class', 'struct', 'public', 'private', 'protected', 'virtual'],
      csharp: ['public', 'private', 'protected', 'class', 'interface', 'namespace', 'using', 'static', 'virtual'],
      go: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'if', 'for'],
      rust: ['fn', 'let', 'mut', 'const', 'struct', 'enum', 'impl', 'trait', 'use', 'mod'],
      php: ['<?php', 'function', 'class', 'interface', 'trait', 'namespace', 'use', 'public', 'private'],
      ruby: ['def', 'class', 'module', 'include', 'extend', 'require', 'if', 'unless', 'case', 'when'],
      sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'INNER', 'LEFT', 'RIGHT'],
      html: ['<div>', '<span>', '<p>', '<h1>', '<h2>', '<h3>', '<img>', '<a>', '<ul>', '<li>'],
      css: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position'],
      json: ['true', 'false', 'null'],
      xml: ['<?xml', '<root>', '<element>'],
      yaml: ['---', 'name', 'value', 'items'],
      markdown: ['#', '##', '###', '**', '*', '[]', '()', '```']
    };

    const languageSuggestions = suggestions[language as keyof typeof suggestions] || [];
    const filtered = languageSuggestions.filter(s => 
      s.toLowerCase().startsWith(currentWord.toLowerCase())
    );

    return filtered.map(suggestion => ({
      label: suggestion,
      kind: 'keyword',
      insertText: suggestion,
      detail: `${language} keyword`
    }));
  }

  static checkSyntax(request: SyntaxCheckRequest) {
    const { language, code } = request;
    const errors: any[] = [];

    // Basic syntax validation (extend with proper parsers in production)
    try {
      if (language === 'json') {
        JSON.parse(code);
      }
      
      // Add more syntax checkers for other languages
      const commonErrors = this.findCommonSyntaxErrors(language, code);
      errors.push(...commonErrors);
    } catch (error) {
      errors.push({
        line: 1,
        column: 1,
        message: error instanceof Error ? error.message : 'Syntax error',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static findCommonSyntaxErrors(language: string, code: string) {
    const errors: any[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for unclosed brackets/parentheses
      const openBrackets = (line.match(/[\[\({]/g) || []).length;
      const closeBrackets = (line.match(/[\]\)}]/g) || []).length;
      
      if (openBrackets > closeBrackets) {
        errors.push({
          line: index + 1,
          column: line.length,
          message: 'Unclosed bracket or parenthesis',
          severity: 'warning'
        });
      }
    });

    return errors;
  }
}

export const getCodeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      // Return supported languages and editor config
      const response: CodeResponse = {
        success: true,
        data: {
          supportedLanguages: SUPPORTED_LANGUAGES.map(lang => ({
            id: lang,
            ...CodeEditorService.getLanguageConfig(lang)
          })),
          editorConfig: {
            theme: 'vs-dark',
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true
          }
        }
      };
      res.status(200).json(response);
      return;
    }

    const session = codeSessions.get(id);
    if (!session) {
      const response: CodeResponse = {
        success: false,
        error: 'Code session not found'
      };
      res.status(404).json(response);
      return;
    }

    const response: CodeResponse = {
      success: true,
      data: session
    };
    res.status(200).json(response);
  } catch (error) {
    const response: CodeResponse = {
      success: false,
      error: 'Internal server error'
    };
    res.status(500).json(response);
  }
};

export const createCodeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: CodeResponse = {
        success: false,
        error: 'Validation failed',
        data: { errors: errors.array() }
      };
      res.status(400).json(response);
      return;
    }

    const { language, code } = req.body;
    const sessionId = uuidv4();
    
    const session: CodeSession = {
      id: sessionId,
      language,
      code,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    codeSessions.set(sessionId, session);

    const response: CodeResponse = {
      success: true,
      data: session,
      message: 'Code session created successfully'
    };
    res.status(201).json(response);
  } catch (error) {
    const response: CodeResponse = {
      success: false,
      error: 'Failed to create code session'
    };
    res.status(500).json(response);
  }
};

export const updateCodeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: CodeResponse = {
        success: false,
        error: 'Validation failed',
        data: { errors: errors.array() }
      };
      res.status(400).json(response);
      return;
    }

    const { id } = req.params;
    const { language, code } = req.body;

    const session = codeSessions.get(id);
    if (!session) {
      const response: CodeResponse = {
        success: false,
        error: 'Code session not found'
      };
      res.status(404).json(response);
      return;
    }

    session.language = language;
    session.code = code;
    session.updatedAt = new Date();
    codeSessions.set(id, session);

    const response: CodeResponse = {
      success: true,
      data: session,
      message: 'Code session updated successfully'
    };
    res.status(200).json(response);
  } catch (error) {
    const response: CodeResponse = {
      success: false,
      error: 'Failed to update code session'
    };
    res.status(500).json(response);
  }
};

export const getAutocomplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: CodeResponse = {
        success: false,
        error: 'Validation failed',
        data: { errors: errors.array() }
      };
      res.status(400).json(response);
      return;
    }

    const autocompleteRequest: AutocompleteRequest = req.body;
    const suggestions = CodeEditorService.generateAutocomplete(autocompleteRequest);

    const response: CodeResponse = {
      success: true,
      data: { suggestions }
    };
    res.status(200).json(response);
  } catch (error) {
    const response: CodeResponse = {
      success: false,
      error: 'Failed to generate autocomplete suggestions'
    };
    res.status(500).json(response);
  }
};

export const checkSyntax = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response: CodeResponse = {
        success: false,
        error: 'Validation failed',
        data: { errors: errors.array() }
      };
      res.status(400).json(response);
      return;
    }

    const syntaxRequest: SyntaxCheckRequest = req.body;
    const syntaxResult = CodeEditorService.checkSyntax(syntaxRequest);

    const response: CodeResponse = {
      success: true,
      data: syntaxResult
    };
    res.status(200).json(response);
  } catch (error) {
    const response: CodeResponse = {
      success: false,
      error: 'Failed to check syntax'
    };
    res.status(500).json(response);
  }
};

export const deleteCodeSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!codeSessions.has(id)) {
      const response: CodeResponse = {
        success: false,
        error: 'Code session not found'
      };
      res.status(404).json(response);
      return;
    }

    codeSessions.delete(id);

    const response: CodeResponse = {
      success: true,
      message: 'Code session deleted successfully'
    };
    res.