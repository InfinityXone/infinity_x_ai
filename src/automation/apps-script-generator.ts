import { SmartAIRouter } from '../ai/smart-ai-router.ts';
import dotenv from 'dotenv';

dotenv.config();

export interface AppsScriptProject {
  name: string;
  description: string;
  files: AppsScriptFile[];
}

export interface AppsScriptFile {
  name: string;
  type: 'server_js' | 'html';
  content: string;
}

export class GoogleAppsScriptGenerator {
  private aiRouter: SmartAIRouter;

  constructor() {
    this.aiRouter = new SmartAIRouter();
  }

  // ============================================================
  // DRIVE AUTOMATION SCRIPTS
  // ============================================================

  async generateDriveSyncScript(
    sourceFolderId: string,
    targetFolderId: string
  ): Promise<AppsScriptProject> {
    console.log('📜 Generating Drive sync script...');

    const code = `
// Auto-generated Drive Sync Script
// Source: ${sourceFolderId}
// Target: ${targetFolderId}

function syncFolders() {
  const sourceFolder = DriveApp.getFolderById('${sourceFolderId}');
  const targetFolder = DriveApp.getFolderById('${targetFolderId}');
  
  Logger.log('Starting folder sync...');
  
  const sourceFiles = sourceFolder.getFiles();
  const targetFileNames = new Set();
  
  // Get existing files in target
  const targetFiles = targetFolder.getFiles();
  while (targetFiles.hasNext()) {
    targetFileNames.add(targetFiles.next().getName());
  }
  
  let syncedCount = 0;
  
  // Copy new or updated files
  while (sourceFiles.hasNext()) {
    const file = sourceFiles.next();
    const fileName = file.getName();
    const lastModified = file.getLastUpdated();
    
    if (!targetFileNames.has(fileName)) {
      // Copy new file
      file.makeCopy(fileName, targetFolder);
      Logger.log('Copied new file: ' + fileName);
      syncedCount++;
    } else {
      // Check if source is newer
      const targetFile = getFileByName(targetFolder, fileName);
      if (targetFile && file.getLastUpdated() > targetFile.getLastUpdated()) {
        // Update existing file
        targetFile.setTrashed(true);
        file.makeCopy(fileName, targetFolder);
        Logger.log('Updated file: ' + fileName);
        syncedCount++;
      }
    }
  }
  
  Logger.log('Sync complete. Files synced: ' + syncedCount);
  
  // Send notification email
  MailApp.sendEmail({
    to: '${process.env.GOOGLE_WORKSPACE_EMAIL}',
    subject: 'Drive Sync Complete',
    body: 'Synced ' + syncedCount + ' files from ' + sourceFolder.getName() + ' to ' + targetFolder.getName()
  });
}

function getFileByName(folder, fileName) {
  const files = folder.getFilesByName(fileName);
  return files.hasNext() ? files.next() : null;
}

// Set up daily trigger
function createTrigger() {
  ScriptApp.newTrigger('syncFolders')
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
  
  Logger.log('Daily sync trigger created');
}
`.trim();

    return {
      name: 'Drive Folder Sync',
      description: 'Automatically sync files between two Drive folders',
      files: [
        {
          name: 'Code',
          type: 'server_js',
          content: code
        }
      ]
    };
  }

