# 🔑 Hostinger API Key - Quick Reference

## Your API Key
```
infinity-ai-chat-key-2025-secure-token-change-in-production
```

⚠️ **CHANGE THIS IN PRODUCTION!**

---

## Usage in Hostinger Horizons

### JavaScript Fetch Example
```javascript
const API_URL = 'https://your-backend-url.railway.app';
const API_KEY = 'infinity-ai-chat-key-2025-secure-token-change-in-production';

// Send chat message
async function chatWithAI(message) {
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

  return await response.json();
}

// Usage
chatWithAI('Hello, Infinity AI!')
  .then(data => console.log(data.response.text));
```

### cURL Test
```bash
curl -X POST https://your-backend.railway.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: infinity-ai-chat-key-2025-secure-token-change-in-production" \
  -d '{"message": "Test"}'
```

---

## Available Endpoints (No JWT Required!)

### AI Chat
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/status` - Check AI system status

### Google Workspace (Requires Google OAuth token)
- `POST /api/google/gmail/send` - Send email
- `GET /api/google/gmail/messages` - Read emails
- `POST /api/google/drive/folder` - Create Drive folder
- `POST /api/google/drive/upload` - Upload file to Drive
- `POST /api/google/calendar/event` - Create calendar event
- `GET /api/google/calendar/events` - List events
- `POST /api/google/tasks/create` - Create task
- `POST /api/google/sheets/create` - Create spreadsheet
- `POST /api/google/docs/create` - Create document

### Autonomous Scheduler (Requires Google OAuth token)
- `POST /api/scheduler/start` - Start autonomous scheduler
- `POST /api/scheduler/task` - Schedule a task
- `GET /api/scheduler/tasks` - List all tasks
- `POST /api/scheduler/quick/meeting` - Quick meeting creation
- `POST /api/scheduler/quick/daily` - Daily recurring task

---

## Google Workspace Email
```
info@infinityxonesystems.com
```

All emails managed through Google Workspace integration.

---

## Frontend URL
```
https://infinityxonesystems.com
```

Backend CORS configured for this domain.

---

## Security Notes

1. Always use HTTPS in production
2. Never expose API key in client-side code (use backend proxy)
3. Rotate API key regularly
4. Monitor API usage
5. Implement rate limiting on your end if needed

---

## Generate New Secure API Key

```bash
# PowerShell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[System.Convert]::ToBase64String($bytes)

# Node.js
require('crypto').randomBytes(32).toString('hex')
```

Then update in `.env`:
```env
HOSTINGER_API_KEY=your-new-secure-key-here
```

---

## Need Help?

📖 Full guide: `docs/HOSTINGER_INTEGRATION.md`
📧 Email: info@infinityxonesystems.com
