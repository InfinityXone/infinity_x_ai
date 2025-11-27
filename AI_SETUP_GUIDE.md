# 🤖 AI Provider Setup Guide

The Infinity X AI platform uses **smart AI routing** to optimize costs and performance:

- **Groq (Free)** - Fast inference for light/medium tasks
- **Anthropic (Paid)** - Powerful reasoning for heavy/complex tasks

## 🚀 Quick Setup

### Option 1: Free Tier Only (Groq)

1. Get free Groq API key: https://console.groq.com/keys
2. Create `.env` file:
   ```env
   GROQ_API_KEY=gsk_your_groq_key_here
   ```
3. Run any system - it will use Groq for all tasks!

### Option 2: Hybrid (Recommended)

1. Get free Groq key: https://console.groq.com/keys
2. Get Anthropic key: https://console.anthropic.com/
3. Create `.env` file:
   ```env
   GROQ_API_KEY=gsk_your_groq_key_here
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
   ```
4. System automatically routes:
   - **Light tasks** → Groq (free)
   - **Medium tasks** → Groq (free)
   - **Heavy tasks** → Anthropic (paid)

### Option 3: Premium Only (Anthropic)

1. Get Anthropic key: https://console.anthropic.com/
2. Create `.env` file:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
   ```

## 🎯 How Smart Routing Works

The system automatically selects the best AI provider based on task complexity:

### Task Complexity Levels

| Complexity | Examples | Default Provider |
|------------|----------|------------------|
| **Light** | Simple analysis, categorization, tagging | Groq (free) |
| **Medium** | Code generation, summarization, Q&A | Groq (free) |
| **Heavy** | Strategic planning, complex reasoning, multi-step analysis | Anthropic (paid) |

### Fallback Logic

- If Groq fails → Falls back to Anthropic
- If Anthropic fails → Falls back to Groq
- If neither available → Clear error message

## 💰 Cost Optimization

### Free Tier (Groq Only)
- **Cost:** $0
- **Capability:** ~70-80% of tasks
- **Models:** Llama 3.3 70B
- **Best for:** Development, testing, light production

### Hybrid (Recommended)
- **Cost:** Minimal (only heavy tasks use paid API)
- **Capability:** 100% of tasks
- **Strategy:** 
  - 80% of tasks use free Groq
  - 20% of tasks use paid Anthropic
- **Best for:** Production with cost optimization

### Premium (Anthropic Only)
- **Cost:** Higher (all tasks use paid API)
- **Capability:** 100% with maximum quality
- **Best for:** Mission-critical applications

## 🔧 Usage Examples

### Automatic Routing (Recommended)

```typescript
import { JarvisAIEngine } from './src/ai/engine.ts';

const engine = new JarvisAIEngine();

// Light task - uses Groq (free)
const tags = await engine.think('Extract tags from: AI research', 'light');

// Medium task - uses Groq (free)
const code = await engine.think('Generate TypeScript function', 'medium');

// Heavy task - uses Anthropic (paid)
const strategy = await engine.think('Create strategic roadmap', 'heavy');
```

### Force Specific Provider

```typescript
// Force Groq (free, fast)
const quickAnswer = await engine.thinkFast('What is TypeScript?');

// Force Anthropic (paid, powerful)
const deepAnalysis = await engine.thinkDeep('Analyze enterprise architecture');
```

### Check Availability

```typescript
const availability = engine.getAvailability();
console.log('Groq available:', availability.groq);
console.log('Anthropic available:', availability.anthropic);
```

## 📊 Provider Comparison

| Feature | Groq (Free) | Anthropic (Paid) |
|---------|-------------|------------------|
| **Cost** | Free | Pay per token |
| **Speed** | Very Fast (~0.5s) | Fast (~2s) |
| **Context Window** | 128K tokens | 200K tokens |
| **Best Models** | Llama 3.3 70B | Claude Sonnet 4 |
| **Reasoning** | Good | Excellent |
| **Code Generation** | Good | Excellent |
| **Rate Limits** | Generous free tier | Pay as you go |
| **Best For** | Most tasks | Complex reasoning |

## 🎮 System Integration

All Infinity X AI systems automatically use smart routing:

### Governance System
- License analysis → Groq (light)
- Compliance checks → Groq (medium)
- Strategic optimization → Anthropic (heavy)

### Knowledge Ingestion
- Web scraping → Groq (light)
- Content extraction → Groq (medium)
- Credibility analysis → Anthropic (heavy)

### Evolution System
- Code analysis → Groq (medium)
- Bug detection → Groq (medium)
- Complex refactoring → Anthropic (heavy)

### Quantum Mind
- Idea generation → Groq (medium)
- Feasibility analysis → Anthropic (heavy)
- Strategic planning → Anthropic (heavy)

### Infinity Loop
- Progress tracking → Groq (light)
- Strategy refinement → Groq (medium)
- Deep reflection → Anthropic (heavy)

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use environment variables** - Set in system or `.env`
3. **Rotate keys regularly** - Both providers support key rotation
4. **Monitor usage** - Check dashboards for both providers

## 📈 Monitoring & Logs

The system logs which provider is used for each request:

```
💡 Using groq (llama-3.3-70b-versatile)
⚡ Groq: llama-3.3-70b-versatile
🧠 Anthropic: claude-sonnet-4-20250514
```

## 🆘 Troubleshooting

### "No AI providers available"
- Solution: Set at least one API key in `.env`

### "Groq is not available"
- Solution: Add `GROQ_API_KEY` to `.env`

### "Anthropic is not available"
- Solution: Add `ANTHROPIC_API_KEY` to `.env`

### Groq Rate Limit Hit
- System automatically falls back to Anthropic
- Or wait for rate limit reset

### Both Providers Failing
- Check API keys are valid
- Check internet connection
- Check provider status pages

## 🎯 Recommended Setup by Use Case

### Development & Testing
```env
GROQ_API_KEY=your_groq_key
```
- Cost: $0
- Perfectly adequate for development

### Small Production
```env
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_anthropic_key
```
- Cost: Minimal (~$5-20/month)
- Optimal cost/performance balance

### Enterprise Production
```env
GROQ_API_KEY=your_groq_key
ANTHROPIC_API_KEY=your_anthropic_key
```
- Cost: Scale with usage
- Maximum reliability with fallbacks

## 🔗 Useful Links

- Groq Console: https://console.groq.com/
- Groq Docs: https://console.groq.com/docs
- Anthropic Console: https://console.anthropic.com/
- Anthropic Docs: https://docs.anthropic.com/

## 📝 Next Steps

1. Choose your setup option (Free, Hybrid, or Premium)
2. Get API keys from providers
3. Create `.env` file with your keys
4. Run any Infinity X AI system
5. Monitor which provider is used in logs
6. Adjust complexity levels if needed

**You're ready to run the complete A-Z system demonstration!**
