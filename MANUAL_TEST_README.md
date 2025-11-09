# Manual Test Guide: MCP Workflow with Riftbound API

This guide explains how to manually test the complete MCP workflow integration using the real Riftbound Top Decks API.

## Overview

The manual test demonstrates the end-to-end MCP workflow:
1. **Tool Registration**: Define API tools (Riftbound cards & decks)
2. **LLM Tool Selection**: LLM chooses the right tool based on user instructions
3. **API Execution**: System calls the selected API
4. **Optional Formatting**: LLM formats the raw response for humans

## Test Script

Run the simulation:
```bash
python3 mcp-factor/manual_test_riftbound_workflow.py
```

This shows:
- ✅ Tool configurations for Riftbound API
- ✅ Expected workflow behavior for 4 test scenarios
- ✅ Real API call to verify Riftbound is accessible

## Test Scenarios

### Test 1: Simple API Call (No Formatting)
```json
{
  "user_instructions": "Get all cards from the Riftbound API",
  "tool_ids": ["get_riftbound_cards"],
  "format_response": false
}
```
**Result**: Raw JSON with all 376 cards

### Test 2: Get 5 Random Fury Cards (With Formatting)
```json
{
  "user_instructions": "Get all cards from the Riftbound API",
  "tool_ids": ["get_riftbound_cards"],
  "format_response": true,
  "response_format_instructions": "From the response, randomly select 5 cards that have 'Fury' as their domain..."
}
```
**Result**: LLM filters and formats 5 Fury cards in human-readable format

### Test 3: Get Deck Information
```json
{
  "user_instructions": "Get all decks from the Riftbound API",
  "tool_ids": ["get_riftbound_decks"],
  "format_response": true,
  "response_format_instructions": "Summarize the top 5 most recent decks..."
}
```
**Result**: Formatted summary of recent decks

### Test 4: Multi-Tool Selection
```json
{
  "user_instructions": "Show me information about Riftbound deck lists",
  "tool_ids": ["get_riftbound_cards", "get_riftbound_decks"],
  "format_response": true
}
```
**Result**: LLM intelligently chooses `get_riftbound_decks` based on "deck lists" in the instruction

## Running with Real Backend

### Prerequisites

1. **Install dependencies**:
   ```bash
   cd mcp-factor/backend
   pip install -e .
   ```

2. **Set OpenAI API key**:
   ```bash
   export OPENAI_API_KEY="your-key-here"
   ```

3. **Start the backend server**:
   ```bash
   cd mcp-factor/backend
   python -m uvicorn dynamic_tools.api.app:app --reload
   ```

### Execute Real Workflow

Once the server is running, you can make real workflow requests:

```bash
curl -X POST http://localhost:8000/workflow \
  -H 'Content-Type: application/json' \
  -d '{
    "user_instructions": "Get 5 random Fury cards from Riftbound",
    "tool_ids": ["get_riftbound_cards"],
    "format_response": true,
    "response_format_instructions": "Select 5 random Fury domain cards and list their names, energy, and descriptions"
  }'
```

## API Information

### Riftbound Top Decks API

- **Base URL**: `https://riftbound-top-decks-api-git-main-stevenabouchedids-projects.vercel.app`
- **Endpoints**:
  - `GET /api/cards` - Returns all 376 cards
  - `GET /api/decks` - Returns all deck lists

### Card Properties
- `name`: Card name
- `type`: Unit, Spell, Gear, etc.
- `rarity`: Common, Uncommon, Rare, Epic
- `domain`: Fury, Mind, Body, Calm, Order, Chaos
- `energy`: Energy cost
- `power`: Power value
- `might`: Might value
- `description`: Card effect text

### Deck Properties
- `name`: Deck name
- `legend`: Legend/commander used
- `owner`: Player name
- `size`: Number of cards
- `created_at`: Creation timestamp

## Expected Results

When running the real workflow:

1. **Tool Selection**: LLM analyzes the instruction and available tools
2. **HTTP Spec Generation**: LLM creates a valid HTTPRequestSpec
3. **API Execution**: System calls Riftbound API
4. **Response**: Returns both raw JSON and formatted text

Example success response:
```json
{
  "status": "success",
  "selected_tool": "get_riftbound_cards",
  "http_spec": {
    "method": "GET",
    "url": "https://riftbound-top-decks-api.../api/cards"
  },
  "raw_response": {
    "status_code": 200,
    "body": [...376 cards...],
    "execution_time_ms": 234.5
  },
  "formatted_response": "Here are 5 random Fury cards:\n1. Raging Firebrand..."
}
```

## Troubleshooting

### "Connection refused" error
- Make sure the backend server is running on port 8000
- Check: `curl http://localhost:8000/docs`

### "Tool not found" error
- Tools need to be registered first (not yet implemented in this test)
- For now, the test shows what the tool configs would look like

### "OpenAI API error"
- Verify your API key is set: `echo $OPENAI_API_KEY`
- Check you have credits available

### Riftbound API timeout
- The API is hosted on Vercel and should be accessible
- Test directly: `curl https://riftbound-top-decks-api-git-main-stevenabouchedids-projects.vercel.app/api/cards`

## Next Steps

To fully implement this workflow:

1. **Add Tool Registration Endpoint**: Create POST `/tools` to register ToolConfig objects
2. **Persist Tools**: Store tools in a database or registry
3. **Complete Integration**: Wire up the workflow endpoint to use registered tools
4. **Add More Tools**: Register other APIs (weather, stocks, etc.)

## Notes

- The test script currently simulates the workflow behavior
- The Riftbound API is public and requires no authentication
- Real LLM calls will incur OpenAI API costs
- The workflow supports any REST API that returns JSON
