# 🚀 Frontend Deployment Guide - MCP Factor

Complete guide to deploy your Next.js frontend to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] Backend is running and accessible at `http://3.136.147.20:8000` (or your URL)
- [ ] Backend has the latest code with tool registry fixes
- [ ] Frontend builds successfully locally: `npm run build`
- [ ] Environment variables are configured
- [ ] Database (Supabase) is accessible from deployment

---

## 🎯 Recommended Deployment: Vercel (Easiest)

Vercel is made by the creators of Next.js and provides zero-config deployment.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Configure Environment Variables

Create `.env.production` in your project root:

```bash
# Backend URL (AWS)
BACKEND_URL=http://3.136.147.20:8000

# Or if you deploy backend to production domain:
# BACKEND_URL=https://api.mcpfactor.com
```

**Important:** For production, you should use HTTPS for backend too!

### Step 4: Deploy

From your project root:

```bash
# First deployment
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? [Your account]
# - Link to existing project? N
# - What's your project's name? mcp-factor (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? N
```

Vercel will:
1. ✅ Build your Next.js app
2. ✅ Deploy to Vercel CDN
3. ✅ Give you a live URL: `https://mcp-factor.vercel.app`

### Step 5: Set Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   Name: BACKEND_URL
   Value: http://3.136.147.20:8000
   Environments: Production, Preview, Development
   ```

### Step 6: Redeploy

```bash
vercel --prod
```

Your site is now live! 🎉

### Step 7: Add Custom Domain (Optional)

In Vercel Dashboard:
1. Go to **Settings** → **Domains**
2. Add your domain: `mcpfactor.com`
3. Configure DNS as instructed
4. Vercel auto-provisions SSL certificate

---

## 🌐 Alternative: AWS Deployment (Same as Backend)

Deploy frontend to same AWS server as your backend.

### Step 1: SSH to AWS Server

```bash
ssh user@3.136.147.20
```

### Step 2: Install Node.js (if not installed)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Clone Repository

```bash
cd /var/www  # or your preferred location
git clone https://github.com/yourusername/mcp-factor.git
cd mcp-factor
```

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Configure Environment

```bash
# Create .env.local
cat > .env.local << EOF
BACKEND_URL=http://localhost:8000
EOF
```

### Step 6: Build Frontend

```bash
npm run build
```

### Step 7: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 8: Start Frontend

```bash
# Start on port 3000
pm2 start npm --name "mcp-frontend" -- start

# Make it start on server reboot
pm2 startup
pm2 save
```

### Step 9: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/mcp-factor
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or IP address

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/backend-proxy/ {
        proxy_pass http://localhost:3000/api/backend-proxy/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/mcp-factor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10: Configure Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Step 11: Add SSL with Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Your frontend is now live at `http://your-domain.com` or `https://your-domain.com`! 🎉

---

## 🐳 Alternative: Docker Deployment

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create .dockerignore

```
node_modules
.next
.git
.env.local
*.log
```

### Step 3: Build Docker Image

```bash
docker build -t mcp-factor-frontend .
```

### Step 4: Run Container

```bash
docker run -d \
  -p 3000:3000 \
  -e BACKEND_URL=http://3.136.147.20:8000 \
  --name mcp-frontend \
  mcp-factor-frontend
```

### Step 5: Use Docker Compose (Recommended)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - BACKEND_URL=http://backend:8000
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
    restart: unless-stopped
```

Deploy:

```bash
docker-compose up -d
```

---

## 🔧 Environment Variables Reference

### Required Variables

```bash
# Backend API URL
BACKEND_URL=http://3.136.147.20:8000
# Production: https://api.yourdomain.com
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# API timeouts
API_TIMEOUT=30000
```

---

## 🏗️ Build Configuration

### next.config.js Optimization

Update your `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Compression
  compress: true,
  
  // Environment variables
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://3.136.147.20:8000',
  },
  
  // Output config for static export (if needed)
  // output: 'export',  // Uncomment for static site
};

