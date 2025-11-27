# 🚀 Hostinger Horizons Integration Guide
## Connect infinityxonesystems.com to Infinity AI Backend

This guide provides everything you need to integrate your Hostinger Horizons frontend with the Infinity AI backend system, including Google Workspace automation and AI chat.

---

## 📋 Table of Contents

1. [API Key Setup](#api-key-setup)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Integration](#frontend-integration)
4. [Google Workspace Features](#google-workspace-features)
5. [Autonomous Scheduling](#autonomous-scheduling)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## 🔑 API Key Setup

### Your Hostinger API Key

```
infinity-ai-chat-key-2025-secure-token-change-in-production
```

**⚠️ IMPORTANT**: Change this in production! Update in `.env`:
```bash
HOSTINGER_API_KEY=your-secure-random-key-here
```

### How to Use the API Key

Include the API key in all requests to the backend:

```javascript
const API_URL = 'https://your-backend-url.com'; // Update with deployed URL
const API_KEY = 'infinity-ai-chat-key-2025-secure-token-change-in-production';

async function callAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  return await response.json();
}
```

---

## ⚙️ Backend Configuration

### Required Environment Variables

Your backend is configured with:

```env
# Frontend
FRONTEND_URL=https://infinityxonesystems.com

# Google Workspace
GOOGLE_WORKSPACE_EMAIL=info@infinityxonesystems.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Key for Hostinger
HOSTINGER_API_KEY=infinity-ai-chat-key-2025-secure-token-change-in-production
```

### Deploy Backend

**Option 1: Railway (Recommended)**
```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Deploy
railway init
railway up
```

**Option 2: Vercel**
```bash
npm install -g vercel
vercel --prod
```

**Option 3: Your VPS**
```bash
# On your server
git clone your-repo
cd infinity_x_ai
pnpm install
pnpm run api
```

---

## 🎨 Frontend Integration

### 1. AI Chat Integration

Add this to your Hostinger Horizons site:

```html
<!-- AI Chat Widget -->
<div id="ai-chat-container">
  <div id="chat-messages"></div>
  <div id="chat-input-area">
    <input type="text" id="chat-input" placeholder="Ask Infinity AI anything...">
    <button onclick="sendMessage()">Send</button>
  </div>
</div>

<style>
  #ai-chat-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
  }

  #chat-messages {
    height: 400px;
    overflow-y: auto;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9f9f9;
    border-radius: 4px;
  }

  .message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 4px;
  }

  .user-message {
    background: #007bff;
    color: white;
    text-align: right;
  }

  .ai-message {
    background: #e9ecef;
    color: #333;
  }

  #chat-input-area {
    display: flex;
    gap: 10px;
  }

  #chat-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }

  button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }

  button:hover {
    background: #0056b3;
  }

  .loading {
    opacity: 0.6;
    pointer-events: none;
  }
</style>

<script>
  const API_URL = 'https://your-deployed-backend.railway.app'; // UPDATE THIS
  const API_KEY = 'infinity-ai-chat-key-2025-secure-token-change-in-production';

  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';

    // Show loading
    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.classList.add('loading');

    try {
      // Call AI API
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          message: message,
          complexity: 'medium'
        })
      });

      const data = await response.json();

      if (data.success) {
        addMessageToChat(data.response.text, 'ai');
      } else {
        addMessageToChat('Error: ' + (data.error || 'Unknown error'), 'ai');
      }
    } catch (error) {
      addMessageToChat('Error connecting to AI: ' + error.message, 'ai');
    } finally {
      messagesDiv.classList.remove('loading');
    }
  }

  function addMessageToChat(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Allow Enter key to send message
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
</script>
```

### 2. Contact Form with Email Integration

```html
<!-- Contact Form -->
<form id="contact-form" onsubmit="submitContact(event)">
  <input type="text" name="name" placeholder="Your Name" required>
  <input type="email" name="email" placeholder="Your Email" required>
  <textarea name="message" placeholder="Your Message" required></textarea>
  <button type="submit">Send Message</button>
</form>

<script>
  async function submitContact(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      // Send email via your backend (after Google OAuth setup)
      const response = await fetch(`${API_URL}/api/google/gmail/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          to: 'info@infinityxonesystems.com',
          subject: `Contact Form: ${data.name}`,
          body: `From: ${data.name} <${data.email}>\\n\\n${data.message}`,
          accessToken: 'YOUR_GOOGLE_ACCESS_TOKEN' // Get from OAuth flow
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Message sent successfully!');
        form.reset();
      } else {
        alert('Error sending message: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
</script>
```

### 3. Simple API Status Checker

```html
<!-- API Status Widget -->
<div id="api-status">
  <h3>System Status</h3>
  <div id="status-display">Checking...</div>
</div>

<script>
  async function checkAPIStatus() {
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      
      if (data.status === 'healthy') {
        document.getElementById('status-display').innerHTML = 
          `<span style="color: green;">✓ Online</span> - ${data.service}`;
      }
    } catch (error) {
      document.getElementById('status-display').innerHTML = 
        `<span style="color: red;">✗ Offline</span>`;
    }
  }

  // Check status on load
  checkAPIStatus();
  
  // Check every 30 seconds
  setInterval(checkAPIStatus, 30000);
</script>
```

---

## 📧 Google Workspace Features

### Email your system

All emails to **info@infinityxonesystems.com** are managed through the backend.

### Available Google Workspace APIs

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Send Email | `POST /api/google/gmail/send` | Send emails from info@infinityxonesystems.com |
| Read Emails | `GET /api/google/gmail/messages` | Get recent emails |
| Create Folder | `POST /api/google/drive/folder` | Create Drive folders |
| Upload File | `POST /api/google/drive/upload` | Upload to Drive |
| List Files | `GET /api/google/drive/files` | List Drive files |
| Create Event | `POST /api/google/calendar/event` | Add calendar event |
| Get Events | `GET /api/google/calendar/events` | List upcoming events |
| Create Task | `POST /api/google/tasks/create` | Add Google Task |
| List Tasks | `GET /api/google/tasks/list` | Get tasks |
| Create Sheet | `POST /api/google/sheets/create` | New spreadsheet |
| Write to Sheet | `POST /api/google/sheets/:id/write` | Update cells |
| Create Doc | `POST /api/google/docs/create` | New document |

### Example: Send Email from Frontend

```javascript
async function sendEmailFromSite(toEmail, subject, body) {
  const response = await fetch(`${API_URL}/api/google/gmail/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      to: toEmail,
      subject: subject,
      body: body,
      accessToken: localStorage.getItem('google_access_token')
    })
  });

  return await response.json();
}
```

---

## 📅 Autonomous Scheduling

### Start the Scheduler

```javascript
async function startScheduler() {
  const response = await fetch(`${API_URL}/api/scheduler/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      accessToken: localStorage.getItem('google_access_token')
    })
  });

  return await response.json();
}
```

### Schedule a Task

```javascript
async function scheduleTask(title, description, dateTime) {
  const response = await fetch(`${API_URL}/api/scheduler/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      title: title,
      description: description,
      scheduledFor: dateTime,
      priority: 'high',
      type: 'task'
    })
  });

  return await response.json();
}

// Example usage:
// scheduleTask('Follow up with client', 'Send proposal email', '2025-12-01T10:00:00');
```

### Create Meeting

```javascript
async function createMeeting(title, attendees, startTime, duration) {
  const response = await fetch(`${API_URL}/api/scheduler/quick/meeting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      title: title,
      attendees: attendees, // Array of emails
      startTime: startTime,
      durationHours: duration
    })
  });

  return await response.json();
}