  async generateDriveOrganizerScript(): Promise<AppsScriptProject> {
    console.log('📜 Generating Drive organizer script...');

    const code = `
// Auto-generated Drive Organizer Script
// Automatically organizes files into folders by type

function organizeDrive() {
  const rootFolder = DriveApp.getRootFolder();
  
  // Create organization folders
  const folders = {
    'Documents': getOrCreateFolder(rootFolder, 'Documents'),
    'Spreadsheets': getOrCreateFolder(rootFolder, 'Spreadsheets'),
    'Presentations': getOrCreateFolder(rootFolder, 'Presentations'),
    'PDFs': getOrCreateFolder(rootFolder, 'PDFs'),
    'Images': getOrCreateFolder(rootFolder, 'Images'),
    'Videos': getOrCreateFolder(rootFolder, 'Videos'),
    'Other': getOrCreateFolder(rootFolder, 'Other')
  };
  
  const files = rootFolder.getFiles();
  let organizedCount = 0;
  
  while (files.hasNext()) {
    const file = files.next();
    const mimeType = file.getMimeType();
    let targetFolder = folders['Other'];
    
    // Categorize by MIME type
    if (mimeType === MimeType.GOOGLE_DOCS || mimeType === MimeType.MICROSOFT_WORD) {
      targetFolder = folders['Documents'];
    } else if (mimeType === MimeType.GOOGLE_SHEETS || mimeType === MimeType.MICROSOFT_EXCEL) {
      targetFolder = folders['Spreadsheets'];
    } else if (mimeType === MimeType.GOOGLE_SLIDES || mimeType === MimeType.MICROSOFT_POWERPOINT) {
      targetFolder = folders['Presentations'];
    } else if (mimeType === MimeType.PDF) {
      targetFolder = folders['PDFs'];
    } else if (mimeType.indexOf('image/') === 0) {
      targetFolder = folders['Images'];
    } else if (mimeType.indexOf('video/') === 0) {
      targetFolder = folders['Videos'];
    }
    
    // Move file to appropriate folder
    file.moveTo(targetFolder);
    organizedCount++;
  }
  
  Logger.log('Organized ' + organizedCount + ' files');
  
  // Send summary email
  MailApp.sendEmail({
    to: '${process.env.GOOGLE_WORKSPACE_EMAIL}',
    subject: 'Drive Organization Complete',
    body: 'Organized ' + organizedCount + ' files into categorized folders'
  });
}

function getOrCreateFolder(parent, folderName) {
  const folders = parent.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parent.createFolder(folderName);
}

// Run weekly
function createTrigger() {
  ScriptApp.newTrigger('organizeDrive')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
}
`.trim();

    return {
      name: 'Drive Auto-Organizer',
      description: 'Automatically organize files by type',
      files: [
        {
          name: 'Code',
          type: 'server_js',
          content: code
        }
      ]
    };
  }

  // ============================================================
  // GMAIL AUTOMATION SCRIPTS
  // ============================================================

  async generateEmailAutoResponderScript(): Promise<AppsScriptProject> {
    console.log('📜 Generating email auto-responder script...');

    const code = `
// Auto-generated Email Auto-Responder Script

function autoRespondToEmails() {
  const label = GmailApp.getUserLabelByName('AutoRespond') || GmailApp.createLabel('AutoRespond');
  const threads = GmailApp.search('is:unread -label:AutoRespond');
  
  threads.forEach(thread => {
    const messages = thread.getMessages();
    const lastMessage = messages[messages.length - 1];
    
    if (!lastMessage.isUnread()) return;
    
    const sender = lastMessage.getFrom();
    const subject = lastMessage.getSubject();
    
    // Generate AI response (would integrate with your AI system)
    const response = generateResponse(lastMessage.getPlainBody());
    
    // Send auto-reply
    thread.reply(response);
    thread.addLabel(label);
    
    Logger.log('Auto-responded to: ' + sender);
  });
}

function generateResponse(emailBody) {
  // Simple auto-response - integrate with your AI system for smart responses
  return 'Thank you for your email. I have received your message and will respond as soon as possible.\\n\\n' +
         'This is an automated response from the Infinity AI system.\\n\\n' +
         'Best regards,\\n' +
         '${process.env.GOOGLE_WORKSPACE_EMAIL}';
}

// Run every 15 minutes
function createTrigger() {
  ScriptApp.newTrigger('autoRespondToEmails')
    .timeBased()
    .everyMinutes(15)
    .create();
}
`.trim();

    return {
      name: 'Email Auto-Responder',
      description: 'Automatically respond to incoming emails',
      files: [
        {
          name: 'Code',
          type: 'server_js',
          content: code
        }
      ]
    };
  }

  // ============================================================
  // CALENDAR AUTOMATION SCRIPTS
  // ============================================================

  async generateCalendarSummaryScript(): Promise<AppsScriptProject> {
    console.log('📜 Generating calendar summary script...');

    const code = `
// Auto-generated Calendar Summary Script

function sendDailySummary() {
  const calendar = CalendarApp.getDefaultCalendar();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const events = calendar.getEvents(today, tomorrow);
  
  let summary = 'Daily Calendar Summary for ' + Utilities.formatDate(today, Session.getScriptTimeZone(), 'MMMM dd, yyyy') + '\\n\\n';
  
  if (events.length === 0) {
    summary += 'No events scheduled for today.\\n';
  } else {
    summary += 'You have ' + events.length + ' events today:\\n\\n';
    
    events.forEach(event => {
      const startTime = Utilities.formatDate(event.getStartTime(), Session.getScriptTimeZone(), 'h:mm a');
      const endTime = Utilities.formatDate(event.getEndTime(), Session.getScriptTimeZone(), 'h:mm a');
      
      summary += '• ' + startTime + ' - ' + endTime + ': ' + event.getTitle() + '\\n';
      
      if (event.getLocation()) {
        summary += '  Location: ' + event.getLocation() + '\\n';
      }
      
      if (event.getDescription()) {
        summary += '  Notes: ' + event.getDescription() + '\\n';
      }
      
      summary += '\\n';
    });
  }
  
  MailApp.sendEmail({
    to: '${process.env.GOOGLE_WORKSPACE_EMAIL}',
    subject: 'Your Daily Calendar Summary',
    body: summary
  });
  
  Logger.log('Daily summary sent');
}

// Run every morning at 7 AM
function createTrigger() {
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
}
`.trim();

    return {
      name: 'Calendar Daily Summary',
      description: 'Send daily calendar summary email',
      files: [
        {
          name: 'Code',
          type: 'server_js',
          content: code
        }
      ]
    };
  }

