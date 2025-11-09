# OpenAI Responses API - MCP Server Testing Guide

This guide shows how to test your MCP server at `https://adventurous-vision-production.up.railway.app/mcp` using the OpenAI Responses API, based on [the official OpenAI MCP tool guide](https://cookbook.openai.com/examples/mcp/mcp_tool_guide).

## What is the Responses API?

The OpenAI Responses API is a new API that makes it easy to integrate with MCP servers. Instead of manually wiring function calls, you can:

1. **Declare the MCP server** - Tell the API where your MCP server is
2. **Import the tool list** - The API automatically fetches available tools
3. **Call tools directly** - The model interacts directly with the MCP server
4. **Reduce latency** - No need for backend coordination between model and tools

[Reference: OpenAI MCP Tool Guide](https://cookbook.openai.com/examples/mcp/mcp_tool_guide)

## Prerequisites

1. **OpenAI API Key** - Get one from [platform.openai.com](https://platform.openai.com/account/api-keys)
2. **Python 3.9+** with `httpx` and `python-dotenv`
3. **MCP Server running** at the URL above

## Setup

### 1. Install Dependencies

```bash
cd mcp-factor/backend
uv add httpx python-dotenv  # or: pip install httpx python-dotenv
```

### 2. Set Your OpenAI API Key

Create or update `.env`:

```bash
# .env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

Or set it directly in your terminal:

```bash
export OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Verify Your MCP Server is Running

Check that your server is accessible:

```bash
curl https://adventurous-vision-production.up.railway.app/mcp/tools/list
```

You should get a valid MCP response (might require proper MCP headers).

## Running the Tests

### Run All Tests

```bash
uv run python test_openai_responses_mcp.py
```

Or with pip:

```bash
python test_openai_responses_mcp.py
```

### Expected Output

```
🧪 OPENAI RESPONSES API - MCP SERVER TESTS 🧪
Server URL: https://adventurous-vision-production.up.railway.app/mcp

================================================================================
TEST 1: Basic MCP Tool Discovery
================================================================================
✅ Request successful!

Response:
{
  "id": "resp_...",
  "object": "response",
  "model": "gpt-4.1",
  "content": [
    {
      "type": "text",
      "text": "Here are the available tools..."
    }
  ],
  ...
}

================================================================================
TEST 2: Health Check Tool
================================================================================
✅ Health check request successful!
...

[Additional test results]

================================================================================
TEST SUMMARY
================================================================================
✅ PASS: Basic Tool Discovery
✅ PASS: Health Check
✅ PASS: Generate Config
✅ PASS: Tool Filtering
✅ PASS: Context Caching

Total: 5/5 tests passed

🎉 All tests passed!
```

## Test Descriptions

### Test 1: Basic Tool Discovery
- **What it does**: Asks the model to list all available tools from your MCP server
- **Why it matters**: Verifies the MCP server is reachable and has tools
- **Expected result**: Model should describe all available tools

### Test 2: Health Check
- **What it does**: Calls the `health_check` tool specifically
- **Why it matters**: Confirms your MCP server is responding to tool calls
- **Expected result**: Should return "✅ FastMCP server is healthy and ready!"

### Test 3: Generate Config
- **What it does**: Uses `generate_tool_config` to auto-generate a weather tool configuration
- **Why it matters**: Tests your core MVP functionality through the Responses API
- **Expected result**: Returns a complete `ToolConfig` for the weather API

### Test 4: Tool Filtering
- **What it does**: Uses `allowed_tools` to limit which tools the model can access
- **Why it matters**: Shows how to reduce token overhead by filtering tools
- **Expected result**: Model only sees `health_check` and `execute_http_request`

### Test 5: Context Caching
- **What it does**: Makes two requests, using `previous_response_id` on the second
- **Why it matters**: Demonstrates token optimization through context caching
- **Expected result**: Second request uses fewer input tokens (cached_tokens > 0)

## Key API Concepts

### 1. MCP Tool Declaration

```json
{
  "type": "mcp",
  "server_label": "dynamic_tools",
  "server_url": "https://adventurous-vision-production.up.railway.app/mcp",
  "allowed_tools": ["health_check", "generate_tool_config"],
  "require_approval": "never"
}
```

- `server_label`: Identifier for the MCP server
- `server_url`: Where the MCP server is hosted
- `allowed_tools`: (Optional) Limit which tools are available to reduce token overhead
- `require_approval`: Set to "never" for testing, "always" for safety

### 2. Tool Caching

The Responses API caches the MCP tool list to avoid redundant requests:

```python
# First request - fetches tool list
response1 = api.post(...)  # Creates mcp_list_tools item

# Follow-up request - reuses cached list
response2 = api.post(..., previous_response_id=response1["id"])
# Fewer input tokens because tool list is cached
```

### 3. Token Optimization

According to the OpenAI guide, you should:

1. **Use `allowed_tools`** to reduce the number of tools exposed
   - Example: Expose only `generate_tool_config` instead of all 5 tools
   - Can save 200+ tokens

2. **Use context caching** with `previous_response_id`
   - Reduces input tokens on follow-up messages
   - Critical for long conversations

3. **Avoid reasoning models** for tool calling
   - `gpt-4.1` is more efficient than `o4-mini` for MCP
   - Reasoning models produce 10x more tokens

## Troubleshooting

### Error: "OPENAI_API_KEY not set"

Make sure you've set your API key:

```bash
export OPENAI_API_KEY=sk-...
# or in .env:
OPENAI_API_KEY=sk-...
```

### Error: "Request failed with status 401"

Check your OpenAI API key is valid and has credit:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Error: "Request failed with status 500 from MCP server"

Your MCP server might be down or misconfigured. Test it directly:

```bash
curl -v https://adventurous-vision-production.up.railway.app/mcp
```

### Error: "Tool not found" when calling a specific tool

The tool name might be wrong or not exposed by your MCP server. Check available tools by running Test 1.

### Test times out (>30 seconds)

Some operations (like `generate_tool_config`) can be slow:
- First attempt: Wait for LLM to generate config
- Subsequent calls: Should be faster due to caching

Increase timeout if needed in the test file (line with `timeout=30.0`).

## Next Steps

### 1. Build a Production Workflow

Adapt the test pattern for your frontend:

```python
async def create_tool_via_openai_responses(api_docs: str, api_key: str) -> dict:
    """Create a tool using OpenAI Responses API."""
    response = httpx.post(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
        json={
            "model": "gpt-4.1",
            "tools": [{
                "type": "mcp",
                "server_url": MCP_SERVER_URL,
                "allowed_tools": ["generate_tool_config"],
                "require_approval": "never"
            }],
            "input": f"Generate a tool config from: {api_docs}"
        }
    )
    return response.json()
```

### 2. Add Error Handling

```python
if response.status_code != 200:
    error_detail = response.json().get("error", {})
    raise ValueError(f"MCP Error: {error_detail.get('message')}")
```

### 3. Implement Tool Caching

Store the `previous_response_id` to reduce tokens on follow-up calls:

```python
# Store response ID
session.mcp_context_id = response.json()["id"]

# Reuse in next request
next_response = httpx.post(
    "https://api.openai.com/v1/responses",
    json={
        ...
        "previous_response_id": session.mcp_context_id
    }
)
```

### 4. Monitor Performance

Track metrics from the response:

```python
usage = response.json()["usage"]
print(f"Input: {usage['input_tokens']}")
print(f"Cached: {usage.get('input_tokens_details', {}).get('cached_tokens', 0)}")
print(f"Output: {usage['output_tokens']}")
```

## Important Notes

⚠️ **From the OpenAI guide:**

> Authorization keys and the server URL must be included with every API call. These values won't appear in response objects.

This means:
- Your API key is used only to authenticate with OpenAI (not exposed)
- The MCP server URL is used only for this request (not stored)
- For security, set `require_approval: "always"` in production

## Resources

- [OpenAI Responses API MCP Tool Guide](https://cookbook.openai.com/examples/mcp/mcp_tool_guide)
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)

## Support

If tests fail:

1. Check that your MCP server is running and accessible
2. Verify your OpenAI API key is valid
3. Check OpenAI API status at [status.openai.com](https://status.openai.com)
4. Review error messages for specific details

Good luck! 🚀

