"""FastAPI endpoint implementations for LLM HTTP Service."""

from fastapi import APIRouter, HTTPException, status, Depends
from loguru import logger

from ..models.api_requests import (
    PromptRequest,
    PromptResponse,
    MCPPromptRequest,
    ExecuteRequest,
    ExecuteResponse,
    WorkflowRequest,
    WorkflowResponse
)
from ..models.tool_config import ToolConfig
from ..models.http_spec import HTTPRequestSpec
from ..services.prompt_service import PromptService
from ..services.http_client import HTTPClientService
from ..services.workflow_orchestrator import WorkflowOrchestrator
from ..core.registry import ToolRegistry
from ..config.settings import Settings, get_settings

# Create API router
router = APIRouter()

# Global tool registry (shared across requests)
_global_registry = ToolRegistry()


@router.post(
    "/prompt",
    response_model=PromptResponse,
    summary="Normal Prompt",
    description="Send a prompt to the LLM and get a text response",
    tags=["LLM"],
)
async def prompt_endpoint(
    request: PromptRequest,
    settings: Settings = Depends(get_settings)
) -> PromptResponse:
    """Process a normal prompt and return text response.
    
    Args:
        request: PromptRequest with instructions and optional context
        
    Returns:
        PromptResponse with text content
        
    Raises:
        HTTPException: If LLM service fails
    """
    try:
        logger.info(f"Processing prompt: {request.instructions[:50]}...")
        
        # Initialize service with settings
        prompt_service = PromptService(
            api_key=settings.openai_api_key,
            max_retries=settings.llm_max_retries
        )
        
        # Process prompt
        response = await prompt_service.prompt_normal(request)
        
        logger.info("Prompt processed successfully")
        return response
        
    except Exception as e:
        logger.error(f"Prompt endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process prompt: {str(e)}"
        )


@router.post(
    "/prompt-mcp",
    response_model=PromptResponse,
    summary="MCP Prompt",
    description="Send a prompt with API documentation to generate an HTTPRequestSpec",
    tags=["LLM", "MCP"],
)
async def prompt_mcp_endpoint(
    request: MCPPromptRequest,
    settings: Settings = Depends(get_settings)
) -> PromptResponse:
    """Process an MCP prompt and return HTTP request specification.
    
    Args:
        request: MCPPromptRequest with instructions and API documentation
        
    Returns:
        PromptResponse with HTTPRequestSpec content
        
    Raises:
        HTTPException: If LLM service fails
    """
    try:
        logger.info(f"Processing MCP prompt: {request.instructions[:50]}...")
        
        # Initialize service with settings
        prompt_service = PromptService(
            api_key=settings.openai_api_key,
            max_retries=settings.llm_max_retries
        )
        
        # Process MCP prompt
        response = await prompt_service.prompt_mcp(request)
        
        logger.info("MCP prompt processed successfully")
        return response
        
    except Exception as e:
        logger.error(f"MCP prompt endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process MCP prompt: {str(e)}"
        )


@router.post(
    "/execute",
    response_model=ExecuteResponse,
    summary="Execute HTTP Request",
    description="Execute an HTTP request from an HTTPRequestSpec",
    tags=["HTTP"],
)
async def execute_endpoint(
    request: ExecuteRequest,
    settings: Settings = Depends(get_settings)
) -> ExecuteResponse:
    """Execute an HTTP request specification.
    
    Args:
        request: ExecuteRequest with HTTPRequestSpec
        
    Returns:
        ExecuteResponse with execution results or error
    """
    try:
        logger.info(f"Executing HTTP request: {request.http_spec.method} {request.http_spec.url}")
        
        # Initialize HTTP client with settings
        http_client = HTTPClientService(
            timeout=settings.http_timeout,
            max_retries=settings.http_max_retries
        )
        
        # Execute request
        response_spec = await http_client.execute(request.http_spec)
        
        logger.info(f"HTTP request executed successfully: {response_spec.status_code}")
        
        # Return success response with full HTTPResponseSpec
        return ExecuteResponse(
            status="success",
            data=response_spec
        )
        
    except Exception as e:
        logger.error(f"Execute endpoint error: {e}")
        
        # Return error response (still 200 OK, but with status="error")
        return ExecuteResponse(
            status="error",
            error=str(e)
        )


