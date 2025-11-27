import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
}

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: string[];
  location?: string;
}

export interface Task {
  title: string;
  notes?: string;
  due?: Date;
  status?: 'needsAction' | 'completed';
}

export interface DriveFile {
  name: string;
  mimeType: string;
  content?: string;
  folderId?: string;
}

export class GoogleWorkspaceManager {
  private oauth2Client: OAuth2Client;
  private gmail: any;
  private drive: any;
  private calendar: any;
  private tasks: any;
  private sheets: any;
  private docs: any;

  constructor(accessToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (accessToken) {
      this.oauth2Client.setCredentials({ access_token: accessToken });
    }

    // Initialize Google APIs
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    this.tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
    this.sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });
    this.docs = google.docs({ version: 'v1', auth: this.oauth2Client });
  }

  // ============================================================
  // GMAIL OPERATIONS
  // ============================================================

  async sendEmail(message: EmailMessage): Promise<any> {
    const email = [
      `To: ${message.to}`,
      `From: ${process.env.GOOGLE_WORKSPACE_EMAIL}`,
      `Subject: ${message.subject}`,
      message.html ? 'Content-Type: text/html; charset=utf-8' : 'Content-Type: text/plain; charset=utf-8',
      '',
      message.body
    ].join('\n');

    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log(`📧 Email sent to ${message.to}: ${response.data.id}`);
    return response.data;
  }

  async getEmails(maxResults: number = 10): Promise<any[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults
    });

    const messages = response.data.messages || [];
    const fullMessages = [];

    for (const message of messages) {
      const msg = await this.gmail.users.messages.get({
        userId: 'me',
        id: message.id
      });
      fullMessages.push(msg.data);
    }

    return fullMessages;
  }

  // ============================================================
  // GOOGLE DRIVE OPERATIONS
  // ============================================================

  async createFolder(name: string, parentId?: string): Promise<any> {
    const fileMetadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    });

    console.log(`📁 Created folder: ${name} (${response.data.id})`);
    return response.data;
  }

  async uploadFile(file: DriveFile): Promise<any> {
    const fileMetadata: any = {
      name: file.name,
      mimeType: file.mimeType
    };

    if (file.folderId) {
      fileMetadata.parents = [file.folderId];
    }

    const media = {
      mimeType: file.mimeType,
      body: file.content || ''
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink'
    });

    console.log(`📄 Uploaded file: ${file.name} (${response.data.id})`);
    return response.data;
  }

  async listFiles(folderId?: string, maxResults: number = 100): Promise<any[]> {
    const query = folderId ? `'${folderId}' in parents` : undefined;

    const response = await this.drive.files.list({
      q: query,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime, webViewLink)'
    });

    return response.data.files || [];
  }

  async syncFolder(localPath: string, driveFolder: string): Promise<void> {
    console.log(`🔄 Syncing ${localPath} with Google Drive folder: ${driveFolder}`);
    // This would integrate with rclone or rsync for bidirectional sync
    // Implementation depends on whether you want to use Node.js native or shell commands
  }

  // ============================================================
  // GOOGLE CALENDAR OPERATIONS
  // ============================================================

  async createEvent(event: CalendarEvent): Promise<any> {
    const eventData: any = {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'America/Los_Angeles'
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'America/Los_Angeles'
      }
    };

    if (event.attendees && event.attendees.length > 0) {
      eventData.attendees = event.attendees.map(email => ({ email }));
    }

    if (event.location) {
      eventData.location = event.location;
    }

    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData
    });

    console.log(`📅 Created calendar event: ${event.summary} (${response.data.id})`);
    return response.data;
  }

  async getUpcomingEvents(maxResults: number = 10): Promise<any[]> {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<any> {
    const eventData: any = {};

    if (updates.summary) eventData.summary = updates.summary;
    if (updates.description) eventData.description = updates.description;
    if (updates.start) {
      eventData.start = {
        dateTime: updates.start.toISOString(),
        timeZone: 'America/Los_Angeles'
      };
    }
    if (updates.end) {
      eventData.end = {
        dateTime: updates.end.toISOString(),
        timeZone: 'America/Los_Angeles'
      };
    }

    const response = await this.calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: eventData
    });

    console.log(`📅 Updated calendar event: ${eventId}`);
    return response.data;
  }

  // ============================================================
  // GOOGLE TASKS OPERATIONS
  // ============================================================

  async createTask(task: Task, taskListId: string = '@default'): Promise<any> {
    const taskData: any = {
      title: task.title,
      notes: task.notes,
      status: task.status || 'needsAction'
    };

    if (task.due) {
      taskData.due = task.due.toISOString();
    }

    const response = await this.tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: taskData
    });

    console.log(`✅ Created task: ${task.title} (${response.data.id})`);
    return response.data;
  }

  async getTasks(taskListId: string = '@default'): Promise<any[]> {
    const response = await this.tasks.tasks.list({
      tasklist: taskListId
    });

    return response.data.items || [];
  }

  async completeTask(taskId: string, taskListId: string = '@default'): Promise<any> {
    const response = await this.tasks.tasks.update({
      tasklist: taskListId,
      task: taskId,
      requestBody: {
        id: taskId,
        status: 'completed'
      }
    });

    console.log(`✅ Completed task: ${taskId}`);
    return response.data;
  }

  // ============================================================
  // GOOGLE SHEETS OPERATIONS
  // ============================================================

  async createSpreadsheet(title: string): Promise<any> {
    const response = await this.sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title
        }
      }
    });

    console.log(`📊 Created spreadsheet: ${title} (${response.data.spreadsheetId})`);
    return response.data;
  }

  async writeToSheet(
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<any> {
    const response = await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });

    console.log(`📊 Updated ${response.data.updatedCells} cells in spreadsheet`);
    return response.data;
  }

  async readFromSheet(spreadsheetId: string, range: string): Promise<any[][]> {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    return response.data.values || [];
  }

  // ============================================================
  // GOOGLE DOCS OPERATIONS
  // ============================================================

  async createDocument(title: string): Promise<any> {
    const response = await this.docs.documents.create({
      requestBody: {
        title
      }
    });

    console.log(`📝 Created document: ${title} (${response.data.documentId})`);
    return response.data;
  }

  async appendToDocument(documentId: string, text: string): Promise<any> {
    // First, get the document to find the end index
    const doc = await this.docs.documents.get({ documentId });
    const endIndex = doc.data.body.content[doc.data.body.content.length - 1].endIndex || 1;

    const response = await this.docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: {
                index: endIndex - 1
              },
              text
            }
          }
        ]
      }
    });

    console.log(`📝 Appended text to document: ${documentId}`);
    return response.data;
  }

  // ============================================================
  // OAUTH FLOW
  // ============================================================

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  }

  async getTokenFromCode(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }
}