module.exports = nextConfig;
```

---

## 📊 Monitoring & Logs

### Vercel Deployment

View logs:
```bash
vercel logs [deployment-url]
```

Or in Vercel Dashboard → Your Project → Deployments → [Click deployment] → Logs

### AWS/PM2 Deployment

View logs:
```bash
pm2 logs mcp-frontend
pm2 monit  # Real-time monitoring
```

### Docker Deployment

View logs:
```bash
docker logs mcp-frontend -f
docker-compose logs -f frontend
```

---

## 🧪 Testing Deployment

### 1. Health Check

```bash
# Test frontend is reachable
curl https://your-domain.com

# Test API proxy
curl https://your-domain.com/api/backend-proxy/api/health
```

### 2. Test in Browser

1. Open `https://your-domain.com/builder-v6`
2. Check browser console for errors
3. Try loading tools
4. Test workflow execution

### 3. Check Environment Variables

Add this temporary endpoint to test (then remove):

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    backendUrl: process.env.BACKEND_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
```

Visit: `https://your-domain.com/api/test-env`

---

## 🚨 Common Deployment Issues

### Issue 1: 502 Bad Gateway

**Cause:** Backend not accessible from frontend

**Fix:**
1. Check backend is running: `curl http://3.136.147.20:8000/health`
2. Check firewall allows port 8000
3. Verify BACKEND_URL is correct

### Issue 2: CORS Errors

**Cause:** Backend doesn't allow requests from your domain

**Fix:** Update backend CORS settings:

```python
# backend/src/dynamic_tools/api/app.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-domain.com",
        "https://mcp-factor.vercel.app",
        "*"  # Only for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: Environment Variables Not Working

**Cause:** Variables not prefixed correctly or not set

**Fix:**
- Client-side variables must start with `NEXT_PUBLIC_`
- Server-side variables don't need prefix
- Rebuild after changing env vars: `vercel --prod` or `npm run build`

### Issue 4: Build Fails

**Cause:** TypeScript errors or missing dependencies

**Fix:**
```bash
# Test build locally first
npm run build

# Check for errors
npm run lint
npx tsc --noEmit
```

### Issue 5: Slow Performance

**Cause:** Not using CDN or too many API calls

**Fix:**
- Enable Vercel Edge Network (automatic on Vercel)
- Add caching headers
- Optimize images
- Use static generation where possible

---

## 🔒 Security Checklist

Before going to production:

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured (not in code)
- [ ] CORS configured properly
- [ ] API keys not exposed to client
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] XSS protection enabled
- [ ] CSRF tokens for mutations
- [ ] Regular dependency updates
- [ ] Security headers configured

### Add Security Headers

In `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ]
}
```

---

## 🎯 Recommended Setup

For most projects, I recommend:

### Development
```
Local frontend (localhost:3004)
↓
Local backend (localhost:8000)
↓
Supabase (cloud)
```

### Production
```
Vercel Frontend (your-domain.com)
↓
AWS Backend (api.your-domain.com or 3.136.147.20:8000)
↓
Supabase (cloud)
```

---

## 📝 Deployment Checklist

### Pre-Deploy
- [ ] All tests passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Backend deployed and accessible
- [ ] Database migrations applied

### Deploy
- [ ] Frontend deployed to chosen platform
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

### Post-Deploy
- [ ] Site accessible at production URL
- [ ] API calls work (check Network tab)
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] Workflow execution works
- [ ] Monitoring/logging configured
- [ ] Error tracking setup (Sentry, etc.)

---

## 🚀 Quick Deploy Commands

### Vercel (Recommended)
```bash
# Install CLI
npm install -g vercel

# Deploy
vercel --prod
```

### AWS
```bash
# SSH and update
ssh user@3.136.147.20
cd /var/www/mcp-factor
git pull
npm install
npm run build
pm2 restart mcp-frontend
```

### Docker
```bash
# Build and run
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Docker Docs:** https://docs.docker.com
- **Let's Encrypt:** https://letsencrypt.org/getting-started/

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Frontend loads at production URL  
✅ No console errors in browser  
✅ Builder loads with tools from backend  
✅ Workflow execution works end-to-end  
✅ SSL certificate is valid  
✅ Site is fast (< 3s load time)  
✅ Mobile responsive  
✅ SEO meta tags present  

---

## 🔄 CI/CD (Bonus)

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

**Need help deploying? Let me know which platform you want to use!** 🚀


