# Supabase Schema Analysis & Mapping to Frontend Requirements

## 🔍 Discovered Schema

### Existing Tables in Supabase

#### 1. **`tools`** (catalog schema)
```
Columns:
- id: uuid (primary key)
- name: text (NOT NULL)
- description: text
- tool_config: jsonb (stores full tool configuration)
- created_at: timestamp
- updated_at: timestamp

Sample tool_config structure:
{
  "url": "https://serpapi.com/showtimes-results",
  "type": "api",
  "method": "GET",
  "api_key": "...",
  "headers": {...},
  "api_key_header": "..."
}

Current data: 3 tools exist
```

**✅ PERFECT MATCH** - This table already matches the ToolConfig model in the backend!

#### 2. **`prompts`** (catalog schema)
```
Columns (inferred from error messages):
- id: uuid (primary key)
- name: text (NOT NULL)
- (other columns unknown - table is empty)

Current data: Empty table
```

**⚠️ NEEDS INVESTIGATION** - Need to see full schema or create test entry

#### 3. **`flows`** (orchestration schema)
```
Columns (inferred from error messages):
- id: uuid (primary key)
- name: text (NOT NULL)
- (other columns unknown - table is empty)

Current data: Empty table
```

**⚠️ NEEDS INVESTIGATION** - This likely stores workflow definitions

---

## 📋 Frontend Requirements Mapping

### What Frontend Needs:

1. **Projects** - Top-level container
2. **Tools** - HTTP API definitions  
3. **Prompts** - Reusable text snippets
4. **MCP Configs** - LLM configurations with tools
5. **Response Configs** - Response handlers
6. **Workflows** - Ordered sequences of steps

### Current Status:

| Frontend Need | Supabase Table | Status | Notes |
|--------------|----------------|---------|-------|
| **Tools** | ✅ `tools` | **READY** | Perfect match, already has data |
| **Prompts** | ⚠️ `prompts` | **EXISTS** | Need full schema |
| **Workflows** | ⚠️ `flows` | **EXISTS** | Need full schema |
| **Projects** | ❌ Missing | **CREATE** | Or use workspaces? |
| **MCP Configs** | ❌ Missing | **CREATE** | New table needed |
| **Response Configs** | ❌ Missing | **CREATE** | New table needed |

---

## 🎯 Recommended Approach

### Option A: **Minimal Changes** (Use Existing Structure)

Map frontend requirements to existing tables:

```
Frontend          → Supabase Table → Structure
─────────────────────────────────────────────────────────────
Tools             → tools          → ✅ Already perfect
Prompts           → prompts        → Need to verify schema
Workflows         → flows          → Need to verify schema
Projects          → (add column)   → Add project_id to existing tables
MCP Configs       → tools          → Store as special tool type
Response Configs  → tools          → Store as special tool type
```

**Pros:**
- Minimal database changes
- Use existing tables
- Faster implementation

**Cons:**
- Less clear data model
- MCP Configs mixed with Tools
- May not match frontend expectations

---

### Option B: **Create Missing Tables** (Clean Separation)

Create new tables for missing entities:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MCP Configs table
CREATE TABLE mcp_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o-mini',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 1000,
  system_prompt TEXT,
  instruction TEXT,
  selected_tool_ids UUID[] DEFAULT '{}', -- Array of tool IDs
  deployment_status TEXT DEFAULT 'not-deployed',
  deployment_url TEXT,
  deployed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Response Configs table
CREATE TABLE response_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'raw-output', -- 'raw-output' or 'llm-reprocess'
  reprocess_instructions TEXT,
  error_handling TEXT DEFAULT 'pass-through',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add project_id to existing tables
