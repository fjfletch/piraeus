# API Reference - Database CRUD Operations

Complete REST API for all database entities with full CRUD operations.

## 📋 **Base URL**

```
http://localhost:8000/api
```

---

## 🗂️ **Projects**

### List Projects
```http
GET /api/projects?user_id={optional_uuid}
```
**Response**: `200 OK` - Array of Project objects

### Get Project
```http
GET /api/projects/{project_id}
```
**Response**: `200 OK` - Single Project object

### Get Project with All Data
```http
GET /api/projects/{project_id}/full
```
**Response**: `200 OK` - Project with all related entities (tools, prompts, flows, configs)

### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "My Project",
  "description": "Optional description",
  "user_id": "optional-uuid"
}
```
**Response**: `201 Created` - Created Project object

### Update Project
```http
PATCH /api/projects/{project_id}
Content-Type: application/json

{
  "name": "Updated name",
  "description": "Updated description"
}
```
**Response**: `200 OK` - Updated Project object

### Delete Project
```http
DELETE /api/projects/{project_id}
```
**Response**: `204 No Content` - Cascades to all related entities

---

## 🤖 **MCP Configs**

### List MCP Configs
```http
GET /api/projects/{project_id}/mcp-configs
```
**Response**: `200 OK` - Array of MCPConfig objects

### Get MCP Config
```http
GET /api/mcp-configs/{config_id}
```
**Response**: `200 OK` - Single MCPConfig object

### Create MCP Config
```http
POST /api/projects/{project_id}/mcp-configs
Content-Type: application/json

{
  "name": "My LLM Config",
  "project_id": "project-uuid",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000,
  "system_prompt": "You are a helpful assistant",
  "instruction": "Answer questions clearly",
  "selected_tool_ids": ["tool-uuid-1", "tool-uuid-2"]
}
```
**Response**: `201 Created` - Created MCPConfig object

### Update MCP Config
```http
PATCH /api/mcp-configs/{config_id}
Content-Type: application/json

{
  "name": "Updated config",
  "temperature": 0.8,
  "deployment_status": "deployed",
  "deployment_url": "https://..."
}
```
**Response**: `200 OK` - Updated MCPConfig object

### Delete MCP Config
```http
DELETE /api/mcp-configs/{config_id}
```
**Response**: `204 No Content`

---

## 📤 **Response Configs**

### List Response Configs
```http
GET /api/projects/{project_id}/response-configs
```
**Response**: `200 OK` - Array of ResponseConfig objects

### Get Response Config
```http
GET /api/response-configs/{config_id}
```
**Response**: `200 OK` - Single ResponseConfig object

### Create Response Config
```http
POST /api/projects/{project_id}/response-configs
Content-Type: application/json

{
  "name": "My Response Handler",
  "project_id": "project-uuid",
  "type": "llm-reprocess",
  "reprocess_instructions": "Format the response as markdown",
  "error_handling": "retry"
}
```
**Response**: `201 Created` - Created ResponseConfig object

### Update Response Config
```http
PATCH /api/response-configs/{config_id}
Content-Type: application/json

{
  "type": "raw-output",
  "error_handling": "fallback"
}
```
**Response**: `200 OK` - Updated ResponseConfig object

### Delete Response Config
```http
DELETE /api/response-configs/{config_id}
```
**Response**: `204 No Content`

---

## 🔧 **Tools**

### List Tools
```http
GET /api/projects/{project_id}/tools
```
**Response**: `200 OK` - Array of Tool objects

### Get Tool
```http
GET /api/tools/{tool_id}
```
**Response**: `200 OK` - Single Tool object

### Create Tool
```http
POST /api/projects/{project_id}/tools
Content-Type: application/json

{
  "name": "my_api_tool",
  "description": "Calls external API",
  "project_id": "project-uuid",
  "tool_config": {
    "api": {
      "base_url": "https://api.example.com",
      "method": "GET",
      "headers": {},
      "params": {},
      "auth": {"method": "none"},
      "timeout": 30.0
    },
    "input_schema": {...},
    "output_schema": {...}
  }
}
```
**Response**: `201 Created` - Created Tool object

### Update Tool
```http
PATCH /api/tools/{tool_id}
Content-Type: application/json

{
  "description": "Updated description",
  "tool_config": {...}
}
```
**Response**: `200 OK` - Updated Tool object

### Delete Tool
```http
DELETE /api/tools/{tool_id}
```
**Response**: `204 No Content`

---

## 📝 **Prompts**

### List Prompts
```http
GET /api/projects/{project_id}/prompts
```
**Response**: `200 OK` - Array of Prompt objects

### Get Prompt
```http
GET /api/prompts/{prompt_id}
```
**Response**: `200 OK` - Single Prompt object

### Create Prompt
```http
POST /api/projects/{project_id}/prompts
Content-Type: application/json

{
  "name": "greeting_prompt",
  "description": "Greets the user",
  "project_id": "project-uuid",
  "prompt_template": "Hello {{name}}, welcome!",
  "variables": ["name"]
}
```
**Response**: `201 Created` - Created Prompt object

### Update Prompt
```http
PATCH /api/prompts/{prompt_id}
Content-Type: application/json

{
  "prompt_template": "Hi {{name}}, how can I help you?",
  "variables": ["name", "context"]
}
```
**Response**: `200 OK` - Updated Prompt object

### Delete Prompt
```http
DELETE /api/prompts/{prompt_id}
```
**Response**: `204 No Content`

---

## 🔄 **Flows (Workflows)**

### List Flows
```http
GET /api/projects/{project_id}/flows
```
**Response**: `200 OK` - Array of Flow objects

### Get Flow
```http
GET /api/flows/{flow_id}
```
**Response**: `200 OK` - Single Flow object

### Create Flow
```http
POST /api/projects/{project_id}/flows
Content-Type: application/json

