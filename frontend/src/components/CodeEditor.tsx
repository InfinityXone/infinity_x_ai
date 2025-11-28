import React, { useState, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useDebounce } from 'use-debounce';
import './monaco-editor.css';

/**
 * CodeEditor component with syntax highlighting, autocomplete, and multi-language support
 * 
 * @param {Object} props - Component props
 * @param {string} props.language - Programming language (e.g., 'javascript', 'typescript', 'json', 'css', 'html')
 * @param {string} props.value - Initial code value
 * @param {function} props.onChange - Callback function for code changes
 * @param {string} props.theme - Editor theme (e.g., 'vs', 'vs-dark', 'hc-black')
 * @param {number} props.width - Editor width
 * @param {number} props.height - Editor height
 * @returns {JSX.Element} CodeEditor component
 */
const CodeEditor: React.FC<{
  language: string;
  value: string;
  onChange: (value: string) => void;
  theme: string;
  width: number;
  height: number;
}> = ({
  language,
  value,
  onChange,
  theme,
  width,
  height,
}) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    // Initialize Monaco editor
    const editor = monaco.editor.create(document.getElementById('editor')!, {
      value: debouncedValue,
      language: language,
      theme: theme,
      automaticLayout: true,
      minimap: {
        enabled: false,
      },
    });

    // Add event listener for code changes
    editor.onDidChangeModelContent((event) => {
      const newValue = editor.getValue();
      onChange(newValue);
    });

    setEditor(editor);

    // Clean up
    return () => {
      editor.dispose();
    };
  }, [debouncedValue, language, theme, onChange]);

  useEffect(() => {
    // Set Monaco editor workers
    self.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === 'json') {
          return new jsonWorker();
        }
        if (label === 'css') {
          return new cssWorker();
        }
        if (label === 'html') {
          return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
          return new tsWorker();
        }
        return new editorWorker();
      },
    };
  }, []);

  return (
    <div
      className="h-full w-full"
      style={{
        height: height,
        width: width,
      }}
    >
      <div id="editor" className="h-full w-full"></div>
    </div>
  );
};

export default CodeEditor;