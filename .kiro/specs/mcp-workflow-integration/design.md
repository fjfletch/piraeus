# Design Document: MCP Workflow Integration

## Overview

The MCP Workflow Integration feature creates an end-to-end orchestration system that connects user requests from the frontend through tool selection, API execution, and optional response formatting. The design leverages existing components (ToolRegistry, PromptService, HTTPClientService) and introduces a new WorkflowOrchestrator service and workflow endpoint to coordinate the multi-stage process.

The workflow follows this sequence:
1. Frontend submits user instructions + tool IDs
2. System retrieves tool configurations from registry
3. LLM analyzes tools and generates HTTP request specification
4. System executes the API call
5. Optionally, LLM formats the raw response for human consumption
6. System returns comprehensive results to frontend

## Architecture

### Component Diagram

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ POST /workflow
       ▼
┌─────────────────────────────────────────┐
│         FastAPI Endpoint Layer          │
│  (/workflow endpoint in endpoints.py)   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│      WorkflowOrchestrator Service       │
│  (new: workflow_orchestrator.py)        │
│                                         │
│  Coordinates:                           │
│  1. Tool retrieval                      │
│  2. LLM tool selection                  │
│  3. API execution                       │
│  4. Optional response formatting        │
└──┬────┬────┬────────────────────────────┘
   │    │    │
   │    │    └──────────────┐
   │    │                   │
   ▼    ▼                   ▼
┌──────────┐  ┌──────────────┐  ┌──────────────┐
│   Tool   │  │    Prompt    │  │  HTTP Client │
│ Registry │  │   Service    │  │   Service    │
└──────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

```
1. WorkflowRequest
   ├─ user_instructions: str
   ├─ tool_ids: list[str]
   ├─ format_response: bool = False
   └─ response_format_instructions: str | None

2. Tool Retrieval
   ToolRegistry.get_multiple(tool_ids) → list[ToolConfig]

3. Tool Context Generation
   format_tools_as_context(tools) → str (API docs)

4. LLM Tool Selection
   PromptService.prompt_mcp(instructions, api_docs) → HTTPRequestSpec

5. API Execution
   HTTPClientService.execute(http_spec) → HTTPResponseSpec

6. Optional Formatting
   if format_response:
       PromptService.prompt_normal(raw_response) → formatted_text

7. WorkflowResponse
   ├─ status: "success" | "error"
   ├─ selected_tool: str | None
   ├─ http_spec: dict | None
   ├─ raw_response: dict | None
   ├─ formatted_response: str | None
   ├─ error: str | None
   └─ error_stage: str | None
```

## Components and Interfaces

### 1. New Request/Response Models

**File:** `backend/src/dynamic_tools/models/api_requests.py`

Add new models:

```python
class WorkflowRequest(BaseModel):
    """Request model for complete MCP workflow execution."""
    
    user_instructions: str = Field(
        ...,
        description="Natural language instructions for what to accomplish",
        min_length=1
    )
    tool_ids: list[str] = Field(
        ...,
        description="List of tool identifiers to make available for selection",
        min_length=1
    )
    format_response: bool = Field(
        default=False,
        description="Whether to format the raw API response using LLM"
    )
    response_format_instructions: Optional[str] = Field(
        default=None,
        description="Custom instructions for response formatting"
    )


class WorkflowResponse(BaseModel):
    """Response model for workflow execution results."""
    
    status: Literal["success", "error"] = Field(
        ...,
        description="Overall workflow execution status"
    )
    selected_tool: Optional[str] = Field(
        default=None,
        description="Name of the tool selected by LLM (present on success)"
    )
    http_spec: Optional[dict] = Field(
        default=None,
        description="Generated HTTP request specification (present on success)"
    )
    raw_response: Optional[dict] = Field(
        default=None,
        description="Raw API response data (present on success)"
    )
    formatted_response: Optional[str] = Field(
        default=None,
        description="LLM-formatted response (present when format_response=true)"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message (present on error)"
    )
    error_stage: Optional[Literal[
        "tool_retrieval",
        "tool_context_generation",
        "llm_selection",
        "api_execution",
        "response_formatting"
    ]] = Field(
        default=None,
        description="Stage where error occurred (present on error)"
    )
```

### 2. WorkflowOrchestrator Service

**File:** `backend/src/dynamic_tools/services/workflow_orchestrator.py` (new)

