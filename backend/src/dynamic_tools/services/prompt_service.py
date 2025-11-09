"""Multi-stage prompt orchestration service."""

from typing import Optional
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger

from ..core.orchestrator import AIOrchestrator
from ..core.registry import ToolRegistry
from ..models.http_spec import HTTPRequestSpec
from ..models.api_requests import PromptRequest, PromptResponse, MCPPromptRequest
from .prompt_templates import PromptTemplates


class PromptService:
    """Service for multi-stage LLM prompting with retry logic.
    
    This service wraps the AIOrchestrator from dynamic_tools and provides
    methods for normal text prompting and MCP (Model Context Protocol) mode
    for generating HTTP request specifications.
    
    Attributes:
        client: AsyncOpenAI client for API calls
        registry: ToolRegistry for managing tools
        orchestrator: AIOrchestrator for LLM interactions
        max_retries: Maximum number of retry attempts on failure
    """
    
    def __init__(self, api_key: str, max_retries: int = 3):
        """Initialize the PromptService.
        
        Args:
            api_key: OpenAI API key
            max_retries: Maximum number of retry attempts (default: 3)
        """
        self.client = AsyncOpenAI(api_key=api_key)
        self.registry = ToolRegistry()
        self.orchestrator = AIOrchestrator(
            client=self.client,
            registry=self.registry
        )
        self.max_retries = max_retries
        logger.info("PromptService initialized")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def _call_llm_with_retry(
        self,
        messages: list[dict],
        text_format: Optional[type] = None
    ):
        """Call LLM API with retry logic.
        
        Args:
            messages: List of message dicts for chat completion
            text_format: Optional Pydantic model for structured output
            
        Returns:
            The response from the LLM
            
        Raises:
            Exception: If all retry attempts fail
        """
        try:
            if text_format:
                # Use responses API for structured output
                response = await self.client.responses.parse(
                    model="gpt-4o-mini",
                    input=messages,
                    text_format=text_format
                )
                return response.output_parsed
            else:
                # Use chat completions for normal text
                response = await self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages
                )
                return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            raise
    
    async def prompt_normal(self, request: PromptRequest) -> PromptResponse:
        """Execute normal mode prompt for text response.
        
        This method processes a standard prompt request using multi-stage
        prompting (instructions, optional context, optional format instructions).
        
        Args:
            request: PromptRequest with instructions and optional context
            
        Returns:
            PromptResponse with text content
            
        Raises:
            Exception: If LLM API call fails after all retries
        """
        logger.info(f"Processing normal prompt: {request.instructions[:50]}...")
        
        # Build prompt using templates
        system_prompt, user_prompt = PromptTemplates.normal_mode_prompt(
            instructions=request.instructions,
            context=request.context,
            response_format_prompt=request.response_format_prompt
        )
        
        # Build messages for chat completion
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            # Call LLM with retry logic (no text_format for normal mode)
            result = await self._call_llm_with_retry(messages)
            
            logger.info("Normal prompt completed successfully")
            return PromptResponse(
                content=result,
                type="text"
            )
        except Exception as e:
            logger.error(f"Normal prompt failed: {e}")
            raise
    
    async def prompt_mcp(self, request: MCPPromptRequest) -> PromptResponse:
        """Execute MCP mode prompt for HTTP request specification.
        
        This method processes an MCP prompt request to generate structured
        HTTP request specifications using OpenAI's structured output feature.
        
        Args:
            request: MCPPromptRequest with instructions and API documentation
            
        Returns:
            PromptResponse with http_spec content (as dict)
            
        Raises:
            Exception: If LLM API call fails after all retries
        """
        logger.info(f"Processing MCP prompt: {request.instructions[:50]}...")
        
        # Build prompt using templates
        system_prompt, user_prompt = PromptTemplates.mcp_mode_prompt(
            instructions=request.instructions,
            api_docs=request.api_docs,
            response_format_prompt=request.response_format_prompt
        )
        
        # Build messages for structured output
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            # Call LLM with structured output (text_format)
            result = await self._call_llm_with_retry(
                messages,
                text_format=HTTPRequestSpec
            )
            
            # Serialize HTTPRequestSpec to dict
            if isinstance(result, HTTPRequestSpec):
                content = result.model_dump()
            else:
                content = result
            
            logger.info("MCP prompt completed successfully")
            return PromptResponse(
                content=content,
                type="http_spec"
            )
        except Exception as e:
            logger.error(f"MCP prompt failed: {e}")
            raise