@router.post(
    "/prompt-execute",
    response_model=ExecuteResponse,
    summary="Prompt + Execute",
    description="Full flow: Generate HTTP spec from prompt, then execute it",
    tags=["LLM", "HTTP", "MCP"],
)
async def prompt_execute_endpoint(
    request: MCPPromptRequest,
    settings: Settings = Depends(get_settings)
) -> ExecuteResponse:
    """Full flow: Generate HTTP spec from LLM, then execute it.
    
    This endpoint combines the MCP prompt generation and HTTP execution
    into a single convenient endpoint.
    
    Args:
        request: MCPPromptRequest with instructions and API documentation
        
    Returns:
        ExecuteResponse with execution results or error
    """
    try:
        logger.info(f"Starting prompt-execute flow: {request.instructions[:50]}...")
        
        # Step 1: Generate HTTP spec using LLM
        logger.info("Step 1: Generating HTTP spec...")
        prompt_service = PromptService(
            api_key=settings.openai_api_key,
            max_retries=settings.llm_max_retries
        )
        prompt_response = await prompt_service.prompt_mcp(request)
        
        if prompt_response.type != "http_spec":
            raise ValueError(f"Expected http_spec, got {prompt_response.type}")
        
        # Parse HTTP spec from response
        http_spec = HTTPRequestSpec(**prompt_response.content)
        logger.info(f"Generated HTTP spec: {http_spec.method} {http_spec.url}")
        
        # Step 2: Execute the HTTP request
        logger.info("Step 2: Executing HTTP request...")
        http_client = HTTPClientService(
            timeout=settings.http_timeout,
            max_retries=settings.http_max_retries
        )
        response_spec = await http_client.execute(http_spec)
        
        logger.info(f"Prompt-execute flow completed: {response_spec.status_code}")
        
        # Return success response with full HTTPResponseSpec
        return ExecuteResponse(
            status="success",
            data=response_spec
        )
        
    except Exception as e:
        logger.error(f"Prompt-execute endpoint error: {e}")
        
        # Return error response
        return ExecuteResponse(
            status="error",
            error=str(e)
        )



@router.post(
    "/workflow",
    response_model=WorkflowResponse,
    summary="Complete MCP Workflow",
    description="Execute full workflow: tool selection, API execution, optional formatting",
    tags=["Workflow", "MCP"],
)
async def workflow_endpoint(
    request: WorkflowRequest,
    settings: Settings = Depends(get_settings)
) -> WorkflowResponse:
    """Execute complete MCP workflow.
    
    This endpoint orchestrates the full MCP workflow:
    1. Retrieve specified tools from registry
    2. Generate tool context for LLM
    3. LLM selects appropriate tool and generates HTTP spec
    4. Execute the API call
    5. Optionally format the response for human consumption
    6. Return comprehensive results
    
    Args:
        request: WorkflowRequest with user instructions, tool IDs, and options
        settings: Application settings (injected)
        
    Returns:
        WorkflowResponse with execution results or error information
        
    Examples:
        Request:
        ```json
        {
            "user_instructions": "Get the stock price for Apple",
            "tool_ids": ["get_stock_quote"],
            "format_response": true,
            "response_format_instructions": "Keep it brief"
        }
        ```
        
        Success Response:
        ```json
        {
            "status": "success",
            "selected_tool": "get_stock_quote",
            "http_spec": {"method": "GET", "url": "..."},
            "raw_response": {"status_code": 200, "body": {...}},
            "formatted_response": "The stock price for Apple is $150.25"
        }
        ```
        
        Error Response:
        ```json
        {
            "status": "error",
            "error": "Tools not found: ['invalid_tool']",
            "error_stage": "tool_retrieval"
        }
        ```
    """
    try:
        logger.info(f"Workflow endpoint called: {request.user_instructions[:50]}...")
        
        # Initialize services (use global registry)
        tool_registry = _global_registry
        
        prompt_service = PromptService(
            api_key=settings.openai_api_key,
            max_retries=settings.llm_max_retries
        )
        
        http_client = HTTPClientService(
            timeout=settings.http_timeout,
            max_retries=settings.http_max_retries
        )
        
        # Create orchestrator
        orchestrator = WorkflowOrchestrator(
            tool_registry=tool_registry,
            prompt_service=prompt_service,
            http_client=http_client
        )
        
        # Execute workflow
        response = await orchestrator.execute_workflow(request)
        
        logger.info(f"Workflow completed with status: {response.status}")
        return response
        
    except Exception as e:
        logger.error(f"Workflow endpoint error: {e}")
        
        # Return error response (still 200 OK, but with status="error")
        return WorkflowResponse(
            status="error",
            error=f"Unexpected workflow error: {str(e)}",
            error_stage="llm_selection"  # Default stage for unexpected errors
        )


@router.post(
    "/tools/register",
    summary="Register a Tool",
    description="Register a new tool configuration in the global registry",
    tags=["Tools"],
)
async def register_tool(tool_config: ToolConfig) -> dict:
    """Register a tool in the global registry.
    
    Args:
        tool_config: Tool configuration
        
    Returns:
        Success message
    """
    try:
        from ..factory.tool_factory import ToolFactory
        
        # Create tool from config
        tool = ToolFactory.create_from_config(tool_config)
        
        # Register in global registry
        _global_registry.register(tool)
        
        logger.info(f"Registered tool: {tool_config.name}")
        return {
            "status": "success",
            "message": f"Tool '{tool_config.name}' registered successfully",
            "tool_id": tool_config.name
        }
        
    except Exception as e:
        logger.error(f"Tool registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to register tool: {str(e)}"
        )


@router.get(
    "/tools",
    summary="List Tools",
    description="List all registered tools",
    tags=["Tools"],
)
async def list_tools() -> dict:
    """List all registered tools.
    
    Returns:
        List of tool names and count
    """
    tool_names = _global_registry.list_tools()
    return {
        "status": "success",
        "count": len(tool_names),
        "tools": tool_names
    }
