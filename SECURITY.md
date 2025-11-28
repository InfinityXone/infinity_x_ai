# 🔐 SECURITY POLICY - INFINITY X AI

## ⚠️ CRITICAL: Secret Management

This repository has been **security hardened**. All secrets have been removed from git history.

### ❌ NEVER COMMIT THESE FILES
```
.env                          # Environment variables with API keys
.env.*                        # Any env file variants
config/google-oauth-credentials.json
config/google-service-account.json
*.pem, *.key, *.p12          # Private keys
*secret*.json                 # Any file with "secret" in name
*credential*.json             # Any file with "credential" in name
```

### ✅ SAFE TO COMMIT
```
.env.example                  # Template with placeholder values
.env.template                 # Template with placeholder values
config/*.template.json        # Templates without real secrets
SECURITY.md                   # This file
```

---

## 🔑 Required Secrets Setup

### 1. Environment Variables (.env)
Copy `.env.template` to `.env` and fill in your secrets:
```bash
cp .env.template .env
```

Required variables:
| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | GitHub Settings > Developer Settings |
| `GROQ_API_KEY` | Groq AI API Key | https://console.groq.com/keys |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | https://console.anthropic.com |
| `OPENAI_API_KEY` | OpenAI/Copilot API Key | https://platform.openai.com/api-keys |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |

### 2. Google OAuth Credentials
Copy the template and fill in your credentials:
```bash
cp config/google-oauth-credentials.template.json config/google-oauth-credentials.json
```

### 3. Google Service Account (Optional)
Download from Google Cloud Console:
1. Go to IAM & Admin > Service Accounts
2. Create or select service account
3. Keys > Add Key > Create new key > JSON
4. Save as `config/google-service-account.json`

---

## 🚨 If Secrets Are Exposed

### Immediate Actions:
1. **Rotate ALL exposed secrets immediately**
2. **Revoke compromised API keys**
3. **Update credentials in all environments**

### Rotating Credentials:
```bash
# GitHub Token
# Go to: https://github.com/settings/tokens → Revoke → Create new

# Google OAuth
# Go to: https://console.cloud.google.com/apis/credentials → Delete → Create new

# AI API Keys
# Anthropic: https://console.anthropic.com/settings/keys
# OpenAI: https://platform.openai.com/api-keys
# Groq: https://console.groq.com/keys
```

---

## 🛡️ Security Best Practices

### Pre-commit Hooks
Consider adding pre-commit hooks to prevent accidental secret commits:
```bash
# Install pre-commit
npm install -g pre-commit

# Add to .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
```

### GitHub Secret Scanning
This repository has GitHub Secret Scanning enabled. If secrets are detected:
1. You'll receive an email alert
2. The secret will be flagged in the Security tab
3. Take immediate action to rotate

### Environment Separation
```
.env              → Local development (never commit)
.env.production   → Production secrets (never commit)
.env.staging      → Staging secrets (never commit)
.env.example      → Safe template (can commit)
```

---

## 📋 Security Checklist

Before pushing any code:
- [ ] No `.env` files in staged changes
- [ ] No hardcoded API keys in source code
- [ ] No credentials in JSON config files
- [ ] `.gitignore` includes all sensitive patterns
- [ ] Templates use placeholder values only

---

## 🔄 Secret Rotation Schedule

| Secret Type | Rotation Frequency | Last Rotated |
|-------------|-------------------|--------------|
| GitHub Token | Every 90 days | [UPDATE DATE] |
| Google OAuth | On exposure only | [UPDATE DATE] |
| AI API Keys | Every 180 days | [UPDATE DATE] |

---

## 📞 Security Contact

For security concerns or to report vulnerabilities:
- **Email**: info@infinityxonesystems.com
- **GitHub Issues**: Mark as `security` label

---

## 🏷️ Security Audit History

| Date | Action | Performed By |
|------|--------|--------------|
| 2025-11-28 | Initial security hardening - removed secrets from git history | GitHub Copilot |
| 2025-11-28 | Added comprehensive .gitignore | GitHub Copilot |
| 2025-11-28 | Created credential templates | GitHub Copilot |
