# 🎯 Frontend Workflow Testing Guide

## Complete Step-by-Step Guide to Test Weather Tool in Builder

This guide walks you through testing the full workflow in the frontend builder interface.

---

## Prerequisites

✅ Frontend running at `http://localhost:3004`  
✅ Backend running at `http://3.136.147.20:8000` (AWS)  
✅ Weather tool already exists in database (confirmed!)

---

## Part 1: Check if Weather Tool Exists

### Step 1: Open Builder

1. Navigate to `http://localhost:3004/builder-v6`
2. Wait for tools to load from backend

### Step 2: Check Tools Tab

1. Click on **"Tools"** tab (🔧 icon)
2. Look for a tool named **"Weather"**

**If you see it:**
- ✅ Great! The tool is already in the database
- 📝 Note the tool's URL: Should be something like `https://wttr.in/London?format=j1`
- Skip to **Part 2**

**If you DON'T see it:**
- Continue to **Step 3** to create it

---

### Step 3: Create Weather Tool (If Needed)

1. Click **"Add Tool"** button in Tools tab
2. Fill in the form:

```
Name: Weather
Description: Get current weather information for any city

Method: GET
URL: https://wttr.in/{city}?format=j1

Headers: (leave empty)
Query Params: (leave empty)
Body: (leave empty)
```

3. Click **"Save Tool"**
4. ✅ Tool should now appear in your tools list

---

## Part 2: Create MCP Config

### Step 4: Go to MCPs Tab

1. Click on **"MCPs"** tab (⚙️ icon)
2. Click **"Add MCP Config"** button

### Step 5: Configure MCP

Fill in the form:

```
Name: Weather Assistant
Description: Uses LLM to intelligently fetch weather data

Type: Standard

Instruction:
You are a weather assistant. When the user asks about weather,
extract the city name from their request and use the Weather tool
to fetch current conditions. Format the response in a friendly way.

Select Tools:
☑️ Weather  (check the Weather tool you just created/found)
```

3. Click **"Save"** (or **"Save & Deploy"**)
4. ✅ MCP config should now appear in your list

---

## Part 3: Create Workflow

### Step 6: Go to Workflow Tab

1. Click on **"Workflow"** tab (🔄 icon)
2. You should see a canvas area

### Step 7: Add MCP Step

1. Click **"Add Step"** button
2. Select **"MCP"** from dropdown
3. Choose your **"Weather Assistant"** MCP config
4. The step should appear in the workflow

---

## Part 4: Test the Workflow

### Step 8: Open Testing Panel

1. Click on **"Testing"** tab (🧪 icon)
2. You should see:
   - Test input field
   - Workflow steps display
   - "Run Test" button

### Step 9: Enter Test Query

In the test input field, type:

```
What's the weather like in Paris?
```

**Or try these variations:**
```
How's the weather in Tokyo?
Is it raining in London?
What's the temperature in New York?
```

### Step 10: Run the Test

1. Click **"Run Test"** button
2. Watch the magic happen! 🎉

---

## What Should Happen (Expected Behavior)

### ✅ Success Flow:

```
1. 🤖 LLM analyzes your question
   → Identifies you want weather for "Paris"
   → Selects the Weather tool

2. 📡 Generates HTTP Request
   → Method: GET
   → URL: https://wttr.in/Paris?format=j1

3. 🌐 Executes API Call
   → Fetches real weather data from wttr.in

4. 💬 LLM Formats Response
   → "The current weather in Paris is 15°C, partly cloudy..."

5. ✅ Display Results
   → You see the full workflow output
   → HTTP request details
   → API response
   → Formatted answer
```

---

## What You'll Actually See (Current Issue) ⚠️

Based on my testing, you'll likely see an **error**:

```
❌ Workflow Failed
Stage: tool_retrieval
Error: Tools not found in registry: ['Weather']
```

### Why This Happens

The workflow orchestrator uses an **in-memory tool registry** that is currently empty. Tools exist in the **database** but aren't automatically loaded into the **registry**.

**Diagram:**

```
┌─────────────────┐         ┌──────────────────┐
│  Database       │         │  Tool Registry   │
│  ✅ Weather Tool │  ❌ NO  │  ❌ Empty         │
└─────────────────┘  SYNC   └──────────────────┘
                                     ↓
                            Workflow Orchestrator
                            (Can't find tools)
```

