import express, { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Language, Languages } from 'monaco-editor';
import { languages } from 'monaco-editor/esm/vs/language/json/json.contribution';
import { createConnection, Connection } from 'typeorm';

const app = express();
app.use(express.json());

interface CodeRequest {
  code: string;
  language: string;
}

interface CodeResponse {
  code: string;
  language: string;
  highlightedCode: string;
  autocompleteSuggestions: string[];
}

const validateCodeRequest = [
  (req: Request) => {
    req.assert('code', 'Code is required').notEmpty();
    req.assert('language', 'Language is required').notEmpty();
    return req;
  },
  (req: Request, res: Response, next: () => void) => {
    const errors = req.validationErrors();
    if (errors) {
      return res.status(400).json({ errors: errors.map((err) => err.msg) });
    }
    next();
  },
];

app.get('/api/code', async (req: Request, res: Response) => {
  try {
    const supportedLanguages = Object.keys(Languages);
    return res.status(200).json({ supportedLanguages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve supported languages' });
  }
});

app.post('/api/code', validateCodeRequest, async (req: Request, res: Response) => {
  try {
    const codeRequest: CodeRequest = req.body;
    const code = codeRequest.code;
    const language = codeRequest.language;

    if (!Languages[language]) {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    const highlightedCode = getHighlightedCode(code, language);
    const autocompleteSuggestions = getAutocompleteSuggestions(code, language);

    const response: CodeResponse = {
      code,
      language,
      highlightedCode,
      autocompleteSuggestions,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process code' });
  }
});

function getHighlightedCode(code: string, language: string): string {
  // Use Monaco editor to highlight code
  const languageConfig = Languages[language];
  const highlightedCode = code;
  // Apply highlighting rules
  return highlightedCode;
}

function getAutocompleteSuggestions(code: string, language: string): string[] {
  // Use Monaco editor to get autocomplete suggestions
  const suggestions: string[] = [];
  // Apply autocomplete rules
  return suggestions;
}

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});