```python
class WorkflowOrchestrator:
    """Orchestrates the complete MCP workflow from request to response."""
    
    def __init__(
        self,
        tool_registry: ToolRegistry,
        prompt_service: PromptService,
        http_client: HTTPClientService
    ):
        """Initialize with required services."""
        
    async def execute_workflow(
        self,
        request: WorkflowRequest
    ) -> WorkflowResponse:
        """Execute the complete workflow."""
        # 1. Retrieve tools
        # 2. Generate tool context
        # 3. LLM tool selection
        # 4. Execute API
        # 5. Optional formatting
        # 6. Build response
        
    def _retrieve_tools(
        self,
        tool_ids: list[str]
    ) -> tuple[list[ToolConfig], list[str]]:
        """Retrieve tools from registry, return (found_tools, missing_ids)."""
        
    def _format_tools_as_context(
        self,
        tools: list[ToolConfig]
    ) -> str:
        """Convert tool configs to structured API documentation string."""
        
    def _extract_tool_name_from_spec(
        self,
        http_spec: HTTPRequestSpec,
        tools: list[ToolConfig]
    ) -> str:
        """Determine which tool was selected by matching URL/endpoint."""
```

### 3. ToolRegistry Enhancement

**File:** `backend/src/dynamic_tools/core/registry.py`

Add method to retrieve multiple tools:

```python
def get_multiple(
    self,
    tool_names: list[str]
) -> tuple[list[BaseTool], list[str]]:
    """Get multiple tools by name.
    
    Returns:
        Tuple of (found_tools, missing_names)
    """
```

### 4. Workflow Endpoint

**File:** `backend/src/dynamic_tools/api/endpoints.py`

Add new endpoint:

```python
@router.post(
    "/workflow",
    response_model=WorkflowResponse,
    summary="Complete MCP Workflow",
    description="Execute full workflow: tool selection, API execution, optional formatting",
    tags=["Workflow", "MCP"]
)
async def workflow_endpoint(
    request: WorkflowRequest,
    settings: Settings = Depends(get_settings)
) -> WorkflowResponse:
    """Execute complete MCP workflow."""
```

### 5. Enhanced Prompt Templates

**File:** `backend/src/dynamic_tools/services/prompt_templates.py`

Add new template method:

```python
@staticmethod
def workflow_tool_selection_prompt(
    instructions: str,
    tools_context: str
) -> tuple[str, str]:
    """Generate prompt for tool selection in workflow mode.
    
    System prompt instructs LLM to:
    - Analyze available tools
    - Select most appropriate tool
    - Extract parameters from instructions
    - Generate complete HTTPRequestSpec
    
    Returns:
        Tuple of (system_prompt, user_prompt)
    """
```

## Data Models

### Tool Context Format

When converting ToolConfig objects to context string for LLM:

```
Available Tools:

Tool: get_stock_quote
Description: Get real-time stock quote from Alpha Vantage API
Endpoint: GET https://www.alphavantage.co/query
Required Parameters:
  - symbol (string): Stock ticker symbol (e.g., IBM, AAPL)
Query Parameters:
  - function: GLOBAL_QUOTE (static)
  - apikey: [authenticated]
Expected Output:
  - symbol (string)
  - price (number)
  - change (number)
  - volume (integer)

Tool: get_weather
Description: Get current weather for a city
Endpoint: GET https://api.openweathermap.org/data/2.5/weather
Required Parameters:
  - city (string): City name
Query Parameters:
  - q: {city}
  - appid: [authenticated]
Expected Output:
  - temperature (number)
  - conditions (string)
  - humidity (number)
```

### HTTPRequestSpec Matching

To determine which tool was selected, match the generated HTTPRequestSpec URL against tool base_url + path patterns.

## Error Handling

### Error Stages and Handling Strategy

1. **tool_retrieval**: Missing tool IDs
   - Return error immediately with list of missing IDs
   - HTTP 200 with status="error"

2. **tool_context_generation**: Tool formatting fails
   - Log error with tool details
   - Return error with problematic tool info
   - HTTP 200 with status="error"

3. **llm_selection**: LLM fails to generate valid HTTPRequestSpec
   - Retry with tenacity (already in PromptService)
   - If all retries fail, return error
   - HTTP 200 with status="error"

4. **api_execution**: HTTP request fails
   - Capture HTTPResponseSpec with error status
   - Return as success with error details in raw_response
   - HTTP 200 with status="success" (API was called, just returned error)

5. **response_formatting**: LLM formatting fails
   - Log warning
   - Return success with raw_response but no formatted_response
   - Include warning in response metadata
   - HTTP 200 with status="success"

### Error Response Example

```json
{
  "status": "error",
  "error": "Tools not found in registry: ['invalid_tool_1', 'invalid_tool_2']",
  "error_stage": "tool_retrieval",
  "selected_tool": null,
  "http_spec": null,
  "raw_response": null,
  "formatted_response": null
}
```

### Success Response Example

