import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

/**
 * Supported programming languages for the Monaco editor
 */
export enum SupportedLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  CPP = 'cpp',
  HTML = 'html',
  CSS = 'css',
  JSON = 'json',
  XML = 'xml',
  SQL = 'sql',
  MARKDOWN = 'markdown'
}

/**
 * Monaco editor theme options
 */
export enum EditorTheme {
  VS = 'vs',
  VS_DARK = 'vs-dark',
  HC_BLACK = 'hc-black'
}

/**
 * Interface for editor configuration
 */
interface EditorConfig {
  language: SupportedLanguage;
  theme: EditorTheme;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  readOnly: boolean;
}

/**
 * Interface for code content request
 */
interface CodeContentRequest {
  content: string;
  language: SupportedLanguage;
  filename?: string;
}

/**
 * Interface for autocomplete request
 */
interface AutocompleteRequest {
  content: string;
  language: SupportedLanguage;
  position: {
    line: number;
    column: number;
  };
}

/**
 * Interface for syntax validation request
 */
interface SyntaxValidationRequest {
  content: string;
  language: SupportedLanguage;
}

/**
 * Interface for editor session
 */
interface EditorSession {
  id: string;
  content: string;
  language: SupportedLanguage;
  config: EditorConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for API response wrapper
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

const router = Router();

// Rate limiting for editor routes
const editorRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

/**
 * Validation middleware for editor configuration
 */
const validateEditorConfig = [
  body('language')
    .isIn(Object.values(SupportedLanguage))
    .withMessage('Invalid programming language'),
  body('theme')
    .optional()
    .isIn(Object.values(EditorTheme))
    .withMessage('Invalid editor theme'),
  body('fontSize')
    .optional()
    .isInt({ min: 8, max: 72 })
    .withMessage('Font size must be between 8 and 72'),
  body('tabSize')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('Tab size must be between 1 and 8'),
  body('wordWrap')
    .optional()
    .isBoolean()
    .withMessage('Word wrap must be a boolean'),
  body('minimap')
    .optional()
    .isBoolean()
    .withMessage('Minimap must be a boolean'),
  body('lineNumbers')
    .optional()
    .isBoolean()
    .withMessage('Line numbers must be a boolean'),
  body('readOnly')
    .optional()
    .isBoolean()
    .withMessage('Read only must be a boolean')
];

/**
 * Validation middleware for code content
 */
const validateCodeContent = [
  body('content')
    .isString()
    .isLength({ max: 1000000 })
    .withMessage('Content must be a string with maximum 1MB size'),
  body('language')
    .isIn(Object.values(SupportedLanguage))
    .withMessage('Invalid programming language'),
  body('filename')
    .optional()
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Filename must be between 1 and 255 characters')
];

/**
 * Validation middleware for autocomplete requests
 */
const validateAutocomplete = [
  body('content')
    .isString()
    .isLength({ max: 1000000 })
    .withMessage('Content must be a string with maximum 1MB size'),
  body('language')
    .isIn(Object.values(SupportedLanguage))
    .withMessage('Invalid programming language'),
  body('position.line')
    .isInt({ min: 1 })
    .withMessage('Line number must be a positive integer'),
  body('position.column')
    .isInt({ min: 0 })
    .withMessage('Column number must be a non-negative integer')
];

/**
 * Utility function to handle validation errors
 */
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: errors.array().map(err => err.msg).join(', '),
      timestamp: new Date()
    };
    res.status(400).json(response);
    return false;
  }
  return true;
};

/**
 * GET /editor
 * Get Monaco editor configuration and supported languages
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const response: ApiResponse = {
      success: true,
      data: {
        supportedLanguages: Object.values(SupportedLanguage),
        themes: Object.values(EditorTheme),
        defaultConfig: {
          language: SupportedLanguage.JAVASCRIPT,
          theme: EditorTheme.VS_DARK,
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          minimap: true,
          lineNumbers: true,
          readOnly: false
        }
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve editor configuration',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /editor/session
 * Create a new editor session with configuration
 */