// Example:
// createMeeting('Team Meeting', ['team@example.com'], '2025-12-01T14:00:00', 1);
```

---

## 🧪 Testing

### Test API Key Authentication

```bash
curl -X POST https://your-backend.railway.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: infinity-ai-chat-key-2025-secure-token-change-in-production" \
  -d '{"message": "Hello, Infinity AI!"}'
```

Expected response:
```json
{
  "success": true,
  "response": {
    "text": "Hello! How can I assist you today?",
    "model": "gpt-4o-mini",
    "provider": "openai"
  }
}
```

### Test from Browser Console

Open your Hostinger site, press F12, and run:

```javascript
fetch('https://your-backend.railway.app/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'infinity-ai-chat-key-2025-secure-token-change-in-production'
  },
  body: JSON.stringify({ message: 'Test message' })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## 🚀 Deployment Checklist

### Backend Deployment

- [ ] Deploy backend to Railway/Vercel/VPS
- [ ] Update `FRONTEND_URL` in `.env` to `https://infinityxonesystems.com`
- [ ] Change `HOSTINGER_API_KEY` to secure random string
- [ ] Set up Google Cloud Project and OAuth credentials
- [ ] Download Google Service Account JSON key
- [ ] Enable all required Google APIs (Gmail, Drive, Calendar, Tasks, Sheets, Docs)
- [ ] Test health endpoint: `https://your-backend.com/health`

### Frontend Integration

- [ ] Update `API_URL` in all frontend code to your deployed backend URL
- [ ] Update `API_KEY` to match your production key
- [ ] Add AI chat widget to Hostinger site
- [ ] Add contact form with email integration
- [ ] Test API key authentication
- [ ] Implement Google OAuth flow for user access tokens

### Google Workspace Setup

- [ ] Create Google Cloud Project: https://console.cloud.google.com
- [ ] Enable APIs: Gmail, Drive, Calendar, Tasks, Sheets, Docs
- [ ] Create OAuth 2.0 credentials
- [ ] Add `https://infinityxonesystems.com` to authorized origins
- [ ] Add redirect URIs for OAuth callback
- [ ] Create Service Account for backend automation
- [ ] Download Service Account JSON key
- [ ] Grant Service Account access to info@infinityxonesystems.com

---

## 📝 API Key Security

### Best Practices

1. **Never commit API keys to git**
2. **Use environment variables**
3. **Rotate keys regularly**
4. **Use HTTPS only**
5. **Implement rate limiting**
6. **Monitor API usage**

### Generating Secure API Key

```javascript
// Generate a new secure API key
const crypto = require('crypto');
const newApiKey = crypto.randomBytes(32).toString('hex');
console.log('New API Key:', newApiKey);
```

---

## 🆘 Support

- **Email**: info@infinityxonesystems.com
- **Backend URL**: https://your-backend-url.railway.app
- **Frontend URL**: https://infinityxonesystems.com

---

## 🎉 You're Ready!

Your Hostinger Horizons frontend at **infinityxonesystems.com** is now connected to your Infinity AI backend with:

✅ AI Chat System  
✅ Google Workspace Integration (info@infinityxonesystems.com)  
✅ Autonomous Scheduling  
✅ Email Automation  
✅ Drive Management  
✅ Calendar Integration  
✅ Task Management  
✅ Sheets & Docs Automation  

**Start building amazing AI-powered features! 🚀**
