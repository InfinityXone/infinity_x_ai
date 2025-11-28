import express, { Request, Response, Router } from 'express';
import MonacoEditor from './monaco-editor';

/**
 * @typedef {Object} EditorOptions
 * @property {string} language
 * @property {string} code
 */

/**
 * @typedef {Object} EditorResponse
 * @property {string} html
 */

/**
 * Editor Route
 * @route GET /editor
 * @param {Request} req
 * @param {Response} res
 */
async function editorRoute(req: Request, res: Response): Promise<void> {
  try {
    const { language, code } = req.query;

    if (!language || !code) {
      throw new Error('Language and code are required');
    }

    const editor = new MonacoEditor();
    const html = await editor.getHtml(language as string, code as string);

    res.status(200).json({ html });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate editor html' });
  }
}

/**
 * Editor Router
 */
const editorRouter: Router = express.Router();

editorRouter.get('/editor', editorRoute);

export default editorRouter;