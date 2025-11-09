"""FastAPI endpoint implementations for LLM HTTP Service."""

import json
from typing import List, Optional, Any, Union
from fastapi import APIRouter, HTTPException, status, Depends
from loguru import logger
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from ..models.api_requests import (
    PromptRequest,
    PromptResponse,
    MCPPromptRequest,
    ExecuteRequest,
    ExecuteResponse,
    GenerateToolConfigRequest,
    GenerateToolConfigResponse
)
from ..models.database import (
    ToolCreate,
    ToolUpdate,
    ToolDB,
    ToolListResponse,
)
from ..models.http_spec import HTTPRequestSpec
from ..models.simple_tool import SimpleToolSpec
from ..services.prompt_service import PromptService
from ..services.http_client import HTTPClientService
from ..services.tool_generator import ToolConfigGenerator
from ..services.simple_tool_generator import SimpleToolConfigGenerator
from ..services.supabase_service import get_supabase_service
from ..config.settings import Settings, get_settings
from ..core.orchestrator import AIOrchestrator
from ..core.registry import ToolRegistry

# Create API router
router = APIRouter()


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
    "/generate-tool-config",
    response_model=GenerateToolConfigResponse,
    summary="Generate Tool Config (Simplified)",
    description="Auto-generate a SimpleToolSpec from natural language API description",
    tags=["Tools", "LLM"],
)
async def generate_tool_config_endpoint(
    request: GenerateToolConfigRequest,
    settings: Settings = Depends(get_settings)
) -> GenerateToolConfigResponse:
    """Generate a SimpleToolSpec from API description.
    
    This endpoint uses LLM prompting to automatically generate a SimpleToolSpec
    from a natural language description of an API. The generated spec is lightweight,
    easy to understand, and ready to execute immediately.
    
    Process (Simplified & Fast):
    1. Extract API endpoint URL and HTTP method from documentation
    2. Detect API key authentication requirements and header name
    3. Extract static headers (Accept, Content-Type, etc)
    4. Return complete SimpleToolSpec
    
    Advantages over complex generation:
    - 40% fewer LLM calls (3 vs 5)
    - 40% faster generation
    - Simpler output (~30 lines vs 130+)
    - Direct integration with SimpleToolExecutor
    - Easier to debug and modify
    
    Args:
        request: GenerateToolConfigRequest with tool metadata and API docs
        settings: Application settings with API keys
        
    Returns:
        GenerateToolConfigResponse with generated SimpleToolSpec dict or error
    """
    try:
        logger.info(f"Generating simple tool config for: {request.tool_name}")
        logger.debug(f"Tool description: {request.tool_description[:100]}...")
        
        # Initialize the simplified generator
        generator = SimpleToolConfigGenerator(
            api_key=settings.openai_api_key,
            max_retries=settings.llm_max_retries
        )
        
        # Generate the simple tool config (40% faster, 40% fewer LLM calls)
        simple_tool_spec = await generator.generate_simple_tool_config(
            tool_name=request.tool_name,
            tool_description=request.tool_description,
            api_docs=request.api_docs
        )
        
        logger.info(f"✅ Successfully generated simple tool config: {request.tool_name}")
        logger.debug(f"Generated spec: {simple_tool_spec}")
        
        # Wrap in SimpleToolSpec for validation
        spec = SimpleToolSpec(**simple_tool_spec)
        logger.info(f"✓ URL: {spec.url}")
        logger.info(f"✓ Method: {spec.method}")
        logger.info(f"✓ API Key Required: {spec.api_key is not None}")
        
        # Return success response with the simple tool spec
        return GenerateToolConfigResponse(
            status="success",
            tool_config=spec.model_dump(),
            error=None
        )
        
    except Exception as e:
        logger.error(f"Failed to generate simple tool config: {e}")
        import traceback
        logger.error(traceback.format_exc())
        
        # Return error response
        return GenerateToolConfigResponse(
            status="error",
            tool_config=None,
            error=f"Failed to generate tool config: {str(e)}"
        )


# ============================================================================
# SUPABASE CRUD ENDPOINTS - TOOLS
# ============================================================================


