# MCP Factor - Deployment Guide

This guide covers deploying both the **frontend** (Next.js) and **backend** (FastAPI) to production.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐
│   Frontend      │         │    Backend      │
│   (Next.js)     │────────▶│   (FastAPI)     │
│   Vercel        │  HTTPS  │   Railway       │
└─────────────────┘         └─────────────────┘
```

---

## 🚂 Part 1: Deploy Backend to Railway

Railway is recommended for the Python FastAPI backend due to:
- ✅ No timeout limits
- ✅ Better Python support
- ✅ Easier debugging with real-time logs

### Quick Start

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy backend
cd backend
railway init
railway up

# 4. Add environment variables
railway variables set OPENAI_API_KEY=your-key
railway variables set ALPHA_VANTAGE_API_KEY=demo

# 5. Get your URL
railway status
```

**Detailed instructions:** See [`backend/RAILWAY_DEPLOYMENT.md`](backend/RAILWAY_DEPLOYMENT.md)

---

## ▲ Part 2: Deploy Frontend to Vercel

Vercel is perfect for Next.js apps with automatic deployments from GitHub.

### Quick Start

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend (from project root)
vercel

# 3. Add environment variable (your Railway backend URL)
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend.up.railway.app

# 4. Deploy to production
vercel --prod
```

### Or Deploy via GitHub (Easier)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.up.railway.app`
5. Deploy!

---

## 🔗 Connecting Frontend & Backend

### Step 1: Get Your Backend URL

After deploying to Railway, get your URL:
```bash
railway status
```

Example: `https://mcp-factor-backend-production.up.railway.app`

### Step 2: Configure Frontend

Create `.env.local` in project root:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

### Step 3: Update CORS (if needed)

In `backend/src/dynamic_tools/api/app.py`, add your frontend domain:

```python
allow_origins=[
    "http://localhost:3000",
    "https://*.vercel.app",
    "https://your-actual-domain.vercel.app",  # Add this
],
```

Redeploy backend:
```bash
cd backend
railway up
```

### Step 4: Test Connection

```bash
# Test backend health
curl https://your-backend.up.railway.app/health

# Should return:
# {"status":"healthy","service":"llm-http-service"}
```

---

## 📋 Deployment Checklist

### Backend (Railway)
- [ ] Backend deployed to Railway
- [ ] `OPENAI_API_KEY` environment variable set
- [ ] Health check working at `/health`
- [ ] API docs accessible at `/docs`
- [ ] CORS configured for frontend domain

### Frontend (Vercel)
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` environment variable set
- [ ] Can access frontend URL
- [ ] Frontend can connect to backend (check browser console)
- [ ] Test creating an MCP integration

---

## 🧪 Testing Your Deployment

### Backend Tests

```bash
# Health check
curl https://your-backend.up.railway.app/health

# Root endpoint
curl https://your-backend.up.railway.app/

# API documentation
open https://your-backend.up.railway.app/docs
```

### Frontend Tests

1. Visit your Vercel URL
2. Open browser DevTools → Network tab
3. Try creating an MCP integration
4. Verify API calls to your Railway backend succeed

---

## 🐛 Troubleshooting

### CORS Issues

**Symptom:** Browser console shows CORS errors

**Solution:** 
1. Check backend CORS settings include your frontend domain
2. Ensure frontend uses correct backend URL
3. Redeploy backend after CORS changes

### Environment Variables Not Working

**Symptom:** 500 errors, missing API keys

**Solution:**
```bash
# Check Railway variables
railway variables

# Check Vercel variables
vercel env ls

# Re-add if missing
railway variables set OPENAI_API_KEY=your-key
vercel env add NEXT_PUBLIC_API_URL production
```

### Backend Not Responding

**Solution:**
```bash
# Check Railway logs
railway logs

# Common issues:
# - Missing dependencies in requirements.txt
# - Port binding issues
# - Missing environment variables
```

---

## 💰 Estimated Costs

### Railway (Backend)
- **Free Trial**: $5 in credits
- **Typical usage**: $5-10/month for light traffic
- **Scaling**: Pay-as-you-go

### Vercel (Frontend)
- **Hobby Plan**: FREE for personal projects
- **Pro Plan**: $20/month (if needed for team features)

**Total estimated cost**: $5-10/month for both services

---

## 🚀 Post-Deployment

### Set Up Automatic Deployments

Both services support automatic deployments from GitHub:

**Railway:**
- Automatically deploys on push to main branch
- Configure in Railway dashboard → Settings

**Vercel:**
- Automatically deploys on push to any branch
- Preview deployments for PRs
- Production deployment for main branch

### Add Custom Domains

**Railway:**
1. Railway dashboard → Your service → Settings
2. Click "Networking" → "Add custom domain"
3. Follow DNS instructions

**Vercel:**
1. Vercel dashboard → Your project → Settings
2. Click "Domains" → "Add domain"
3. Follow DNS instructions

---

## 📊 Monitoring

### Railway (Backend)
- **Logs**: `railway logs` or Railway dashboard
- **Metrics**: CPU, memory, network in dashboard
- **Health Checks**: Automatic via `/health` endpoint

### Vercel (Frontend)
- **Analytics**: Built-in in Vercel dashboard
- **Logs**: Vercel dashboard → Your project → Logs
- **Error tracking**: Consider adding Sentry

---

## 🔄 Redeploying After Changes

### Backend Changes
```bash
cd backend
git add .
git commit -m "Update backend"
git push origin main
# Railway auto-deploys
```

Or manually:
```bash
cd backend
railway up
```

### Frontend Changes
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

Or manually:
```bash
vercel --prod
```

---

## 📞 Support Resources

- **Railway**: https://docs.railway.app
- **Vercel**: https://vercel.com/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs

---

## ✅ Success!

Your MCP Factor platform is now deployed! 🎉

- Frontend: `https://your-project.vercel.app`
- Backend API: `https://your-backend.up.railway.app`
- API Docs: `https://your-backend.up.railway.app/docs`

