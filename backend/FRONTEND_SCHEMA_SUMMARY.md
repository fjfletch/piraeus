# 🎯 Frontend-Compatible Database Schema Summary

## ✅ **What Changed**

All database tables now have **dual ID support** and **frontend-friendly fields** while keeping original backend structure intact.

---

## 📊 **Tables & Columns**

### **1. Tools**
```typescript
{
  id: UUID,              // Backend UUID (keep)
  numeric_id: number,    // NEW: Frontend integer ID (1, 2, 3...)
  name: string,
  description: string,
  
  // Backend format (keep for compatibility)
  tool_config: {
    api: { base_url, method, headers, etc }
  },
  
  // NEW: Flattened frontend fields (auto-synced via triggers)
  method: "GET" | "POST" | etc,
  url: "https://full-url.com",
  headers: [{key: "...", value: "..."}],
  query_params: [{key: "...", value: "..."}],
  body_config: {...},
  
  project_id: UUID | null,  // Optional (null = global)
  created_at: timestamp,
  updated_at: timestamp
}
```

### **2. Prompts**
```typescript
{
  id: UUID,
  numeric_id: number,        // NEW
  name: string,
  description: string,
  
  // Backend format
  prompt_template: string,
  variables: ["name", "age"],
  
  // NEW: Simple frontend field (auto-synced)
  content: string,
  
  project_id: UUID | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **3. MCP Configs**
```typescript
{
  id: UUID,
  numeric_id: number,        // NEW
  name: string,
  model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 1000,
  system_prompt: string,
  instruction: string,
  selected_tool_ids: UUID[],
  deployment_status: "not-deployed" | "deploying" | "deployed" | "failed",
  deployment_url: string | null,
  deployed_at: timestamp | null,
  project_id: UUID | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **4. Response Configs**
```typescript
{
  id: UUID,
  numeric_id: number,        // NEW
  name: string,
  type: "raw-output" | "llm-reprocess",
  reprocess_instructions: string | null,
  error_handling: "pass-through" | "retry" | "fallback",
  project_id: UUID | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **5. Flows**
```typescript
{
  id: UUID,
  numeric_id: number,        // NEW
  name: string,
  description: string,
  
  // Backend graph format
  steps: {
    nodes: [...],
    edges: [...]
  },
  
  // NEW: v6 builder linear format
  steps_array: [
    { stepType, stepName, stepId, config }
  ],
  
  project_id: UUID | null,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## 🔗 **API Endpoints**

### **By UUID (Backend)**
```
GET    /api/projects/{uuid}/tools
GET    /api/tools/{uuid}
POST   /api/projects/{uuid}/tools
PATCH  /api/tools/{uuid}
DELETE /api/tools/{uuid}
```

### **By Numeric ID (Frontend)** ⭐ NEW
```
GET    /api/tools/by-numeric-id/{numeric_id}
GET    /api/prompts/by-numeric-id/{numeric_id}
GET    /api/mcp-configs/by-numeric-id/{numeric_id}
GET    /api/response-configs/by-numeric-id/{numeric_id}
GET    /api/flows/by-numeric-id/{numeric_id}
```

---

## 🔄 **Auto-Sync Triggers**

Database triggers automatically keep fields in sync:

1. **Tools**: `tool_config` ↔ flattened fields (`method`, `url`, `headers`, etc.)
2. **Prompts**: `prompt_template` ↔ `content`
3. **Flows**: Frontend can use either `steps` or `steps_array`

**You can write to either format** - the triggers will sync both!

---

## 💡 **Frontend Integration**

### **Option 1: Use Numeric IDs** (Recommended)
```typescript
// Fetch tools by numeric ID
const tool = await fetch('/api/tools/by-numeric-id/1')

// Use flattened fields directly
console.log(tool.method)  // "GET"
console.log(tool.url)     // "https://..."
```

### **Option 2: Convert UUIDs to Numeric IDs**
```typescript
// Get numeric_id from UUID response
const tools = await fetch('/api/projects/{uuid}/tools')
tools.forEach(tool => {
  console.log(tool.numeric_id)  // Use this for frontend state
})
```

### **Create/Update with Flattened Fields**
```typescript
// Frontend sends simple format
POST /api/projects/{uuid}/tools
{
  name: "My Tool",
  method: "GET",
  url: "https://api.example.com",
  headers: [{key: "Auth", value: "Bearer ..."}]
}

// Backend auto-generates tool_config via trigger
// Both formats are saved ✅
```

---

## 🎯 **Key Benefits**

✅ **Backward Compatible**: All existing backend code still works  
✅ **Frontend Friendly**: Simple integer IDs + flat fields  
✅ **Auto-Synced**: Triggers keep both formats updated  
✅ **Flexible**: Use UUIDs OR numeric IDs  
✅ **Global Mode**: `project_id` can be `null` for shared resources

---

## 🧪 **Testing Status**

✅ All 14 database endpoint tests passing  
✅ Numeric ID lookups verified  
✅ Flattened fields tested  
✅ Auto-sync triggers working  
✅ Live API tested with real Supabase data

---

## 📝 **Migration Applied**

- **Migration 001**: Created base tables (projects, tools, prompts, flows, mcp_configs, response_configs)
- **Migration 002**: Added `numeric_id` + frontend fields + auto-sync triggers ✅

All existing data has been migrated and numeric IDs assigned.