```json
{
  "status": "success",
  "selected_tool": "get_stock_quote",
  "http_spec": {
    "method": "GET",
    "url": "https://www.alphavantage.co/query",
    "query_params": {
      "function": "GLOBAL_QUOTE",
      "symbol": "IBM",
      "apikey": "***"
    }
  },
  "raw_response": {
    "status_code": 200,
    "body": {
      "Global Quote": {
        "01. symbol": "IBM",
        "05. price": "142.50"
      }
    },
    "execution_time_ms": 234.5
  },
  "formatted_response": "The current stock price for IBM is $142.50.",
  "error": null,
  "error_stage": null
}
```

## Testing Strategy

### Unit Tests

1. **WorkflowOrchestrator Tests** (`test_workflow_orchestrator.py`)
   - Test `_retrieve_tools` with valid/invalid IDs
   - Test `_format_tools_as_context` with various ToolConfig objects
   - Test `_extract_tool_name_from_spec` with matching/non-matching specs
   - Mock all service dependencies

2. **Endpoint Tests** (`test_workflow_endpoint.py`)
   - Test workflow endpoint with valid request
   - Test with missing tools
   - Test with format_response=true/false
   - Test error scenarios at each stage
   - Mock WorkflowOrchestrator

3. **Model Tests** (`test_workflow_models.py`)
   - Validate WorkflowRequest with various inputs
   - Validate WorkflowResponse serialization
   - Test field validation rules

### Integration Tests

1. **End-to-End Workflow** (`test_workflow_integration.py`)
   - Register real tools in test registry
   - Execute complete workflow with real LLM calls (or mocked)
   - Verify response structure
   - Test with multiple tools
   - Test formatting flow

2. **Error Path Testing**
   - Trigger errors at each stage
   - Verify error responses match specification
   - Verify logging captures sufficient context

### Manual Testing Scenarios

1. Single tool selection with simple instruction
2. Multiple tools with ambiguous instruction (verify LLM picks correctly)
3. Tool requiring complex parameter extraction
4. API returning error status (verify graceful handling)
5. Response formatting with custom instructions
6. Missing tool IDs (verify error handling)

## Implementation Notes

### Tool Context Generation Strategy

The `_format_tools_as_context` method should:
- Include tool name and description prominently
- Format API endpoint clearly (method + URL)
- List required vs optional parameters
- Show static parameters that are pre-configured
- Indicate authenticated parameters without exposing secrets
- Format expected output schema in readable form
- Use consistent formatting for easy LLM parsing

### LLM Prompt Engineering

The workflow tool selection prompt should:
- Clearly instruct LLM to analyze ALL available tools
- Provide examples of parameter extraction from natural language
- Emphasize generating complete, valid HTTPRequestSpec
- Include error handling instructions (what to do if ambiguous)
- Use structured output (HTTPRequestSpec model) for reliability

### Tool Name Extraction Logic

Since the LLM generates an HTTPRequestSpec (not a tool name), we need to infer which tool was selected:
1. Extract base URL from HTTPRequestSpec.url
2. Match against each tool's api.base_url + api.path
3. Consider query parameters for disambiguation
4. If multiple matches, use first match (or most specific)
5. If no match, return "unknown" or best guess

### Performance Considerations

- Tool retrieval: O(n) where n = number of tool_ids
- Context generation: O(m) where m = number of tools
- LLM calls: 1-2 calls (selection + optional formatting)
- Total latency: ~2-5 seconds typical (dominated by LLM calls)

### Security Considerations

- Never expose API keys or secrets in tool context
- Use placeholder text like "[authenticated]" for auth parameters
- Validate all user inputs (tool_ids, instructions)
- Sanitize tool context to prevent prompt injection
- Log requests without sensitive data

## Dependencies

### Existing Components (No Changes Required)
- `PromptService`: Already supports MCP and normal modes
- `HTTPClientService`: Already executes HTTPRequestSpec
- `ToolRegistry`: Minor enhancement for batch retrieval
- `HTTPRequestSpec/HTTPResponseSpec`: No changes needed

### New Dependencies
- None (uses existing OpenAI, FastAPI, Pydantic, loguru)

### Configuration
- Uses existing Settings from `config/settings.py`
- No new environment variables required
- Leverages existing LLM and HTTP timeout settings

## Future Enhancements

1. **Tool Caching**: Cache tool context strings to avoid regeneration
2. **Streaming Support**: Stream LLM responses for better UX
3. **Multi-Tool Execution**: Allow LLM to chain multiple tool calls
4. **Tool Versioning**: Support multiple versions of same tool
5. **Analytics**: Track tool selection accuracy and usage patterns
6. **Fallback Tools**: Define fallback if primary tool fails
7. **Parallel Execution**: Execute multiple independent API calls concurrently
