# Infinity AI Backend - Frontend Integration Guide

## 🚀 Quick Start

Your Infinity AI backend is now ready to connect with your Hostinger frontend!

### Backend URL
- **Local Development**: `http://localhost:3000`
- **Production**: Will be your deployed URL (Railway, Vercel, etc.)

---

## 🔐 Authentication Endpoints

### 1. Sign Up
```javascript
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

// Response:
{
  "message": "User created successfully",
  "user": {
    "id": "user_123...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-27T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Login
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Response: Same as signup
```

### 3. GitHub OAuth Login
```javascript
POST /api/auth/github
Content-Type: application/json

{
  "code": "github_oauth_code_from_callback"
}

// Response: Same as signup with githubId included
```

### 4. Get Current User
```javascript
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN

// Response:
{
  "user": {
    "id": "user_123...",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-11-27T...",
    "githubId": "12345" // if GitHub OAuth
  }
}
```

---

## 🤖 AI Chat Endpoints

### 1. Send Chat Message
```javascript
POST /api/ai/chat
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Explain quantum computing in simple terms",
  "complexity": "medium", // optional: "light" | "medium" | "heavy"
  "context": "Previous conversation..." // optional
}

// Response:
{
  "success": true,
  "response": {
    "text": "Quantum computing is...",
    "model": "gpt-4o",
    "provider": "openai",
    "tokensUsed": 245
  },
  "timestamp": "2025-11-27T..."
}
```

### 2. Check AI Status
```javascript
GET /api/ai/status

// Response:
{
  "status": "operational",
  "providers": {
    "openai": { "available": true, "priority": "primary" },
    "groq": { "available": true, "priority": "fallback" },
    "anthropic": { "available": false, "priority": "specialized" }
  },
  "recommendations": {
    "light": "openai",
    "medium": "openai",
    "heavy": "anthropic"
  }
}
```

### 3. Code Analysis
```javascript
POST /api/ai/analyze-code
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "code": "function example() { ... }",
  "language": "javascript"
}

// Response:
{
  "success": true,
  "analysis": "Code quality assessment: ...",
  "metadata": {
    "model": "gpt-4o",
    "provider": "openai",
    "tokensUsed": 180
  }
}
```

### 4. Code Generation
```javascript
POST /api/ai/generate-code
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "description": "Create a React component for user profile",
  "language": "typescript",
  "framework": "react"
}

// Response:
{
  "success": true,
  "code": "import React from 'react'...",
  "metadata": { ... }
}
```

---

## 📊 System Status Endpoints

### Governance Status
```javascript
GET /api/governance/status
Authorization: Bearer YOUR_JWT_TOKEN

// Returns all subsystems status
```

### Analytics
```javascript
GET /api/analytics/usage
Authorization: Bearer YOUR_JWT_TOKEN

// Returns usage statistics
```

---

## 💻 Frontend Implementation Examples

### React/Next.js Example

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function signup(email: string, password: string, name: string) {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

export async function chatWithAI(message: string, token: string, complexity: 'light' | 'medium' | 'heavy' = 'medium') {
  const response = await fetch(`${API_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, complexity })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

// components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { login } from '@/lib/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user, token } = await login(email, password);
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Vanilla JavaScript / Hostinger Horizons

```html
<!-- index.html -->
<script>
const API_URL = 'http://localhost:3000'; // Change to your deployed URL

// Login function
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const { user, token } = await response.json();
    
    // Store token
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
}

// Chat with AI
async function sendMessage() {
  const message = document.getElementById('message').value;
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Please login first');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message, complexity: 'medium' })
    });
    
    const data = await response.json();
    
    // Display response
    document.getElementById('response').textContent = data.response.text;
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Check if user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
  }
}
</script>
```

---

## 🔧 Environment Variables

Add these to your `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT Secret (generate a random secure string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Providers (already configured)
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
ANTHROPIC_API_KEY=sk-ant_...
```

---

## 🚀 Deployment

### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 3: Traditional VPS
```bash
# Build
pnpm build

# Start with PM2
pm2 start dist/api/server.js --name infinity-api
```

---

## 🌐 GitHub Pages Integration

Since your frontend is on Hostinger Horizons, you'll need to:

1. **Update CORS in backend** to allow your Hostinger domain
2. **Deploy backend** to Railway/Vercel/VPS
3. **Update API_URL** in frontend to point to deployed backend
4. **Set up GitHub OAuth** (optional) with your callback URL

---

## 📝 Next Steps

1. **Start the backend server**: `pnpm run api`
2. **Test endpoints** with curl or Postman
3. **Update your frontend** to use these APIs
4. **Deploy backend** to production
5. **Connect your Hostinger site** to the deployed backend

---

## 🛠️ Testing with cURL

```bash
# Health check
curl http://localhost:3000/health

# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Chat (replace TOKEN with actual JWT)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message":"Hello AI!","complexity":"medium"}'
```

---

## 🔒 Security Notes

- Always use HTTPS in production
- Store JWT securely (HttpOnly cookies recommended)
- Implement rate limiting (already included)
- Add input validation on frontend
- Never commit `.env` file
- Use environment variables for sensitive data
- Implement refresh tokens for long sessions
- Add CSRF protection for cookie-based auth

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT Best Practices](https://jwt.io/introduction)
- [GitHub OAuth Guide](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [CORS Configuration](https://expressjs.com/en/resources/middleware/cors.html)

---

Need help? Check the examples above or ask for specific integration assistance!
