"""Workflow orchestrator for complete MCP workflow execution."""

from typing import Optional
from loguru import logger

from ..core.registry import ToolRegistry
from ..models.api_requests import WorkflowRequest, WorkflowResponse
from ..models.http_spec import HTTPRequestSpec
from ..models.tool_config import ToolConfig
from .prompt_service import PromptService
from .http_client import HTTPClientService


class WorkflowOrchestrator:
    """Orchestrates the complete MCP workflow from request to response.
    
    This service coordinates the multi-stage workflow:
    1. Retrieve tools from registry
    2. Generate tool context for LLM
    3. LLM selects tool and generates HTTP spec
    4. Execute API call
    5. Optionally format response
    6. Build comprehensive response
    
    Attributes:
        tool_registry: ToolRegistry for tool retrieval
        prompt_service: PromptService for LLM interactions
        http_client: HTTPClientService for API execution
    """
    
    def __init__(
        self,
        tool_registry: ToolRegistry,
        prompt_service: PromptService,
        http_client: HTTPClientService
    ):
        """Initialize the workflow orchestrator.
        
        Args:
            tool_registry: ToolRegistry instance for tool management
            prompt_service: PromptService instance for LLM interactions
            http_client: HTTPClientService instance for API execution
        """
        self.tool_registry = tool_registry
        self.prompt_service = prompt_service
        self.http_client = http_client
        logger.info("WorkflowOrchestrator initialized")
    
    async def execute_workflow(
        self,
        request: WorkflowRequest
    ) -> WorkflowResponse:
        """Execute the complete MCP workflow.
        
        This method orchestrates all stages of the workflow with comprehensive
        error handling at each stage.
        
        Args:
            request: WorkflowRequest containing user instructions and tool IDs
            
        Returns:
            WorkflowResponse with results or error information
        """
        logger.info(f"Starting workflow execution: {request.user_instructions[:50]}...")
        
        # Stage 1: Retrieve tools
        try:
            found_tools, missing_ids = self._retrieve_tools(request.tool_ids)
            
            if missing_ids:
                error_msg = f"Tools not found in registry: {missing_ids}"
                logger.error(error_msg)
                return WorkflowResponse(
                    status="error",
                    error=error_msg,
                    error_stage="tool_retrieval"
                )
            
            logger.info(f"Successfully retrieved {len(found_tools)} tools")
            
        except Exception as e:
            logger.error(f"Tool retrieval failed: {e}")
            return WorkflowResponse(
                status="error",
                error=f"Tool retrieval error: {str(e)}",
                error_stage="tool_retrieval"
            )
        
        # Stage 2: Generate tool context
        try:
            tools_context = self._format_tools_as_context(found_tools)
            logger.debug(f"Generated tool context: {len(tools_context)} characters")
            
        except Exception as e:
            logger.error(f"Tool context generation failed: {e}")
            return WorkflowResponse(
                status="error",
                error=f"Tool context generation error: {str(e)}",
                error_stage="tool_context_generation"
            )
        
        # Stage 3: LLM tool selection and HTTP spec generation
        try:
            from ..models.api_requests import MCPPromptRequest
            
            mcp_request = MCPPromptRequest(
                instructions=request.user_instructions,
                api_docs=tools_context
            )
            
            logger.info("Calling LLM for tool selection and HTTP spec generation")
            prompt_response = await self.prompt_service.prompt_mcp(mcp_request)
            
            if prompt_response.type != "http_spec":
                raise ValueError(f"Expected http_spec, got {prompt_response.type}")
            
            # Parse HTTP spec from response
            http_spec = HTTPRequestSpec(**prompt_response.content)
            logger.info(f"LLM generated HTTP spec: {http_spec.method} {http_spec.url}")
            
            # Determine which tool was selected
            selected_tool_name = self._extract_tool_name_from_spec(http_spec, found_tools)
            logger.info(f"Identified selected tool: {selected_tool_name}")
            
        except Exception as e:
            logger.error(f"LLM tool selection failed: {e}")
            return WorkflowResponse(
                status="error",
                error=f"LLM selection error: {str(e)}",
                error_stage="llm_selection"
            )
        
        # Stage 4: Execute API call
        try:
            logger.info(f"Executing API call: {http_spec.method} {http_spec.url}")
            response_spec = await self.http_client.execute(http_spec)
            logger.info(f"API call completed: {response_spec.status_code}")
            
        except Exception as e:
            logger.error(f"API execution failed: {e}")
            return WorkflowResponse(
                status="error",
                error=f"API execution error: {str(e)}",
                error_stage="api_execution"
            )
        
        # Stage 5: Optional response formatting
        formatted_response = None
        if request.format_response:
            try:
                from ..models.api_requests import PromptRequest
                
                # Prepare context for formatting
                raw_response_str = str(response_spec.body) if response_spec.body else "No response body"
                
                format_request = PromptRequest(
                    instructions=f"Format this API response in a human-readable way: {raw_response_str}",
                    context=f"Original user request: {request.user_instructions}",
                    response_format_prompt=request.response_format_instructions
                )
                
                logger.info("Calling LLM for response formatting")
                format_response = await self.prompt_service.prompt_normal(format_request)
                formatted_response = format_response.content
                logger.info("Response formatting completed")
                
            except Exception as e:
                # Don't fail the whole workflow if formatting fails
                logger.warning(f"Response formatting failed (non-fatal): {e}")
                formatted_response = None
        
        # Stage 6: Build and return successful response
        logger.info("Workflow completed successfully")
        return WorkflowResponse(
            status="success",
            selected_tool=selected_tool_name,
            http_spec=http_spec.model_dump(),
            raw_response=response_spec.model_dump(),
            formatted_response=formatted_response
        )
    
    def _retrieve_tools(
        self,
        tool_ids: list[str]
    ) -> tuple[list, list[str]]:
        """Retrieve tools from registry.
        
        Args:
            tool_ids: List of tool identifiers to retrieve
            
        Returns:
            Tuple of (found_tools, missing_ids)
        """
        logger.debug(f"Retrieving {len(tool_ids)} tools from registry")
        
        found_tools, missing_ids = self.tool_registry.get_multiple(tool_ids)
        
        if missing_ids:
            logger.warning(f"Missing tools: {missing_ids}")
        else:
            logger.info(f"Successfully retrieved all {len(found_tools)} tools")
        
        return found_tools, missing_ids
    
    def _format_tools_as_context(
        self,
        tools: list
    ) -> str:
        """Convert tool configs to structured API documentation string.
        
        This method formats tool information into a structured text format
        that the LLM can understand and use for tool selection.
        
        Args:
            tools: List of tool objects (BaseTool or ToolConfig)
            
        Returns:
            Formatted string containing tool documentation for LLM
        """
        if not tools:
            return "No tools available."
        
        logger.debug(f"Formatting {len(tools)} tools as context")
        
        context_parts = ["Available Tools:\n"]
        
        for tool in tools:
            # Get tool definition from registry
            try:
                tool_def = self.tool_registry.get_definition(tool.name)
                
                context_parts.append(f"\nTool: {tool_def.name}")
                context_parts.append(f"Description: {tool_def.description}")
                
                # Format input schema
                if tool_def.input_schema and "properties" in tool_def.input_schema:
                    context_parts.append("Required Parameters:")
                    for param_name, param_info in tool_def.input_schema.get("properties", {}).items():
                        param_type = param_info.get("type", "any")
                        param_desc = param_info.get("description", "No description")
                        required = param_name in tool_def.input_schema.get("required", [])
                        req_marker = " (required)" if required else " (optional)"
                        context_parts.append(f"  - {param_name} ({param_type}){req_marker}: {param_desc}")
                
                # Format output schema
                if tool_def.output_schema and "properties" in tool_def.output_schema:
                    context_parts.append("Expected Output:")
                    for output_name, output_info in tool_def.output_schema.get("properties", {}).items():
                        output_type = output_info.get("type", "any")
                        context_parts.append(f"  - {output_name} ({output_type})")
                
            except Exception as e:
                logger.warning(f"Error formatting tool {tool.name}: {e}")
                context_parts.append(f"\nTool: {tool.name}")
                context_parts.append(f"Description: {tool.description}")
                context_parts.append("(Details unavailable)")
        
        formatted_context = "\n".join(context_parts)
        logger.debug(f"Generated context with {len(formatted_context)} characters")
        
        return formatted_context
    
    def _extract_tool_name_from_spec(
        self,
        http_spec: HTTPRequestSpec,
        tools: list
    ) -> str:
        """Determine which tool was selected by matching URL/endpoint.
        
        This method attempts to identify which tool was selected by the LLM
        by analyzing the generated HTTP request specification. It uses multiple
        strategies to find a match.
        
        Args:
            http_spec: Generated HTTP request specification
            tools: List of available tool objects
            
        Returns:
            Name of the matched tool, or "unknown" if no match found
        """
        if not tools:
            logger.warning("No tools provided for matching")
            return "unknown"
        
        logger.debug(f"Attempting to match HTTP spec to one of {len(tools)} tools")
        logger.debug(f"HTTP spec URL: {http_spec.url}")
        
        # Strategy 1: Check if tool name appears in the URL
        url_lower = http_spec.url.lower()
        for tool in tools:
            tool_name_parts = tool.name.lower().replace("_", " ").split()
            # Check if any significant part of the tool name is in the URL
            for part in tool_name_parts:
                if len(part) > 3 and part in url_lower:  # Only check meaningful parts
                    logger.info(f"Matched tool '{tool.name}' via URL keyword '{part}'")
                    return tool.name
        
        # Strategy 2: If only one tool available, assume it was selected
        if len(tools) == 1:
            logger.info(f"Only one tool available, selecting: {tools[0].name}")
            return tools[0].name
        
        # Strategy 3: Check tool descriptions for URL patterns
        # (This would require tools to have metadata about their endpoints)
        
        # Strategy 4: Default to first tool if no match found
        # This is a fallback - in production, we might want to return "unknown"
        # or ask the LLM to clarify
        logger.warning(f"Could not definitively match tool, defaulting to first: {tools[0].name}")
        return tools[0].name