---

## The Fix (Backend Required)

To make this work, we need to add one function to the backend:

### File: `backend/src/dynamic_tools/api/app.py`

Add this after imports:

```python
from .endpoints import _global_registry
from .database_endpoints import get_supabase_service
from .factory.tool_factory import ToolFactory
from .config.settings import get_settings

@app.on_event("startup")
async def load_tools_from_database():
    """Load all tools from database into workflow registry at startup."""
    settings = get_settings()
    db = SupabaseService(settings.supabase_url, settings.supabase_key)
    
    try:
        # Get all tools from database
        tools = await db.get_tools()
        logger.info(f"Found {len(tools)} tools in database")
        
        factory = ToolFactory(registry=_global_registry)
        
        for tool in tools:
            # Only register tools with basic HTTP info
            if tool.method and tool.url:
                try:
                    # Create tool from database model
                    tool_obj = factory.create_from_database_tool(tool)
                    _global_registry.register(tool_obj)
                    logger.info(f"✅ Registered tool: {tool.name}")
                except Exception as e:
                    logger.warning(f"⚠️ Could not register tool {tool.name}: {e}")
        
        registered_count = len(_global_registry.list_tools())
        logger.info(f"🎉 Loaded {registered_count} tools into workflow registry")
        
    except Exception as e:
        logger.error(f"❌ Failed to load tools from database: {e}")
```

### What This Does:

1. ✅ Runs when backend starts up
2. ✅ Fetches all tools from Supabase
3. ✅ Registers them in the workflow registry
4. ✅ Makes them available to the workflow orchestrator

---

## Testing After the Fix

Once the backend is updated:

### 1. Restart Backend

```bash
cd backend
./start_server.sh
```

Watch the logs - you should see:
```
INFO: Found 4 tools in database
INFO: ✅ Registered tool: Weather
INFO: 🎉 Loaded 4 tools into workflow registry
```

### 2. Test in Frontend

Go back to the Testing Panel and click "Run Test" again.

**This time you should see:**

```
✅ Workflow Executed Successfully! 🎉
Used tool: Weather

Selected Tool: Weather
HTTP Request:
  Method: GET
  URL: https://wttr.in/Paris?format=j1

API Response: {...weather data...}

Formatted Response:
The current weather in Paris is 15°C and partly cloudy.
The humidity is around 65% with a gentle breeze from the west.
Perfect weather for a walk along the Seine! ☁️
```

---

## Advanced Testing

### Test Different Scenarios:

#### 1. Different Cities
```
What's the weather in Tokyo?
How's the weather in Sydney?
Is it sunny in Miami?
```

#### 2. Ambiguous Requests
```
Tell me the weather
(Should ask for location or fail gracefully)
```

#### 3. Multiple Cities (Should fail gracefully)
```
What's the weather in London and Paris?
(Current workflow handles one tool at a time)
```

#### 4. Non-Weather Questions
```
What's 2+2?
(Should fail - no suitable tool)
```

---

## Troubleshooting

### Issue: Tool Not Appearing in Tools Tab

**Solution:**
1. Check browser console for errors
2. Verify backend is running
3. Check network tab - look for `GET /api/projects/{id}/tools`
4. Try refreshing the page

### Issue: "Cannot read properties of undefined"

**Solution:**
1. Make sure you saved the tool before creating MCP
2. Check that the MCP has the tool selected
3. Verify workflow has an MCP step

### Issue: "Workflow Failed - Tool Retrieval Error"

**Solution:**
This is the known issue - backend needs the fix described above.

### Issue: "Network Error" or "502 Bad Gateway"

**Solution:**
1. Check if backend is running: `http://3.136.147.20:8000/health`
2. Check if Next.js proxy is working
3. Look at backend logs for errors

---

## Expected Test Results (After Fix)

| Test Case | Expected Result |
|-----------|-----------------|
| "Weather in Paris" | ✅ Returns Paris weather |
| "Tokyo weather" | ✅ Returns Tokyo weather |
| "Tell me the weather" | ⚠️ May ask for city or use default |
| "What is 2+2?" | ❌ No suitable tool error |
| Empty input | ❌ Validation error |

---

