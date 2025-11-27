import express from 'express';
import { GoogleWorkspaceManager } from '../../integrations/google/workspace-manager.ts';
import { authenticateToken, authenticateApiKey } from './auth.ts';

const router = express.Router();

// Store workspace managers per user (in production, use proper session management)
const workspaceManagers = new Map<string, GoogleWorkspaceManager>();

// ============================================================
// GOOGLE OAUTH FLOW
// ============================================================

router.get('/auth/url', authenticateToken, (req, res) => {
  try {
    const workspace = new GoogleWorkspaceManager();
    const authUrl = workspace.getAuthUrl();

    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const workspace = new GoogleWorkspaceManager();
    const tokens = await workspace.getTokenFromCode(code);

    // Store tokens securely (in production, encrypt and store in database)
    res.json({
      success: true,
      message: 'Google Workspace connected successfully',
      tokens
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GMAIL OPERATIONS
// ============================================================

router.post('/gmail/send', authenticateToken, async (req, res) => {
  try {
    const { to, subject, body, html, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const result = await workspace.sendEmail({ to, subject, body, html });

    res.json({ success: true, messageId: result.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/gmail/messages', authenticateToken, async (req, res) => {
  try {
    const { accessToken, maxResults } = req.query;

    const workspace = new GoogleWorkspaceManager(accessToken as string);
    const messages = await workspace.getEmails(Number(maxResults) || 10);

    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DRIVE OPERATIONS
// ============================================================

router.post('/drive/folder', authenticateToken, async (req, res) => {
  try {
    const { name, parentId, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const folder = await workspace.createFolder(name, parentId);

    res.json({ folder });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/drive/upload', authenticateToken, async (req, res) => {
  try {
    const { name, mimeType, content, folderId, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const file = await workspace.uploadFile({ name, mimeType, content, folderId });

    res.json({ file });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/drive/files', authenticateToken, async (req, res) => {
  try {
    const { folderId, accessToken, maxResults } = req.query;

    const workspace = new GoogleWorkspaceManager(accessToken as string);
    const files = await workspace.listFiles(
      folderId as string | undefined,
      Number(maxResults) || 100
    );

    res.json({ files });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// CALENDAR OPERATIONS
// ============================================================

router.post('/calendar/event', authenticateToken, async (req, res) => {
  try {
    const { summary, description, start, end, attendees, location, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const event = await workspace.createEvent({
      summary,
      description,
      start: new Date(start),
      end: new Date(end),
      attendees,
      location
    });

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/calendar/events', authenticateToken, async (req, res) => {
  try {
    const { accessToken, maxResults } = req.query;

    const workspace = new GoogleWorkspaceManager(accessToken as string);
    const events = await workspace.getUpcomingEvents(Number(maxResults) || 10);

    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/calendar/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { summary, description, start, end, accessToken } = req.body;

    const updates: any = {};
    if (summary) updates.summary = summary;
    if (description) updates.description = description;
    if (start) updates.start = new Date(start);
    if (end) updates.end = new Date(end);

    const workspace = new GoogleWorkspaceManager(accessToken);
    const event = await workspace.updateEvent(eventId, updates);

    res.json({ event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// TASKS OPERATIONS
// ============================================================

router.post('/tasks/create', authenticateToken, async (req, res) => {
  try {
    const { title, notes, due, status, taskListId, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const task = await workspace.createTask(
      { title, notes, due: due ? new Date(due) : undefined, status },
      taskListId
    );

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tasks/list', authenticateToken, async (req, res) => {
  try {
    const { taskListId, accessToken } = req.query;

    const workspace = new GoogleWorkspaceManager(accessToken as string);
    const tasks = await workspace.getTasks(taskListId as string);

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks/:taskId/complete', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { taskListId, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const task = await workspace.completeTask(taskId, taskListId);

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// SHEETS OPERATIONS
// ============================================================

router.post('/sheets/create', authenticateToken, async (req, res) => {
  try {
    const { title, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const spreadsheet = await workspace.createSpreadsheet(title);

    res.json({ spreadsheet });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sheets/:spreadsheetId/write', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range, values, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const result = await workspace.writeToSheet(spreadsheetId, range, values);

    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sheets/:spreadsheetId/read', authenticateToken, async (req, res) => {
  try {
    const { spreadsheetId } = req.params;
    const { range, accessToken } = req.query;

    const workspace = new GoogleWorkspaceManager(accessToken as string);
    const values = await workspace.readFromSheet(spreadsheetId, range as string);

    res.json({ values });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DOCS OPERATIONS
// ============================================================

router.post('/docs/create', authenticateToken, async (req, res) => {
  try {
    const { title, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const document = await workspace.createDocument(title);

    res.json({ document });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/docs/:documentId/append', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { text, accessToken } = req.body;

    const workspace = new GoogleWorkspaceManager(accessToken);
    const result = await workspace.appendToDocument(documentId, text);

    res.json({ result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