ALTER TABLE tools ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE prompts ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE flows ADD COLUMN project_id UUID REFERENCES projects(id);
```

**Pros:**
- Clear, organized data model
- Each entity has its own table
- Matches frontend expectations exactly
- Easier to query and maintain

**Cons:**
- Requires database migrations
- More tables to manage

---

## 🔧 How Existing `tool_config` Maps to Backend

The current `tools.tool_config` JSONB structure is **very close** to our backend's `ToolConfig` model:

### Current Supabase Structure:
```json
{
  "url": "https://api.example.com",
  "method": "GET",
  "type": "api",
  "api_key": "...",
  "headers": {},
  "api_key_header": "X-API-Key"
}
```

### Backend ToolConfig Model:
```json
{
  "name": "tool_name",
  "description": "...",
  "version": 1,
  "enabled": true,
  "api": {
    "base_url": "https://api.example.com",
    "path": "",
    "method": "GET",
    "headers": {},
    "params": {},
    "auth": {
      "method": "api_key_header",
      "key_name": "X-API-Key",
      "secret_ref": "${API_KEY}"
    },
    "timeout": 30.0
  },
  "input_schema": {...},
  "output_schema": {...},
  "mapping": {...},
  "tags": []
}
```

**Action Needed:** 
- Migrate existing tools to new format, OR
- Update backend to accept both formats

---

## 💡 My Recommendation

**Go with Option B (Create Missing Tables)** for these reasons:

1. **Clean Architecture**: Each concept gets its own table
2. **Frontend Alignment**: Matches exactly what frontend expects
3. **Scalability**: Easier to add features later
4. **Type Safety**: UUID references prevent orphaned data
5. **Already Exists**: The `tools`, `prompts`, and `flows` tables are there - just need to add the others

### Implementation Steps:

1. **Phase 1**: Create missing tables
   ```sql
   CREATE TABLE projects (...)
   CREATE TABLE mcp_configs (...)
   CREATE TABLE response_configs (...)
   ```

2. **Phase 2**: Add `project_id` foreign keys
   ```sql
   ALTER TABLE tools ADD COLUMN project_id UUID REFERENCES projects(id);
   ALTER TABLE prompts ADD COLUMN project_id UUID REFERENCES projects(id);
   ALTER TABLE flows ADD COLUMN project_id UUID REFERENCES projects(id);
   ```

3. **Phase 3**: Migrate existing tools
   - Create a default project
   - Assign existing tools to it

4. **Phase 4**: Build API endpoints
   - CRUD for each entity
   - Deploy endpoint for MCP configs
   - Test endpoint for workflows

---

## 📊 Final Schema Diagram

```
projects (NEW)
├── id
├── name
├── description  
├── user_id
└── timestamps

tools (EXISTS)
├── id
├── project_id (NEW FK)
├── name
├── description
├── tool_config (jsonb)
└── timestamps

prompts (EXISTS)
├── id
├── project_id (NEW FK)
├── name
├── content (needs verification)
└── timestamps

mcp_configs (NEW)
├── id
├── project_id (FK)
├── name
├── model
├── temperature
├── max_tokens
├── system_prompt
├── selected_tool_ids (uuid[])
├── deployment_status
├── deployment_url
└── timestamps

response_configs (NEW)
├── id
├── project_id (FK)
├── name
├── type
├── reprocess_instructions
├── error_handling
└── timestamps

flows (EXISTS)
├── id
├── project_id (NEW FK)
├── name
├── steps (jsonb - needs verification)
└── timestamps
```

---

## ❓ Questions to Answer

1. **What is the full schema of `prompts` table?**
   - Need to query or create a test entry

2. **What is the full schema of `flows` table?**
   - Does it already have a `steps` column?
   - What format is it in?

3. **Should we use `workspaces` instead of `projects`?**
   - Is there already a workspaces table in identity schema?

4. **How should workflow steps be structured?**
   - JSON array of steps?
   - Separate table?

---

## 🚀 Next Steps

**Please decide:**

1. **Option A** (minimal) or **Option B** (clean) approach?
2. Should I create SQL migration files for missing tables?
3. Should I inspect `prompts` and `flows` schema more deeply?
4. Do you want me to start building the API endpoints?