router.post('/session', editorRateLimit, validateEditorConfig, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const config: EditorConfig = {
      language: req.body.language,
      theme: req.body.theme || EditorTheme.VS_DARK,
      fontSize: req.body.fontSize || 14,
      tabSize: req.body.tabSize || 2,
      wordWrap: req.body.wordWrap !== undefined ? req.body.wordWrap : true,
      minimap: req.body.minimap !== undefined ? req.body.minimap : true,
      lineNumbers: req.body.lineNumbers !== undefined ? req.body.lineNumbers : true,
      readOnly: req.body.readOnly !== undefined ? req.body.readOnly : false
    };

    const sessionId = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: EditorSession = {
      id: sessionId,
      content: '',
      language: config.language,
      config,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const response: ApiResponse<EditorSession> = {
      success: true,
      data: session,
      timestamp: new Date()
    };
    res.status(201).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create editor session',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /editor/validate
 * Validate syntax for given code content
 */
router.post('/validate', editorRateLimit, validateCodeContent, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { content, language }: SyntaxValidationRequest = req.body;

    // Mock syntax validation - in production, integrate with language servers
    const validationResults = await performSyntaxValidation(content, language);

    const response: ApiResponse = {
      success: true,
      data: {
        isValid: validationResults.errors.length === 0,
        errors: validationResults.errors,
        warnings: validationResults.warnings
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to validate syntax',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /editor/autocomplete
 * Get autocomplete suggestions for code at given position
 */
router.post('/autocomplete', editorRateLimit, validateAutocomplete, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { content, language, position }: AutocompleteRequest = req.body;

    // Mock autocomplete - in production, integrate with language servers
    const suggestions = await getAutocompleteSuggestions(content, language, position);

    const response: ApiResponse = {
      success: true,
      data: {
        suggestions,
        position
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to get autocomplete suggestions',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * POST /editor/format
 * Format code content according to language standards
 */
router.post('/format', editorRateLimit, validateCodeContent, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!handleValidationErrors(req, res)) return;

    const { content, language }: CodeContentRequest = req.body;

    // Mock code formatting - in production, integrate with language formatters
    const formattedContent = await formatCode(content, language);

    const response: ApiResponse = {
      success: true,
      data: {
        originalContent: content,
        formattedContent,
        language
      },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to format code',
      timestamp: new Date()
    };
    res.status(500).json(response);
  }
});

/**
 * GET /editor/languages/:language/snippets
 * Get code snippets for specific language
 */
router.get('/languages/:language/snippets', 
  param('language').isIn(Object.values(SupportedLanguage)).withMessage('Invalid language'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!handleValidationErrors(req, res)) return;

      const language = req.params.language as SupportedLanguage;
      const snippets = await getLanguageSnippets(language);

      const response: ApiResponse = {
        success: true,
        data: {
          language,
          snippets
        },
        timestamp: new Date()
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to retrieve code snippets',
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  }
);

/**
 * Mock function for syntax validation
 */
async function performSyntaxValidation(content: string, language: SupportedLanguage): Promise<{
  errors: Array<{ line: number; column: number; message: string; severity: 'error' | 'warning' }>;
  warnings: Array<{ line: number; column: number; message: string; severity: 'error' | 'warning' }>;
}> {
  // Mock implementation - replace with actual language server integration
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        errors: [],
        warnings: []
      });
    }, 100);
  });
}

/**
 * Mock function for autocomplete suggestions
 */
async function getAutocompleteSuggestions(
  content: string, 
  language: SupportedLanguage, 
  position: { line: number; column: number }
): Promise<Array<{
  label: string;
  kind: string;
  detail: string;
  insertText: string;
}>> {
  // Mock implementation - replace with actual language server integration
  return new Promise((resolve) => {
    const mockSuggestions = [
      { label: 'console', kind: 'Property', detail: 'Console object', insertText: 'console' },
      { label: 'log', kind: 'Method', detail: 'console.log()', insertText: 'log(' }
    ];
    
    setTimeout(() => {
      resolve(mockSuggestions);
    }, 100);
  });
}

/**
 * Mock function for code formatting
 */
async function formatCode(content: string, language: SupportedLanguage): Promise<string> {
  // Mock implementation - replace with actual formatter integration
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(content.trim());
    }, 100);
  });
}

/**
 * Mock function for language snippets
 */
async function getLanguageSnippets(language: SupportedLanguage): Promise<Array<{
  name: string;
  prefix: string;
  body: string;
  description: string;
}>> {
  // Mock implementation - replace with actual snippets database
  const snippets = {
    [SupportedLanguage.JAVASCRIPT]: [
      { name: 'Console Log', prefix: 'log', body: 'console.log($1);', description: 'Log to console' },
      { name: 'Function', prefix: 'fn', body: 'function ${1:name}($2) {\n\t$3\n}', description: 'Function declaration' }
    ],
    [SupportedLanguage.TYPESCRIPT]: [
      { name: 'Interface', prefix: 'interface', body: 'interface ${1:Name} {\n\t$2\n}', description: 'Interface declaration' }
    ]
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(snippets[language] || []);
    }, 50);
  });
}

export { router as editorRouter };