import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  | 'sql';

/**
 * Theme options for the code editor
 */
export type EditorTheme = 'vs' | 'vs-dark' | 'hc-black';

/**
 * Props for the CodeEditor component
 */
export interface CodeEditorProps {
  /** Initial code content */
  value?: string;
  /** Programming language for syntax highlighting */
  language?: SupportedLanguage;
  /** Editor theme */
  theme?: EditorTheme;
  /** Height of the editor */
  height?: string;
  /** Width of the editor */
  width?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Enable word wrap */
  wordWrap?: boolean;
  /** Font size */
  fontSize?: number;
  /** Tab size */
  tabSize?: number;
  /** Enable minimap */
  minimap?: boolean;
  /** Enable folding */
  folding?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when code content changes */
  onChange?: (value: string) => void;
  /** Callback when editor is ready */
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  /** Custom autocomplete suggestions */
  autocompleteSuggestions?: monaco.languages.CompletionItem[];
}

/**
 * Production-ready Monaco-based code editor component with syntax highlighting,
 * autocomplete, and multi-language support
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  width = '100%',
  readOnly = false,
  lineNumbers = true,
  wordWrap = false,
  fontSize = 14,
  tabSize = 2,
  minimap = true,
  folding = true,
  className = '',
  onChange,
  onMount,
  autocompleteSuggestions = []
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Configure Monaco editor options
   */
  const getEditorOptions = useCallback((): monaco.editor.IStandaloneEditorConstructionOptions => ({
    value,
    language,
    theme,
    readOnly,
    fontSize,
    tabSize,
    wordWrap: wordWrap ? 'on' : 'off',
    lineNumbers: lineNumbers ? 'on' : 'off',
    minimap: { enabled: minimap },
    folding,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    wordBasedSuggestions: true,
    parameterHints: { enabled: true },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    hover: { enabled: true },
    contextmenu: true,
    mouseWheelZoom: true,
    cursorBlinking: 'blink',
    cursorSmoothCaretAnimation: true,
    smoothScrolling: true,
    multiCursorModifier: 'ctrlCmd',
    formatOnPaste: true,
    formatOnType: true
  }), [
    value,
    language,
    theme,
    readOnly,
    fontSize,
    tabSize,
    wordWrap,
    lineNumbers,
    minimap,
    folding
  ]);

  /**
   * Register custom autocomplete provider
   */
  const registerAutocompletProvider = useCallback(() => {
    if (autocompleteSuggestions.length === 0) return;

    const disposable = monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems: (model, position) => {
        const suggestions: monaco.languages.CompletionItem[] = autocompleteSuggestions.map(suggestion => ({
          ...suggestion,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column
          }
        }));

        return { suggestions };
      }
    });

    return disposable;
  }, [language, autocompleteSuggestions]);

  /**
   * Initialize Monaco editor
   */
  const initializeEditor = useCallback(async () => {
    if (!editorRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Configure Monaco environment
      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1e1e1e'
        }
      });

      // Create editor instance
      const editor = monaco.editor.create(editorRef.current, getEditorOptions());
      editorInstanceRef.current = editor;

      // Register autocomplete provider
      const autocompletDisposable = registerAutocompletProvider();

      // Set up change listener
      const changeDisposable = editor.onDidChangeModelContent(() => {
        const currentValue = editor.getValue();
        onChange?.(currentValue);
      });

      // Handle editor mount
      onMount?.(editor);

      // Cleanup function
      return () => {
        changeDisposable.dispose();
        autocompletDisposable?.dispose();
        editor.dispose();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize editor');
    } finally {
      setIsLoading(false);
    }
  }, [getEditorOptions, onChange, onMount, registerAutocompletProvider]);

  /**
   * Update editor when props change
   */
  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (model && model.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);

  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    monaco.editor.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    editor.updateOptions({
      readOnly,
      fontSize,
      tabSize,
      wordWrap: wordWrap ? 'on' : 'off',
      lineNumbers: lineNumbers ? 'on' : 'off',
      minimap: { enabled: minimap },
      folding
    });
  }, [readOnly, fontSize, tabSize, wordWrap, lineNumbers, minimap, folding]);

  /**
   * Initialize editor on mount
   */
  useEffect(() => {
    const cleanup = initializeEditor();
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
    };
  }, []);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-8 ${className}`}
        style={{ height, width }}
      >
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">
            Editor Error
          </div>
          <div className="text-red-500 text-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10"
          style={{ height, width }}
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading editor...</span>
          </div>
        </div>
      )}
      
      <div
        ref={editorRef}
        className="w-full"
        style={{ height, width }}
      />
      
      {/* Language indicator */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-mono">
        {language}
      </div>
    </div>
  );
};

export default CodeEditor;