"""FastAPI endpoint implementations for LLM HTTP Service."""

from fastapi import APIRouter, HTTPException, status, Depends
from loguru import logger

from ..models.api_requests import (
    PromptRequest,
    PromptResponse,
    MCPPromptRequest,
    ExecuteRequest,
    ExecuteResponse
)
from ..models.http_spec import HTTPRequestSpec
from ..services.prompt_service import PromptService
from ..services.http_client import HTTPClientService
from ..config.settings import Settings, get_settings

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