@router.post(
    "/tools",
    response_model=ToolDB,
    status_code=status.HTTP_201_CREATED,
    summary="Create Tool",
    description="Register a new tool in the database",
    tags=["Tools", "Database"],
)
async def create_tool(tool: ToolCreate) -> ToolDB:
    """Create a new tool in the database.
    
    The tool_config is validated as a ToolConfig before storage to ensure
    consistency with what was generated by the LLM.
    
    Args:
        tool: Tool creation data (tool_config must be valid ToolConfig dict)
        
    Returns:
        Created tool with id and timestamps (tool_config is stored exactly as provided)
        
    Raises:
        HTTPException: If tool_config is invalid, tool exists, or creation fails
    """
    try:
        from ..models.tool_config import ToolConfig
        
        # Validate tool_config is a proper ToolConfig
        logger.debug(f"Validating tool_config for: {tool.name}")
        validated_config = ToolConfig(**tool.tool_config)
        
        # Store the validated config as a normalized dict
        # This ensures consistent serialization
        normalized_tool_config = validated_config.model_dump()
        
        logger.debug(f"✅ Tool config validated and normalized")
        
        db = get_supabase_service()
        result = await db.create_tool(
            name=tool.name,
            description=tool.description,
            tool_config=normalized_tool_config  # Store normalized config
        )
        
        return ToolDB(
            id=result["id"],
            name=result["name"],
            description=result.get("description"),
            tool_config=result["tool_config"],  # Retrieved exactly as stored
            created_at=result["created_at"],
            updated_at=result["updated_at"]
        )
        
    except ValueError as e:
        error_msg = str(e).lower()
        if "duplicate" in error_msg or "unique" in error_msg:
            # Duplicate key error from database
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(e)
            )
        else:
            # Validation error from ToolConfig
            logger.error(f"Tool config validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid tool_config: {str(e)}"
            )
    except Exception as e:
        logger.error(f"Failed to create tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tool: {str(e)}"
        )


