interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Language {
  id: number;
  name: string;
  extension: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CodeFile {
  id: number;
  name: string;
  content: string;
  languageId: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface SyntaxHighlightingRule {
  id: number;
  languageId: number;
  pattern: string;
  style: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AutocompleteSuggestion {
  id: number;
  languageId: number;
  trigger: string;
  suggestion: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CodeFileHistory {
  id: number;
  codeFileId: number;
  content: string;
  createdAt: Date;
}

interface CodeFileShare {
  id: number;
  codeFileId: number;
  userId: number;
  permission: 'read' | 'write' | 'owner';
  createdAt: Date;
}

interface CodeFileComment {
  id: number;
  codeFileId: number;
  userId: number;
  content: string;
  createdAt: Date;
}

interface CodeFileTag {
  id: number;
  codeFileId: number;
  tag: string;
  createdAt: Date;
}