```tsx
import React, { 
  useEffect, 
  useRef, 
  useState, 
  useCallback, 
  useMemo, 
  memo, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import * as monaco from 'monaco-editor';

/**
 * Supported programming languages for the code editor
 */
export type SupportedLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'
  | 'html'
  | 'css'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'sql'
  | 'shell'
  | 'dockerfile'
  | 'kotlin'
  | 'swift'
  | 'r'
  | 'scala';

/**
 * Theme options for the code editor
 */
export type EditorTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light' | 'custom-dark' | 'custom-light';

/**
 * Font family options
 */
export type FontFamily = 'Fira Code' | 'Consolas' | 'Monaco' | 'Courier New' | 'monospace';

/**
 * Line height options
 */
export type LineHeight = number | 'normal';

/**
 * Word wrap options
 */
export type WordWrap = 'off' | 'on' | 'wordWrapColumn' | 'bounded';

/**
 * Cursor style options
 */
export type CursorStyle = 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';

/**
 * Scrollbar visibility options
 */
export type ScrollbarVisibility = 'auto' | 'visible' | 'hidden';

/**
 * Editor size configuration
 */
export interface EditorSize {
  width?: string | number;
  height?: string | number;
}

/**
 * Advanced editor options
 */
export interface AdvancedOptions {
  /** Enable bracket pair colorization */
  bracketPairColorization?: boolean;
  /** Enable sticky scroll */
  stickyScroll?: boolean;
  /** Enable code lens */
  codeLens?: boolean;
  /** Enable inlay hints */
  inlayHints?: boolean;
  /** Enable semantic highlighting */
  semanticHighlighting?: boolean;
  /** Custom ruler columns */
  rulers?: number[];
  /** Enable linked editing */
  linkedEditing?: boolean;
  /** Enable auto-closing brackets */
  autoClosingBrackets?: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  /** Enable auto-closing quotes */
  autoClosingQuotes?: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  /** Enable auto-surrounding */
  autoSurround?: 'languageDefined' | 'quotes' | 'brackets' | 'never';
}

/**
 * Validation error interface
 */
export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Editor command interface
 */
export interface EditorCommand {
  id: string;
  label: string;
  keybinding?: string;
  handler: () => void;
}

/**
 * Performance monitoring interface
 */
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  lineCount: number;
}

/**
 * Editor action interface
 */
export interface EditorActions {
  /** Get current editor value */
  getValue: () => string;
  /** Set editor value programmatically */
  setValue: (value: string) => void;
  /** Insert text at cursor position */
  insertText: (text: string) => void;
  /** Format document */
  formatDocument: () => Promise<void>;
  /** Focus editor */
  focus: () => void;
  /** Get selection */
  getSelection: () => monaco.Selection | null;
  /** Set selection */
  setSelection: (selection: monaco.IRange) => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
  /** Find and replace */
  findAndReplace: (findValue: string, replaceValue?: string) => void;
  /** Go to line */
  goToLine: (line: number) => void;
  /** Get performance metrics */
  getPerformanceMetrics: () => PerformanceMetrics;
}

/**
 * Props for the CodeEditor component
 */
export interface CodeEditorProps {
  /** Initial code content */
  value?: string;
  /** Default value (for uncontrolled mode) */
  defaultValue?: string;
  /** Programming language for syntax highlighting */
  language?: SupportedLanguage;
  /** Editor theme */
  theme?: EditorTheme;
  /** Editor dimensions */
  size?: EditorSize;
  /** Height of the editor (legacy support) */
  height?: string;
  /** Width of the editor (legacy support) */
  width?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Show line numbers */
  lineNumbers?: boolean | 'on' | 'off' | 'relative' | 'interval';
  /** Enable word wrap */
  wordWrap?: WordWrap;
  /** Font size */
  fontSize?: number;
  /** Font family */
  fontFamily?: FontFamily;
  /** Line height */
  lineHeight?: LineHeight;
  /** Font weight */
  fontWeight?: string;
  /** Tab size */
  tabSize?: number;
  /** Insert spaces instead of tabs */
  insertSpaces?: boolean;
  /** Enable minimap */
  minimap?: boolean;
  /** Enable folding */
  folding?: boolean;
  /** Cursor style */
  cursorStyle?: CursorStyle;
  /** Cursor blinking */
  cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  /** Scrollbar visibility */
  scrollbarVisibility?: ScrollbarVisibility;
  /** Advanced editor options */
  advanced?: AdvancedOptions;
  /** Additional CSS classes */
  className?: string;
  /** Custom CSS styles */
  style?: React.CSSProperties;
  /** Loading state */
  loading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Show language indicator */
  showLanguageIndicator?: boolean;
  /** Show performance metrics */
  showPerformanceMetrics?: boolean;
  /** Enable vim mode */
  vimMode?: boolean;
  /** Enable emacs mode */
  emacsMode?: boolean;
  /** Custom keybindings */
  keybindings?: EditorCommand[];
  /** Validation errors to display */
  validationErrors?: ValidationError[];
  /** Maximum file size allowed (in bytes) */
  maxFileSize?: number;
  /** Debounce delay for onChange (ms) */
  debounceDelay?: number;
  /** Enable diff mode */
  diffMode?: boolean;
  /** Original content for diff mode */
  originalValue?: string;
  /** Callback when code content changes */
  onChange?: (value: string, event?: monaco.editor.IModelContentChangedEvent) => void;
  /** Callback when editor is ready */
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor, actions: EditorActions) => void;
  /** Callback when editor is destroyed */
  onUnmount?: () => void;
  /** Callback for validation errors */
  onValidationError?: (errors: ValidationError[]) => void;
  /** Callback for cursor position changes */
  onCursorPositionChange?: (position: monaco.Position) => void;
  /** Callback for selection changes */
  onSelectionChange?: (selection: monaco.Selection) => void;
  /** Callback for focus events */
  onFocus?: () => void;
  /** Callback for blur events */
  onBlur?: () => void;
  /** Callback for key events */
  onKeyDown?: (event: monaco.IKeyboardEvent) => void;
  /** Callback for performance metrics updates */
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  /** Custom autocomplete suggestions */
  autocompleteSuggestions?: monaco.languages.CompletionItem[];
  /** Custom hover providers */
  hoverProviders?: monaco.languages.HoverProvider[];
  /** Custom diagnostic providers */
  diagnosticProviders?: ((model: monaco.editor.ITextModel) => monaco.editor.IMarkerData[])[];
}

/**
 * Custom hook for debouncing values
 */
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for performance monitoring
 */
const usePerformanceMonitor = (
  editor: monaco.editor.IStandaloneCodeEditor | null,
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void
) => {
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    lineCount: 0
  });

  useEffect(() => {
    if (!editor) return;

    const updateMetrics = () => {
      const model = editor.getModel();
      if (model) {
        const startTime = performance.now();
        
        // Simulate render time measurement
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const newMetrics: PerformanceMetrics = {
            renderTime: endTime - startTime,
            memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
            lineCount: model.getLineCount()
          };
          
          metricsRef.current = newMetrics;
          onPerformanceUpdate?.(newMetrics);
        });
      }
    };

    const disposable = editor.onDidChangeModelContent(updateMetrics);
    updateMetrics(); // Initial measurement

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => {
      disposable.dispose();
      clearInterval(interval);
    };
  }, [editor, onPerformanceUpdate]);

  return metricsRef.current;
};

/**
 * Security utility to sanitize and validate content
 */
const securityUtils = {
  /**
   * Sanitize input content to prevent XSS
   */
  sanitizeContent: (content: string): string => {
    // Basic XSS prevention
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  /**
   * Validate file size
   */
  validateFileSize: (content: string, maxSize: number): boolean => {
    const sizeInBytes = new Blob([content]).size;
    return sizeInBytes <= maxSize;
  },

  /**
   * Check for potentially dangerous patterns
   */
  detectDangerousPatterns: (content: string): string[] => {
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /setTimeout\s*\(\s*["'].*["']\s*,/gi,
      /setInterval\s*\(\s*["'].*["']\s*,/gi,
      /document\.write/gi,
      /innerHTML\s*=/gi
    ];

    const warnings: string[] = [];
    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        const patternNames = ['eval', 'Function constructor', 'setTimeout with string', 'setInterval with string', 'document.write', 'innerHTML assignment'];
        warnings.push(`Potentially dangerous pattern detected: ${patternNames[index]}`);
      }
    });

    return warnings;
  }
};

/**
 * Loading component
 */
const LoadingSpinner: React.FC<{ message?: string }> = memo(({ message = 'Loading editor...' }) => (
  <div className="flex items-center justify-center space-x-3">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
    <span className="text-gray-600 font-medium">{message}</span>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Error component
 */
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = memo(({ error, onRetry }) => (
  <div className="text-center space-y-4">
    <div className="text-red-600 text-lg font-semibold">
      Editor Error
    </div>
    <div className="text-red-500 text-sm max-w-md mx-auto">
      {error}
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

/**
 * Performance metrics display
 */
const PerformanceDisplay: React.FC<{ metrics: PerformanceMetrics }> = memo(({ metrics }) => (
  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-xs font-mono space-x-4">
    <span>Lines: {metrics.lineCount}</span>
    <span>Render: {metrics.renderTime.toFixed(2)}ms</span>
    {metrics.memoryUsage > 0 && (
      <span>Memory: {(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB</span>
    )}
  </div>
));

PerformanceDisplay.displayName = 'PerformanceDisplay';

/**
 * Production-ready Monaco-based code editor component with advanced features,
 * security enhancements, and comprehensive customization options
 */
const CodeEditor = memo(forwardRef<EditorActions, CodeEditorProps>(({
  value,
  defaultValue = '',
  language = 'javascript',
  theme = 'vs-dark',
  size,
  height = '400px',
  width = '100%',
  readOnly = false,
  lineNumbers = true,
  wordWrap = 'off',
  fontSize = 14,
  fontFamily = 'Fira Code',
  lineHeight = 1.5,
  fontWeight = 'normal',
  tabSize = 2,
  insertSpaces = true,
  minimap = true,
  folding = true,
  cursorStyle = 'line',
  cursorBlinking = 'blink',
  scrollbarVisibility = 'auto',
  advanced = {},
  className = '',
  style,
  loading = false,
  loadingComponent,
  showLanguageIndicator = true,
  showPerformanceMetrics = false,
  vimMode = false,
  emacsMode = false,
  keybindings = [],
  validationErrors = [],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  debounceDelay = 300,
  diffMode = false,
  originalValue,
  onChange,
  onMount,
  onUnmount,
  onValidationError,
  onCursorPositionChange,
  onSelectionChange,
  onFocus,
  onBlur,
  onKeyDown,
  onPerformanceUpdate,
  autocompleteSuggestions = [],
  hoverProviders = [],
  diagnosticProviders = []
}, ref) => {
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isControlled] = useState(value !== undefined);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  // Memoized values
  const editorSize = useMemo(() => ({
    width: size?.width || width,
    height: size?.height || height
  }), [size, width, height]);

  const currentValue = isControlled ? value || '' : internalValue;
  const debouncedValue = useDebounce(currentValue, debounceDelay);

  // Performance monitoring
  const performanceMetrics = usePerformanceMonitor(editorInstanceRef.current, onPerformanceUpdate);

  /**
   * Sanitize and validate content with security checks
   */
  const sanitizeAndValidate = useCallback((content: string): { sanitized: string; warnings: string[] } => {
    // Check file size
    if (!securityUtils.validateFileSize(content, maxFileSize)) {
      throw new Error(`File size exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    // Sanitize content
    const sanitized = securityUtils.sanitizeContent(content);
    
    // Detect dangerous patterns
    const warnings = securityUtils.detectDangerousPatterns(content);
    
    return { sanitized, warnings };
  }, [maxFileSize]);

  /**
   * Configure Monaco editor themes
   */
  const configureThemes = useCallback(() => {
    // Custom dark theme
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#c9d1d9',
        'editorLineNumber.foreground': '#6e7681',
        'editorCursor.foreground': '#58a6ff',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#21262d'
      }
    });

    // Custom light theme
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
        'editorLineNumber.foreground': '#656d76',
        'editorCursor.foreground': '#0969da'
      }
    });
  }, []);

  /**
   * Configure advanced editor options with comprehensive settings
   */
  const getEditorOptions = useCallback((): monaco.editor.IStandaloneEditorConstructionOptions => {
    const baseOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      value: currentValue,
      language,
      theme,
      readOnly,
      fontSize,
      fontFamily: `${fontFamily}, monospace`,
      fontWeight,
      lineHeight,
      tabSize,
      insertSpaces,
      wordWrap,
      lineNumbers: typeof lineNumbers === 'boolean' ? (lineNumbers ? 'on' : 'off') : lineNumbers,
      minimap: { enabled: minimap },
      folding,
      cursorStyle,
      cursorBlinking,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      mouseWheelZoom: true,
      multiCursorModifier: 'ctrlCmd',
      formatOnPaste: true,
      formatOnType: true,
      renderWhitespace: 'selection',
      renderControlCharacters: true,
      renderLineHighlight: 'line',
      renderLineHighlightOnlyWhenFocus: false,
      hideCursorInOverviewRuler: false,
      scrollbar: {
        vertical: scrollbarVisibility,
        horizontal: scrollbarVisibility,
        useShadows: true,
        verticalHasArrows: false,
        horizontalHasArrows: false
      },
      // Enhanced IntelliSense
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      wordBasedSuggestions: 'allDocuments',
      suggestSelection: 'first',
      quickSuggestions: {
        other: 'on',
        comments: 'on',
        strings: 'on'
      },
      quickSuggestionsDelay: 100,
      parameterHints: { enabled: true, cycle: true },
      hover: { enabled: true, delay: 300, sticky: true },
      contextmenu: true,
      // Advanced features
      bracketPairColorization: { enabled: advanced.bracketPairColorization ?? true },
      guides: { bracketPairs: true, indentation: true },
      autoClosingBrackets: advanced.autoClosingBrackets ?? 'languageDefined',
      autoClosingQuotes: advanced.autoClosingQuotes ?? 'languageDefined',
      autoSurround: advanced.autoSurround ?? 'languageDefined',
      linkedEditing: advanced.linkedEditing ?? false,
      rulers: advanced.rulers || [],
      showFoldingControls: 'mouseover',
      foldingStrategy: 'auto',
      foldingHighlight: true,
      unfoldOnClickAfterEndOfLine: false,
      showUnused: true,
      occurrencesHighlight: 'singleFile',
      selectionHighlight: true,
      codeLens: advanced.codeLens ?? true,
      lightbulb: { enabled: 'on' },
      codeActionsOnSaveTimeout: 2000,
      fixedOverflowWidgets: false,
      padding: { top: 10, bottom: 10 }
    };

    return baseOptions;
  }, [
    currentValue, language, theme, readOnly, fontSize, fontFamily, fontWeight, 
    lineHeight, tabSize, insertSpaces, wordWrap, lineNumbers, minimap, folding,
    cursorStyle, cursorBlinking, scrollbarVisibility, advanced
  ]);

  /**
   * Register comprehensive language providers
   */
  const registerLanguageProviders = useCallback(() => {
    const disposables: monaco.IDisposable[] = [];

    // Autocomplete provider
    if (autocompleteSuggestions.length > 0) {
      const completionDisposable = monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', '>', '::', '->', '<'],
        provideCompletionItems: (model, position, context) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };

          const suggestions: monaco.languages.CompletionItem[] = autocompleteSuggestions.map(suggestion => ({
            ...suggestion,
            range
          }));

          return { suggestions };
        }
      });
      disposables.push(completionDisposable);
    }

    // Hover providers
    hoverProviders.forEach(provider => {
      const hoverDisposable = monaco.languages.registerHoverProvider(language, provider);
      disposables.push(hoverDisposable);
    });

    // Diagnostic providers
    diagnosticProviders.forEach(provider => {
      const model = editorInstanceRef.current?.getModel();
      if (model) {
        const markers = provider(model);
        monaco.editor.setModelMarkers(model, 'custom', markers);
      }
    });

    return disposables;
  }, [language, autocompleteSuggestions, hoverProviders, diagnosticProviders]);

  /**
   * Set validation markers in the editor
   */
  const setValidationMarkers = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = validationErrors.map(error => ({
      startLineNumber: error.line,
      startColumn: error.column,
      endLineNumber: error.line,
      endColumn: error.column + 1,
      message: error.message,
      severity: error.severity === 'error' ? monaco.MarkerSeverity.Error :
                error.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                monaco.MarkerSeverity.Info
    }));

    monaco.editor.setModelMarkers(model, 'validation', markers);
  }, [validationErrors]);

  /**
   * Register custom keybindings
   */
  const registerKeybindings = useCallback(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return [];

    return keybindings.map(command => 
      editor.addCommand(
        command.keybinding ? monaco.KeyMod.CtrlCmd | monaco.KeyCode.fromString(command.keybinding).keyCode : 0,
        command.handler
      )
    );
  }, [keybindings]);

  /**
   * Create editor actions API
   */
  const createEditorActions = useCallback((editor: monaco.editor.IStandaloneCodeEditor): EditorActions => ({
    getValue: () => editor.getValue(),
    setValue: (newValue: string) => {
      try {
        const { sanitized, warnings } = sanitizeAndValidate(newValue);
        setSecurityWarnings(warnings);
        editor.setValue(sanitized);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to set value');
      }
    },
    insertText: (text: string) => {
      const selection = editor.getSelection();
      if (selection) {
        editor.executeEdits('insertText', [{
          range: selection,
          text,
          forceMoveMarkers: true
        }]);
      }
    },
    formatDocument: async () => {
      await editor.getAction('editor.action.formatDocument')?.run();
    },
    focus: () => editor.focus(),
    getSelection: () => editor.getSelection(),
    setSelection: (selection: monaco.IRange) => editor.setSelection(selection),
    undo: () => editor.trigger('keyboard', 'undo', null),
    redo: () => editor.trigger('keyboard', 'redo', null),
    findAndReplace: (findValue: string, replaceValue?: string) => {
      editor.trigger('keyboard', 'actions.find', null);
      if (replaceValue !== undefined) {
        editor.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
      }
    },
    goToLine: (line: number) => {
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: 1 });
    },
    getPerformanceMetrics: () => performanceMetrics
  }), [sanitizeAndValidate, performanceMetrics]);

  /**
   * Initialize Monaco editor with comprehensive configuration
   */
  const initializeEditor = useCallback(async () => {
    if (!editorRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Configure themes
      configureThemes();

      // Validate and sanitize initial content
      const { sanitized, warnings } = sanitizeAndValidate(currentValue);
      setSecurityWarnings(warnings);

      // Create editor instance
      const editorOptions = getEditorOptions();
      editorOptions.value = sanitized;

      const editor = diffMode && originalValue ?
        monaco.editor.createDiffEditor(editorRef.current, {
          ...editorOptions,
          originalEditable: false,
          renderSideBySide: true,
          ignoreTrimWhitespace: false
        }) as any : // Type assertion needed for diff editor
        monaco.editor.create(editorRef.current, editorOptions);

      editorInstanceRef.current = editor;

      // Set up diff mode if enabled
      if (diffMode && originalValue && 'setModel' in editor) {
        const originalModel = monaco.editor.createModel(originalValue, language);
        const modifiedModel = monaco.editor.createModel(sanitized, language);
        editor.setModel({
          original: originalModel,
          modified: modifiedModel
        });
      }

      // Register language providers
      const languageDisposables = registerLanguageProviders();
      disposablesRef.current.push(...languageDisposables);

      // Register keybindings
      const keybindingIds = registerKeybindings();

      // Set validation markers
      setValidationMarkers();

      // Set up event listeners
      const changeDisposable = editor.onDidChangeModelContent((e: monaco.editor.IModelContentChangedEvent) => {
        const newValue = editor.getValue();
        
        if (!isControlled) {
          setInternalValue(newValue);
        }
        
        onChange?.(newValue, e);
      });
      disposablesRef.current.push(changeDisposable);

      // Cursor position change
      if (onCursorPositionChange) {
        const cursorDisposable = editor.onDidChangeCursorPosition(e => {
          onCursorPositionChange(e.position);
        });
        disposablesRef.current.push(cursorDisposable);
      }

      // Selection change
      if (onSelectionChange) {
        const selectionDisposable = editor.onDidChangeCursorSelection(e => {
          onSelectionChange(e.selection);
        });
        disposablesRef.current.push(selectionDisposable);
      }

      // Focus events
      if (onFocus) {
        const focusDisposable = editor.onDidFocusEditorText