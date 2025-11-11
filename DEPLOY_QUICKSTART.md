# ⚡ Deploy in 5 Minutes - Quick Start

## 🎯 Fastest Way: Vercel (Recommended)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Deploy

```bash
vercel --prod
```

That's it! Your site is live at `https://your-project.vercel.app` 🎉

---

## 🔧 Set Backend URL

### In Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Click your project
3. **Settings** → **Environment Variables**
4. Add:
   ```
   Name: BACKEND_URL
   Value: http://3.136.147.20:8000
   ```
5. **Redeploy:** `vercel --prod`

---

## ✅ Test Deployment

Visit: `https://your-project.vercel.app/builder-v6`

Should see:
- ✅ Builder loads
- ✅ Tools visible
- ✅ Workflow works

---

## 🆘 Troubleshooting

**Problem:** 502 errors

**Fix:** Check backend is running at http://3.136.147.20:8000/health

---

**Problem:** Tools don't load

**Fix:** 
1. Check BACKEND_URL is set in Vercel
2. Restart backend with latest code (has tool registry fix)

---

**Problem:** Build fails

**Fix:**
```bash
# Test locally first
npm run build

# Fix errors then deploy
vercel --prod
```

---

## 📚 Full Documentation

See `FRONTEND_DEPLOYMENT_GUIDE.md` for:
- AWS deployment
- Docker deployment  
- Custom domains
- SSL setup
- CI/CD
- Security best practices

---

## 🚀 Next Steps After Deploy

1. ✅ Test weather workflow
2. ✅ Add custom domain (optional)
3. ✅ Setup monitoring
4. ✅ Configure analytics
5. ✅ Share with team!

**Your app is now live!** 🎉