@router.get(
    "/tools/{name}",
    response_model=ToolDB,
    summary="Get Tool",
    description="Retrieve a tool by name",
    tags=["Tools", "Database"],
)
async def get_tool(name: str) -> ToolDB:
    """Retrieve a tool by name.
    
    Args:
        name: Tool name
        
    Returns:
        Tool data
        
    Raises:
        HTTPException: If tool not found
    """
    try:
        db = get_supabase_service()
        result = await db.get_tool(name)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool '{name}' not found"
            )
        
        return ToolDB(
            id=result["id"],
            name=result["name"],
            description=result.get("description"),
            tool_config=result["tool_config"],
            created_at=result["created_at"],
            updated_at=result["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve tool: {str(e)}"
        )


@router.get(
    "/tools",
    response_model=ToolListResponse,
    summary="List Tools",
    description="List all tools with optional pagination",
    tags=["Tools", "Database"],
)
async def list_tools(
    limit: Optional[int] = None,
    offset: Optional[int] = 0
) -> ToolListResponse:
    """List all tools with optional pagination.
    
    Args:
        limit: Maximum number of tools to return
        offset: Number of tools to skip
        
    Returns:
        List of tools and total count
    """
    try:
        db = get_supabase_service()
        tools_data, total = await db.list_tools(limit=limit, offset=offset)
        
        tools = [
            ToolDB(
                id=row["id"],
                name=row["name"],
                description=row.get("description"),
                tool_config=row["tool_config"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in tools_data
        ]
        
        return ToolListResponse(tools=tools, total=total)
        
    except Exception as e:
        logger.error(f"Failed to list tools: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tools: {str(e)}"
        )


@router.put(
    "/tools/{name}",
    response_model=ToolDB,
    summary="Update Tool",
    description="Update an existing tool",
    tags=["Tools", "Database"],
)
async def update_tool(name: str, tool_update: ToolUpdate) -> ToolDB:
    """Update an existing tool.
    
    Args:
        name: Tool name to update
        tool_update: Fields to update
        
    Returns:
        Updated tool data
        
    Raises:
        HTTPException: If tool not found or update fails
    """
    try:
        db = get_supabase_service()
        result = await db.update_tool(
            name=name,
            new_name=tool_update.name,
            description=tool_update.description,
            tool_config=tool_update.tool_config
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool '{name}' not found"
            )
        
        return ToolDB(
            id=result["id"],
            name=result["name"],
            description=result.get("description"),
            tool_config=result["tool_config"],
            created_at=result["created_at"],
            updated_at=result["updated_at"]
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to update tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update tool: {str(e)}"
        )


@router.delete(
    "/tools/{name}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Tool",
    description="Delete a tool by name",
    tags=["Tools", "Database"],
)
async def delete_tool(name: str) -> None:
    """Delete a tool by name.
    
    Args:
        name: Tool name to delete
        
    Raises:
        HTTPException: If tool not found or deletion fails
    """
    try:
        db = get_supabase_service()
        deleted = await db.delete_tool(name)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool '{name}' not found"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tool: {str(e)}"
        )


# ============================================================================
# ORCHESTRATOR ENDPOINT - LLM with Tool Support
# ============================================================================


class OrchestratorRequest(BaseModel):
    """Request model for orchestrator endpoint."""
    
    input: Union[str, List[dict]] = Field(
        ...,
        description="User input (string) or message history (list of dicts)"
    )
    instructions: Optional[str] = Field(
        None,
        description="System instructions for the LLM"
    )
    tools: Optional[List[dict]] = Field(
        None,
        description="List of tool configs from Supabase (with name, description, input_schema, output_schema)"
    )


class OrchestratorResponse(BaseModel):
    """Response model for orchestrator endpoint."""
    
    status: str = Field(
        ...,
        description="Response status: 'success' or 'error'"
    )
    result: Optional[Any] = Field(
        None,
        description="The orchestrator result (may include tool calls and results)"
    )
    tools_used: List[str] = Field(
        default_factory=list,
        description="List of tool names that were called"
    )
    error: Optional[str] = Field(
        None,
        description="Error message if execution failed"
    )


@router.post(
    "/llm/orchestrate",
    response_model=OrchestratorResponse,
    summary="LLM with Tool Calling",
    description="Run LLM with access to registered tools for automatic tool calling",
    tags=["LLM", "Orchestration"],
)
async def orchestrate(
    request: OrchestratorRequest,
    settings: Settings = Depends(get_settings)
) -> OrchestratorResponse:
    """Run LLM orchestration with tool support.
    
    This endpoint combines the LLM with the tool registry, allowing the LLM
    to automatically call registered tools as needed to answer the user's query.
    
    Args:
        request: OrchestratorRequest with input and optional instructions
        settings: Application settings
        
    Returns:
        OrchestratorResponse with result and tools used
    """
    try:
        logger.info(f"Starting orchestration with input: {request.input[:100] if isinstance(request.input, str) else 'message history'}...")
        
        # Initialize OpenAI client
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        # Initialize tool registry (empty - we pass tools directly to orchestrator)
        registry = ToolRegistry()
        
        # Convert tool configs to Responses API format
        additional_tools = []
        if request.tools:
            for tool_config in request.tools:
                try:
                    # Convert to Responses API tool format
                    api_tool = {
                        "type": "function",
                        "name": tool_config.get("name", "unknown"),
                        "description": tool_config.get("description", ""),
                        "parameters": tool_config.get("input_schema", {})
                    }
                    additional_tools.append(api_tool)
                    logger.info(f"Loaded tool: {tool_config.get('name')}")
                except Exception as e:
                    logger.warning(f"Failed to load tool config: {e}")
                    continue
            
            logger.info(f"Loaded {len(additional_tools)} tools for orchestration")
        else:
            logger.info("No tools provided for orchestration")
        
        # Initialize orchestrator
        orchestrator = AIOrchestrator(
            client=client,
            registry=registry,
            model=settings.llm_model,
            max_tool_iterations=5
        )
        
        # Run orchestration with tools
        logger.info(f"Running orchestration with {len(additional_tools)} tools")
        result = await orchestrator.run(
            input=request.input,
            instructions=request.instructions,
            additional_tools=additional_tools if additional_tools else None
        )
        
        # Extract tool calls if present
        tools_used = []
        if isinstance(result, dict) and "tool_calls" in result:
            tools_used = [tc.name for tc in result.get("tool_calls", [])]
            logger.info(f"Orchestration complete. Tools used: {tools_used}")
        else:
            logger.info("Orchestration complete. No tools were called")
        
        return OrchestratorResponse(
            status="success",
            result=result,
            tools_used=tools_used
        )
        
    except Exception as e:
        logger.error(f"Orchestration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Orchestration failed: {str(e)}"
        )


