# Deploying FastAPI Backend to Vercel

## ⚠️ Important Limitations

Vercel serverless functions have these constraints:
- **10-second execution timeout** (max 60s on Pro plan)
- **Cold starts** - first request after idle is slower
- **No WebSockets** - only HTTP requests
- **Stateless** - no persistent connections or file storage

**Recommendation:** Consider Railway, Render, or Fly.io for production Python APIs.

---

## Deployment Steps

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Navigate to Backend Directory

```bash
cd backend
```

### 3. Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time)
- **Project name?** → `mcp-factor-backend` (or your choice)
- **Directory?** → `./` (current directory)
- **Override settings?** → No

### 4. Set Environment Variables

In the Vercel dashboard or via CLI:

```bash
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key when prompted

vercel env add ALPHA_VANTAGE_API_KEY  
# Paste your Alpha Vantage key (or "demo")
```

### 5. Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Testing Your Deployment

After deployment, Vercel will give you a URL like:
```
https://mcp-factor-backend-xyz.vercel.app
```

Test the endpoints:

```bash
# Health check
curl https://your-deployment.vercel.app/health

# Root endpoint
curl https://your-deployment.vercel.app/

# API docs (Swagger UI)
# Visit: https://your-deployment.vercel.app/docs
```

---

## Connect Frontend to Backend

Update your frontend API client to use the Vercel URL:

**In `lib/api-client.ts`:**

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                     'https://your-backend.vercel.app';
```

Add to your frontend's `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## Project Structure for Vercel

```
backend/
├── api/
│   └── index.py          # ← Vercel entry point
├── src/
│   └── dynamic_tools/    # Your FastAPI app
├── vercel.json           # ← Vercel configuration
├── requirements.txt      # ← Python dependencies
└── pyproject.toml        # (still used for local dev)
```

---

## Alternative: Deploy to Railway (Easier for Python)

Railway is often easier for Python backends:

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy from backend directory
cd backend
railway init
railway up

# 4. Add environment variables in Railway dashboard
# 5. Get your deployment URL
```

Railway advantages:
- ✅ No timeout limits
- ✅ Persistent connections
- ✅ Better logs
- ✅ Free tier with $5/month credit
- ✅ Auto-detects Python and installs from requirements.txt

---

## Troubleshooting

### "Module not found" errors
- Ensure `api/index.py` correctly adds `src/` to Python path
- Check that all imports are relative to the correct base

### "Execution timeout"
- Vercel has a 10s limit (60s on Pro)
- Use Railway/Render for longer operations

### Cold starts
- First request after idle will be slow (~2-5s)
- Consider using a cron job to keep it warm

### CORS errors
Add CORS middleware in `src/dynamic_tools/api/app.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Recommended: Use Railway Instead

For a Python FastAPI backend, Railway is simpler:

1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Select your repo
4. Railway auto-detects Python
5. Add environment variables
6. Done! 🎉

No special configuration files needed.