## Screenshots to Take

Document your testing with these screenshots:

1. **Tools Tab** - Weather tool visible
2. **MCPs Tab** - Weather Assistant config
3. **Workflow Tab** - MCP step in canvas
4. **Testing Panel** - Before running test
5. **Test Results** - Success with formatted weather
6. **Network Tab** - API calls (for debugging)

---

## Next Steps After Testing

### If It Works ✅

1. Create more tools (GitHub API, News API, etc.)
2. Test tool selection with multiple tools
3. Try complex workflows with multiple steps
4. Test error handling

### If It Fails ❌

1. Check backend logs: `backend/logs/app.log`
2. Check browser console for frontend errors
3. Verify tool configuration (URL, method)
4. Test the weather API directly: `https://wttr.in/Paris?format=j1`

---

## Quick Test Checklist

- [ ] Frontend running at localhost:3004
- [ ] Backend running (check /health endpoint)
- [ ] Weather tool visible in Tools tab
- [ ] MCP config created with Weather tool
- [ ] Workflow has MCP step
- [ ] Test input entered
- [ ] Run Test clicked
- [ ] Results displayed (even if error)
- [ ] Error details noted
- [ ] Backend fix applied (if needed)
- [ ] Test again after fix
- [ ] Success! 🎉

---

## Demo Video Script

**For recording a demo:**

1. **Opening Shot** (5 sec)
   - "Testing the MCP Factor Weather Workflow"
   
2. **Tools Tab** (10 sec)
   - "First, I'll check if the Weather tool exists"
   - Show the tool

3. **MCPs Tab** (15 sec)
   - "Now I'll create an MCP config"
   - Fill in the form
   - Select Weather tool

4. **Workflow Tab** (10 sec)
   - "Add the MCP step to the workflow"
   - Show the visual step

5. **Testing Panel** (20 sec)
   - "Let's test with a real question"
   - Type: "What's the weather in Paris?"
   - Click Run Test
   - Show results

6. **Closing** (10 sec)
   - "The LLM selected the right tool, executed the API, and formatted the response!"

**Total Time:** ~70 seconds

---

## Success Criteria

You'll know it's working when:

✅ Test runs without errors  
✅ Selected tool shows "Weather"  
✅ HTTP request URL contains the city you asked about  
✅ API response contains real weather data  
✅ Formatted response is human-readable  
✅ Different cities work correctly  

---

## Notes

- The weather API (wttr.in) is **free** and requires **no API key** ✅
- Response time is typically 1-3 seconds
- The LLM (GPT-4) is smart enough to extract city names from natural language
- If the city name is ambiguous, the API uses best guess
- The strict MCP prompt helps ensure accurate tool selection

---

## Want to Try Other Free APIs?

After weather works, try these:

### 1. **REST Countries API**
```
URL: https://restcountries.com/v3.1/name/{country}
Method: GET
Tool: Get Country Info
```

### 2. **Open-Meteo Weather** (Alternative)
```
URL: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true
Method: GET
Tool: Get Weather by Coordinates
```

### 3. **GitHub API**
```
URL: https://api.github.com/search/repositories?q={query}
Method: GET
Tool: Search GitHub Repos
```

All of these work without API keys! 🎉

---

## Summary

**Quick Version:**

1. Open `http://localhost:3004/builder-v6`
2. Go to Tools → Check for "Weather" tool (or create it)
3. Go to MCPs → Create "Weather Assistant" with Weather tool
4. Go to Workflow → Add MCP step
5. Go to Testing → Type "What's the weather in Paris?" → Run Test
6. See results (or error if backend fix not applied)
7. After backend fix → Try again → Success! 🎉

**The workflow system is solid - it just needs the database→registry sync to be complete!**

---

## Questions?

Common questions:

**Q: Do I need to restart frontend after backend changes?**  
A: No, just refresh the page.

**Q: Can I test without fixing the backend?**  
A: Yes! You can test the UI/UX, but the workflow won't execute successfully until the backend fix is applied.

**Q: Will this work with the AWS backend?**  
A: Yes! The current frontend is already pointing to AWS (3.136.147.20:8000).

**Q: Can I add my own API?**  
A: Absolutely! Just create a new tool with your API endpoint.

---

Happy Testing! 🚀🌤️

