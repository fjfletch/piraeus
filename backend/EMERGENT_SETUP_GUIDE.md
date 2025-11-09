# 🚀 Backend Setup Guide for Emergent Agent

## 📋 Prerequisites

Before starting, ensure you have:
- **Docker Desktop** installed and running
- **Environment variables** configured (see below)

---

## 🔑 Step 1: Configure Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
# Required - Supabase Connection
SUPABASE_URL=https://iexpyrkcxloufflgqpgl.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHB5cmtjeGxvdWZmbGdxcGdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExMDkxMjgsImV4cCI6MjA0NjY4NTEyOH0.LmTUg1UfewRbmqVH2KLCgTpeMSpz0x2_xH6VmCyv8Jc

# Required - OpenAI API Key
OPENAI-SECRET=your_openai_api_key_here

# Optional - Port Configuration (defaults to 8000)
PORT=8000
```

**⚠️ Important:** Replace `your_openai_api_key_here` with a valid OpenAI API key.

---

## 🐳 Step 2: Start the Backend with Docker

### Option A: Using Docker Compose (Recommended)

```bash
# Navigate to backend directory
cd backend

# Start the containers in detached mode
docker-compose up -d --build
```

This will:
- Build the Docker image with all dependencies
- Start the FastAPI server on `http://localhost:8000`
- Run in the background

### Option B: Using Docker Directly

```bash
cd backend

# Build the image
docker build -t mcp-backend .

# Run the container
docker run -d \
  -p 8000:8000 \
  -e SUPABASE_URL=<your_url> \
  -e SUPABASE_KEY=<your_key> \
  -e OPENAI-SECRET=<your_key> \
  --name mcp-backend \
  mcp-backend
```

---

## ✅ Step 3: Verify Backend is Running

### Health Check

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "llm-http-service"
}
```

### Test Database Connection

```bash
curl http://localhost:8000/api/projects
```

**Expected Response:**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "Default Project",
    "description": "Automatically created project",
    ...
  }
]
```

---

## 📚 Step 4: Access API Documentation

Once running, visit:

- **Interactive API Docs:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Root Info:** http://localhost:8000/

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop and wait for it to fully initialize.

### Issue: "Port 8000 already in use"
**Solution:** 
```bash
# Stop existing container
docker-compose down

# Or use a different port
docker-compose up -d -e PORT=8001
```

### Issue: "Environment variable not found"
**Solution:** Make sure your `.env` file exists in `backend/` directory with all required variables.

### Issue: Container starts but immediately exits
**Solution:** Check logs:
```bash
docker-compose logs
```

Common causes:
- Missing environment variables
- Invalid Supabase credentials
- Port already in use

---

## 🛑 Stop the Backend

```bash
cd backend
docker-compose down
```

To also remove volumes:
```bash
docker-compose down -v
```

---

## 📊 View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker logs dynamic-tools
```

---

## 🧪 Run Tests

```bash
# With Docker running
docker exec dynamic-tools uv run python /app/run_database_tests.py
```

**Expected:** All 14 tests should pass.

---

## 🔄 Restart After Code Changes

```bash
# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

---

## 📝 Important Endpoints

### Database CRUD Operations

```bash
# Projects
GET    /api/projects
POST   /api/projects
GET    /api/projects/{id}
PATCH  /api/projects/{id}
DELETE /api/projects/{id}

# Tools (UUID)
GET    /api/projects/{project_id}/tools
POST   /api/projects/{project_id}/tools
GET    /api/tools/{uuid}
PATCH  /api/tools/{uuid}
DELETE /api/tools/{uuid}

# Tools (Numeric ID - Frontend Compatible)
GET    /api/tools/by-numeric-id/{numeric_id}

# Prompts
GET    /api/projects/{project_id}/prompts
POST   /api/projects/{project_id}/prompts
GET    /api/prompts/by-numeric-id/{numeric_id}

# MCP Configs
GET    /api/projects/{project_id}/mcp-configs
POST   /api/projects/{project_id}/mcp-configs
GET    /api/mcp-configs/by-numeric-id/{numeric_id}

# Response Configs
GET    /api/projects/{project_id}/response-configs
POST   /api/projects/{project_id}/response-configs
GET    /api/response-configs/by-numeric-id/{numeric_id}

# Flows/Workflows
GET    /api/projects/{project_id}/flows
POST   /api/projects/{project_id}/flows
GET    /api/flows/by-numeric-id/{numeric_id}
```

### Legacy Endpoints

```bash
# LLM Workflow Execution
POST   /api/workflow

# Tool Registration
POST   /api/tools/register
GET    /api/tools
```

---

## 🎯 Quick Start Summary

```bash
# 1. Navigate to backend
cd backend

# 2. Start Docker Desktop (if not running)

# 3. Start backend
docker-compose up -d --build

# 4. Wait 10 seconds for startup

# 5. Verify
curl http://localhost:8000/health

# 6. Access API docs
# Open browser: http://localhost:8000/docs
```

---

## 🔐 CORS Configuration

CORS is configured to **allow all origins** for development:

```python
allow_origins=["*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

Your frontend can make requests from any domain without CORS errors.

---

## 📦 Database Schema

See `FRONTEND_SCHEMA_SUMMARY.md` for complete database schema documentation including:
- Frontend-compatible numeric IDs
- Flattened tool configuration fields
- Auto-sync triggers
- Linear workflow format

---

## ⚡ Performance Notes

- **Cold start:** First request may take 2-3 seconds
- **Typical response:** 100-500ms for database queries
- **LLM requests:** 2-5 seconds (depends on OpenAI API)
- **Connection pooling:** Supabase client reuses connections

---

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `docker exec dynamic-tools env | grep SUPABASE`
3. Test database connection: `curl http://localhost:8000/api/projects`
4. Review test results: `docker exec dynamic-tools uv run python /app/run_database_tests.py`

For detailed API documentation, see `API_REFERENCE.md`.

