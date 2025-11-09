# 🧪 Workflow Testing Guide

## ✅ What's Connected

The **TestingPanel** in your Builder V6 is now connected to the **REAL backend workflow orchestrator**!

### The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. User enters test input in TestingPanel                  │
│     "Search for React tutorials on GitHub"                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Frontend collects:                                       │
│     • Selected Tools (from MCP config)                       │
│     • MCP Instructions/Prompt                                │
│     • User test input                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Calls: POST /api/backend-proxy/workflow                 │
│     {                                                        │
│       "user_instructions": "Search for React tutorials...", │
│       "tool_ids": ["Search GitHub Repos"],                  │
│       "format_response": true,                              │
│       "response_format_instructions": "..."                 │
│     }                                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Backend Workflow Orchestrator:                          │
│     ├─ Retrieves tools from registry                        │
│     ├─ Formats tools as API documentation                   │
│     ├─ Sends to LLM with user instructions                  │
│     ├─ LLM generates HTTP request spec (JSON)               │
│     ├─ Executes HTTP request to actual API                  │
│     ├─ Gets API response                                    │
│     ├─ Sends API response back to LLM for formatting        │
│     └─ Returns both raw and formatted responses             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Frontend displays:                                       │
│     ✅ Selected Tool: "Search GitHub Repos"                 │
│     📝 HTTP Request: { method: "GET", url: "...", ... }     │
│     📡 API Response: { status: 200, body: {...} }           │
│     💬 Formatted Response: "Here are the top React..."      │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 How to Test

### Step 1: Setup Your Workflow

1. **Go to Tools Tab**
   - Your default tools should already be there:
     - "Search GitHub Repos"
     - "Get Weather Data"
     - "Create Stripe Charge"

2. **Go to MCPs Tab**
   - Create an MCP Configuration:
     - Name: "GitHub Assistant"
     - Select Tool: "Search GitHub Repos"
     - Instruction: "You are a helpful assistant that searches GitHub for repositories"

3. **Go to Workflow Tab**
   - Add an MCP Step
   - Select your "GitHub Assistant" MCP config
   - The selected tools will appear

### Step 2: Run Test

1. **In the Testing Panel (right side):**
   - Enter test input: `"Find popular React component libraries"`
   - Click **"Run Test"** button

2. **Watch the Magic! ✨**
   - Backend receives your request
   - LLM analyzes available tools
   - LLM generates HTTP request to GitHub API
   - Request executes against real GitHub API
   - Response comes back
   - LLM formats it for you
   - You see everything!

### Step 3: See Results

The test results will show:

```json
{
  "selected_tool": "Search GitHub Repos",
  "http_request": {
    "method": "GET",
    "url": "https://api.github.com/search/repositories",
    "headers": {...},
    "params": {
      "q": "react component libraries",
      "sort": "stars",
      "per_page": 10
    }
  },
  "api_response": {
    "status_code": 200,
    "body": {
      "items": [...]
    }
  },
  "formatted_response": "Here are the top React component libraries..."
}
```

## ⚠️ Important Notes

### Tool Registration

The backend needs tools to be **registered in the ToolRegistry** before they can be used. Currently, the default tools ("Search GitHub Repos", "Get Weather Data", "Create Stripe Charge") should work if they're registered.

**If you get "Tools not found" error:**

The tools need to be registered in the backend. You have two options:

1. **Register via API** (need to implement):
   ```typescript
   await backendAPI.tools.register({
     name: "Search GitHub Repos",
     // ... tool config
   });
   ```

2. **Pre-register in backend** (recommended for production):
   - Tools from database should be loaded into ToolRegistry on startup
   - Or register them when first created

### Expected Errors

1. **"Tools not found in registry"** → Tools need to be registered first
2. **"LLM selection error"** → OpenAI API key might be missing or invalid
3. **"API execution error"** → The external API call failed (e.g., GitHub API rate limit)

## 🔧 API Endpoints Added

### 1. `/workflow` Endpoint (Backend)

Already exists! Located at: `POST /api/backend-proxy/workflow`

**Request:**
```typescript
{
  user_instructions: string;
  tool_ids: string[];
  format_response?: boolean;
  response_format_instructions?: string;
}
```

**Response:**
```typescript
{
  status: 'success' | 'error';
  selected_tool?: string;
  http_spec?: object;
  raw_response?: object;
  formatted_response?: string;
  error?: string;
  error_stage?: string;
}
```

### 2. Frontend API Client

Added to `lib/api/backend.ts`:

```typescript
import backendAPI from '@/lib/api/backend';

const response = await backendAPI.workflow.execute({
  user_instructions: "Search for React tutorials",
  tool_ids: ["Search GitHub Repos"],
  format_response: true,
});
```

## 🎬 Demo Scenarios

### Scenario 1: GitHub Search
```
Input: "Find popular TypeScript projects"
Tool: Search GitHub Repos
Expected: List of TypeScript repos
```

### Scenario 2: Weather Check
```
Input: "What's the weather in San Francisco?"
Tool: Get Weather Data
Expected: Current weather information
```

### Scenario 3: Multi-Tool Selection
```
Input: "Find React libraries and check if it's nice outside"
Tools: [Search GitHub Repos, Get Weather Data]
Expected: LLM picks appropriate tool based on context
```

## 🐛 Debugging

### Check Browser Console

The TestingPanel logs everything:
```
🚀 Calling backend workflow with: {...}
✅ Backend response: {...}
```

### Check Backend Logs

Backend logs show each stage:
```
[WorkflowOrchestrator] Starting workflow execution...
[WorkflowOrchestrator] Successfully retrieved 1 tools
[WorkflowOrchestrator] Calling LLM for tool selection...
[WorkflowOrchestrator] LLM generated HTTP spec: GET https://...
[WorkflowOrchestrator] Executing API call...
[WorkflowOrchestrator] API call completed: 200
[WorkflowOrchestrator] Response formatting completed
[WorkflowOrchestrator] Workflow completed successfully
```

## 🚀 Next Steps

1. **Register Default Tools in Backend**
   - Either on startup or first use
   - So they're available for workflow execution

2. **Add More Tools**
   - Create custom tools in Tools tab
   - Backend should auto-register them when created

3. **Test Different Scenarios**
   - Try various user inputs
   - Test with different tool combinations
   - See how LLM chooses the right tool

4. **Error Handling**
   - Test with invalid API keys
   - Test with rate-limited APIs
   - See how errors are displayed

## 📚 Related Files

- **Frontend:**
  - `components/builder-v6/TestingPanel.tsx` - UI for testing
  - `lib/api/backend.ts` - API client with workflow endpoint
  
- **Backend:**
  - `backend/src/dynamic_tools/services/workflow_orchestrator.py` - Main orchestrator
  - `backend/src/dynamic_tools/api/endpoints.py` - `/workflow` endpoint
  - `backend/src/dynamic_tools/models/api_requests.py` - Request/response models

---

**You're all set! 🎉 The workflow testing is now connected end-to-end!**

