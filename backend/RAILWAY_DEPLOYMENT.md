# Deploying FastAPI Backend to Railway

Railway is the **recommended** platform for deploying this Python FastAPI backend.

## ✅ Why Railway?

- ✅ **No timeout limits** - perfect for long-running operations
- ✅ **Auto-detects Python** - no complex configuration needed
- ✅ **Free tier** - $5/month in credits
- ✅ **Persistent connections** - unlike Vercel serverless
- ✅ **Better logging** - real-time logs and monitoring
- ✅ **WebSocket support** - if you need it later
- ✅ **PostgreSQL support** - can add database easily

---

## 🚀 Quick Deployment (5 minutes)

### Method 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Setup Railway deployment"
   git push origin main
   ```

2. **Go to [railway.app](https://railway.app)**

3. **Click "Start a New Project"**

4. **Select "Deploy from GitHub repo"**

5. **Authorize Railway** to access your GitHub

6. **Select your repository** (`mcp-factor`)

7. **Configure the deployment**:
   - Railway will auto-detect it's a Python project
   - Root directory: `/backend` (important!)
   - Click "Add variables" to add environment variables

8. **Add Environment Variables**:
   - `OPENAI_API_KEY` = your OpenAI key
   - `ALPHA_VANTAGE_API_KEY` = your Alpha Vantage key (or "demo")
   - Railway automatically sets `PORT` - don't override it

9. **Click "Deploy"** 

10. **Get your URL**:
    - Railway generates a URL like: `https://mcp-factor-backend-production.up.railway.app`
    - Click "Settings" → "Networking" → "Generate Domain"

---

### Method 2: Deploy via Railway CLI

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Navigate to backend directory
cd backend

# 4. Initialize Railway project
railway init

# 5. Link to your project (or create new)
railway link

# 6. Add environment variables
railway variables set OPENAI_API_KEY=your-key-here
railway variables set ALPHA_VANTAGE_API_KEY=demo

# 7. Deploy
railway up

# 8. Get your deployment URL
railway status
```

---

## 🧪 Testing Your Deployment

After deployment, Railway gives you a URL. Test it:

```bash
# Health check
curl https://your-app.up.railway.app/health

# Root endpoint
curl https://your-app.up.railway.app/

# Interactive API docs
# Visit: https://your-app.up.railway.app/docs
```

Expected response from `/health`:
```json
{
  "status": "healthy",
  "service": "llm-http-service"
}
```

---

## 🔗 Connect Frontend to Backend

Once deployed, update your Next.js frontend to use the Railway backend:

### 1. Create/Update Frontend Environment File

Create `.env.local` in your **project root** (not in backend):

```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### 2. Update API Client

In `lib/api-client.ts`, ensure you're using the environment variable:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                     'http://localhost:8000'; // Fallback for local dev
```

### 3. Update CORS in Backend

The backend already has CORS configured, but make sure your production domain is allowed.

In `backend/src/dynamic_tools/api/app.py`, update the allowed origins:

```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",
    "https://your-frontend-domain.com",  # Add your actual frontend domain
],
```

---

## 📁 Project Structure for Railway

Railway needs these files in the `backend/` directory:

```
backend/
├── railway.toml          ✅ Railway configuration
├── Procfile              ✅ Start command
├── requirements.txt      ✅ Python dependencies
├── runtime.txt           ✅ Python version
├── .env.example          ✅ Environment variables template
└── src/
    └── dynamic_tools/
        └── api/
            └── app.py    ✅ Your FastAPI app
```

All files have been created! ✅

---

## ⚙️ Configuration Files Explained

### `railway.toml`
Tells Railway how to build and run your app:
- Uses Nixpacks builder (automatic)
- Runs uvicorn with your FastAPI app
- Sets health check endpoint
- Configures restart policy

### `Procfile`
Backup start command if railway.toml isn't used:
- `web:` tells Railway this is a web service
- Binds to `$PORT` (Railway provides this)

### `requirements.txt`
Python dependencies Railway will install:
- Includes `uvicorn[standard]` for production serving
- All your FastAPI and tool dependencies

### `runtime.txt`
Specifies Python version:
- `python-3.11` (can change to 3.10, 3.12, etc.)

---

## 🌍 Environment Variables

Set these in Railway dashboard or via CLI:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key | `sk-...` |
| `ALPHA_VANTAGE_API_KEY` | ⚠️ Optional | Stock API key | `demo` or your key |
| `PORT` | 🚫 Auto-set | Railway sets automatically | Don't override |

---

## 🔍 Monitoring & Logs

Railway provides excellent monitoring:

1. **View Logs**: Railway dashboard → Your service → "Deployments" tab
2. **Real-time Logs**: `railway logs` (via CLI)
3. **Metrics**: CPU, Memory, Network usage in dashboard
4. **Health Checks**: Automatic via `/health` endpoint

---

## 🐛 Troubleshooting

### Build Fails

**Error: "No module named 'src'"**
- Solution: Railway should run from `backend/` directory
- Check root directory setting in Railway dashboard

**Error: "Could not find requirements.txt"**
- Solution: Ensure you're deploying from the `backend/` folder
- Railway needs to see `requirements.txt` in the root of deployment

### App Crashes After Deploy

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Missing environment variables (especially `OPENAI_API_KEY`)
- Import errors - check all dependencies are in `requirements.txt`
- Port binding - ensure using `$PORT` environment variable

### CORS Errors from Frontend

**Solution:** Update allowed origins in `backend/src/dynamic_tools/api/app.py`:

```python
allow_origins=[
    "http://localhost:3000",
    "https://your-actual-frontend-domain.vercel.app",
],
```

### Cold Starts

Railway doesn't have cold starts like Vercel! Your app runs continuously.

---

## 💰 Pricing

Railway offers:
- **Free Trial**: $5 in credits to start
- **Hobby Plan**: $5/month (executes after trial credits)
- **Pay-as-you-go**: ~$0.000231/GB-hour for memory

Typical usage for this API: **~$5-10/month** for light traffic

---

## 🚀 Advanced: Add PostgreSQL Database

Railway makes it easy to add a database:

1. Go to your Railway project
2. Click "New" → "Database" → "PostgreSQL"
3. Railway auto-creates a database and provides `DATABASE_URL`
4. Use it in your app:

```python
import os
DATABASE_URL = os.getenv("DATABASE_URL")
```

---

## 📊 Deployment Checklist

- [x] `railway.toml` created
- [x] `Procfile` created  
- [x] `requirements.txt` updated with uvicorn
- [x] `runtime.txt` specified Python version
- [x] `.env.example` created for reference
- [x] CORS configured in FastAPI app
- [ ] Push code to GitHub
- [ ] Create Railway project
- [ ] Link GitHub repo
- [ ] Add environment variables
- [ ] Deploy
- [ ] Test `/health` endpoint
- [ ] Update frontend `.env.local` with Railway URL
- [ ] Test full integration

---

## 🎉 Next Steps After Deployment

1. **Test all endpoints** via `/docs`
2. **Monitor logs** for any errors
3. **Set up custom domain** (optional) in Railway settings
4. **Enable automatic deployments** from GitHub (already enabled by default)
5. **Add database** if needed for future features

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project logs: `railway logs` or Railway dashboard

Happy deploying! 🚂

