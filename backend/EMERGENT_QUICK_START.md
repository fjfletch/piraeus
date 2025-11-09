# ⚡ Quick Start for Emergent Agent

## 🎯 Goal
Start the MCP Factor backend API server

---

## ✅ Step-by-Step Commands

### 1. Verify Docker is Running
```bash
docker ps
```
If this fails, Docker Desktop needs to be started manually.

### 2. Navigate to Backend Directory
```bash
cd backend
```

### 3. Start the Backend
```bash
docker-compose up -d --build
```

This command will:
- Build the Docker image (takes 30-60 seconds first time)
- Start the FastAPI server
- Run in background on port 8000

### 4. Wait for Startup (10 seconds)
```bash
# Optional: Watch logs during startup
docker-compose logs -f
# Press Ctrl+C to exit logs
```

### 5. Verify Backend is Running
```bash
curl http://localhost:8000/health
```

**Success Response:**
```json
{"status":"healthy","service":"llm-http-service"}
```

---

## 🎉 You're Done!

**Backend is now running at:** `http://localhost:8000`

**API Documentation:** `http://localhost:8000/docs`

**Test Database Connection:**
```bash
curl http://localhost:8000/api/projects
```

---

## 🛑 To Stop the Backend

```bash
cd backend
docker-compose down
```

---

## 📝 Environment Variables Required

The backend requires these environment variables (should already be configured in `docker-compose.yml`):

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENAI-SECRET`
- `PORT` (defaults to 8000)

If environment variables are missing, create a `.env` file in the `backend/` directory with the required values (see `EMERGENT_SETUP_GUIDE.md`).

---

## 🧪 Run Tests

```bash
docker exec dynamic-tools uv run python /app/run_database_tests.py
```

**Expected:** `14 passed` ✅

---

## 🔄 Restart After Changes

```bash
docker-compose down
docker-compose up -d --build
```