{
  "name": "my_workflow",
  "description": "Multi-step workflow",
  "project_id": "project-uuid",
  "steps": {
    "nodes": [...],
    "edges": [...]
  }
}
```
**Response**: `201 Created` - Created Flow object

### Update Flow
```http
PATCH /api/flows/{flow_id}
Content-Type: application/json

{
  "steps": {
    "nodes": [...],
    "edges": [...]
  }
}
```
**Response**: `200 OK` - Updated Flow object

### Delete Flow
```http
DELETE /api/flows/{flow_id}
```
**Response**: `204 No Content`

---

## 📊 **Response Models**

### Project
```json
{
  "id": "uuid",
  "user_id": "uuid | null",
  "name": "string",
  "description": "string | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### MCPConfig
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "string",
  "model": "string",
  "temperature": 0.7,
  "max_tokens": 1000,
  "system_prompt": "string | null",
  "instruction": "string | null",
  "selected_tool_ids": ["uuid", "uuid"],
  "deployment_status": "not-deployed | deploying | deployed | failed",
  "deployment_url": "string | null",
  "deployed_at": "timestamp | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### ResponseConfig
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "string",
  "type": "raw-output | llm-reprocess",
  "reprocess_instructions": "string | null",
  "error_handling": "pass-through | retry | fallback",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Tool
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "tool_config": {
    "api": {...},
    "input_schema": {...},
    "output_schema": {...},
    "mapping": {...}
  },
  "project_id": "uuid | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Prompt
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "prompt_template": "string",
  "variables": [...],
  "project_id": "uuid | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Flow
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "steps": {
    "nodes": [...],
    "edges": [...]
  },
  "project_id": "uuid | null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

---

## 🔒 **Error Responses**

### 400 Bad Request
```json
{
  "detail": "Error message describing what went wrong"
}
```

### 404 Not Found
```json
{
  "detail": "Resource {id} not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to perform operation: error details"
}
```

---

## 🚀 **Quick Start Examples**

### Create a Complete Project Setup

```bash
# 1. Create a project
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My MCP Project", "description": "Test project"}'

# Response: {"id": "project-uuid", ...}

# 2. Create a tool
curl -X POST http://localhost:8000/api/projects/project-uuid/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "weather_api",
    "description": "Get weather data",
    "project_id": "project-uuid",
    "tool_config": {...}
  }'

# 3. Create an MCP config
curl -X POST http://localhost:8000/api/projects/project-uuid/mcp-configs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weather Assistant",
    "project_id": "project-uuid",
    "model": "gpt-4o-mini",
    "selected_tool_ids": ["tool-uuid"]
  }'

# 4. Get full project data
curl http://localhost:8000/api/projects/project-uuid/full
```

---

## 📝 **Environment Variables Required**

```bash
# Required for Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# Required for OpenAI
OPENAI-SECRET=sk-...
```

---

## 🧪 **Testing the API**

### Using FastAPI Swagger UI
Visit: `http://localhost:8000/docs`

### Using curl
```bash
# Health check
curl http://localhost:8000/health

# List all projects
curl http://localhost:8000/api/projects

# Create a project
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "description": "My first project"}'
```

### Using Python requests
```python
import requests

# Create a project
response = requests.post(
    "http://localhost:8000/api/projects",
    json={"name": "Test Project", "description": "Created via Python"}
)
project = response.json()
print(f"Created project: {project['id']}")

# Get project with all data
full_project = requests.get(
    f"http://localhost:8000/api/projects/{project['id']}/full"
).json()
print(f"Tools: {len(full_project['tools'])}")
print(f"MCP Configs: {len(full_project['mcp_configs'])}")
```

---

## ✅ **All Endpoints Summary**

| Entity | List | Get | Create | Update | Delete |
|--------|------|-----|--------|--------|--------|
| **Projects** | `GET /api/projects` | `GET /api/projects/{id}` | `POST /api/projects` | `PATCH /api/projects/{id}` | `DELETE /api/projects/{id}` |
| **MCP Configs** | `GET /api/projects/{pid}/mcp-configs` | `GET /api/mcp-configs/{id}` | `POST /api/projects/{pid}/mcp-configs` | `PATCH /api/mcp-configs/{id}` | `DELETE /api/mcp-configs/{id}` |
| **Response Configs** | `GET /api/projects/{pid}/response-configs` | `GET /api/response-configs/{id}` | `POST /api/projects/{pid}/response-configs` | `PATCH /api/response-configs/{id}` | `DELETE /api/response-configs/{id}` |
| **Tools** | `GET /api/projects/{pid}/tools` | `GET /api/tools/{id}` | `POST /api/projects/{pid}/tools` | `PATCH /api/tools/{id}` | `DELETE /api/tools/{id}` |
| **Prompts** | `GET /api/projects/{pid}/prompts` | `GET /api/prompts/{id}` | `POST /api/projects/{pid}/prompts` | `PATCH /api/prompts/{id}` | `DELETE /api/prompts/{id}` |
| **Flows** | `GET /api/projects/{pid}/flows` | `GET /api/flows/{id}` | `POST /api/projects/{pid}/flows` | `PATCH /api/flows/{id}` | `DELETE /api/flows/{id}` |

**Total**: 30 endpoints covering full CRUD operations for 6 entities!