  // ============================================================
  // SHEETS AUTOMATION SCRIPTS
  // ============================================================

  async generateDataLoggerScript(spreadsheetId: string): Promise<AppsScriptProject> {
    console.log('📜 Generating data logger script...');

    const code = `
// Auto-generated Data Logger Script
// Spreadsheet ID: ${spreadsheetId}

function logData(data) {
  const ss = SpreadsheetApp.openById('${spreadsheetId}');
  const sheet = ss.getSheetByName('Log') || ss.insertSheet('Log');
  
  const timestamp = new Date();
  const row = [timestamp, ...Object.values(data)];
  
  sheet.appendRow(row);
  Logger.log('Data logged: ' + JSON.stringify(data));
}

function logSystemMetrics() {
  const data = {
    cpu: Math.random() * 100, // Replace with actual metrics
    memory: Math.random() * 100,
    requests: Math.floor(Math.random() * 1000),
    errors: Math.floor(Math.random() * 10)
  };
  
  logData(data);
}

// Web endpoint for external systems to log data
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    logData(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Run every hour
function createTrigger() {
  ScriptApp.newTrigger('logSystemMetrics')
    .timeBased()
    .everyHours(1)
    .create();
}
`.trim();

    return {
      name: 'Data Logger',
      description: 'Log data to Google Sheets automatically',
      files: [
        {
          name: 'Code',
          type: 'server_js',
          content: code
        }
      ]
    };
  }

  // ============================================================
  // AI-POWERED SCRIPT GENERATION
  // ============================================================

  async generateCustomScript(description: string): Promise<AppsScriptProject> {
    console.log('🤖 Generating custom Apps Script using AI...');

    const prompt = `Generate a complete Google Apps Script based on this description:

${description}

Requirements:
- Use Google Apps Script API (DriveApp, GmailApp, CalendarApp, SpreadsheetApp, etc.)
- Include error handling
- Add logging
- Include setup instructions
- Create any necessary triggers
- Use email: ${process.env.GOOGLE_WORKSPACE_EMAIL}

Provide only the JavaScript code, properly formatted.`;

    const response = await this.aiRouter.think(prompt, 'heavy');

    // Extract code from AI response
    const codeMatch = response.text.match(/\`\`\`(?:javascript|js)?\n([\s\S]*?)\`\`\`/);
    const code = codeMatch ? codeMatch[1] : response.text;

    return {
      name: 'Custom Script',
      description,
      files: [
        {
          name: 'Code',
          type: 'server_js',
          content: code.trim()
        }
      ]
    };
  }

  // ============================================================
  // SCRIPT DEPLOYMENT
  // ============================================================

  async generateDeploymentInstructions(project: AppsScriptProject): Promise<string> {
    return `
# Deployment Instructions for "${project.name}"

${project.description}

## Setup Steps:

1. **Open Google Apps Script**
   - Go to: https://script.google.com
   - Click "New Project"

2. **Add the Code**
   ${project.files.map((file, idx) => `
   ${idx + 1}. Create file: ${file.name}.gs
   - Paste the following code:
   
   \`\`\`javascript
   ${file.content}
   \`\`\`
   `).join('\n')}

3. **Enable Required APIs**
   - Click on "Services" (+) in the left sidebar
   - Add the necessary Google services

4. **Set Up Triggers**
   - Run the \`createTrigger()\` function once to set up automation
   - Or manually create triggers in the "Triggers" section

5. **Test the Script**
   - Run the main function to test
   - Check the "Executions" log for any errors

6. **Grant Permissions**
   - When prompted, grant the necessary permissions
   - Review and authorize the script

## Notes:
- Make sure to update any hardcoded IDs or emails
- Test thoroughly before relying on automated execution
- Monitor the execution logs regularly

For support: ${process.env.GOOGLE_WORKSPACE_EMAIL}
`.trim();
  }
}
