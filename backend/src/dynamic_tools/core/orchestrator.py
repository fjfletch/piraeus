"""AI orchestrator for OpenAI integration."""

from __future__ import annotations

from typing import Any
from openai import AsyncOpenAI
from pydantic import BaseModel
from loguru import logger

from .base import ToolCallRequest, ToolResult
from .registry import ToolRegistry
from .executor import ToolExecutor


class AIOrchestrator:
    """Orchestrates AI interactions with dynamic tool support.

    This class integrates OpenAI's Responses API with the tool system,
    handling tool calling loops and structured outputs.
    """

    def __init__(
        self,
        client: AsyncOpenAI,
        registry: ToolRegistry,
        model: str = "gpt-4o-mini",
        max_tool_iterations: int = 5,
    ) -> None:
        """Initialize the AI orchestrator.

        Args:
            client: AsyncOpenAI client instance
            registry: ToolRegistry with registered tools
            model: Model name to use
            max_tool_iterations: Maximum number of tool calling iterations
        """
        if not client:
            raise ValueError("OpenAI client must be provided")

        self.client = client
        self.registry = registry
        self.executor = ToolExecutor(registry)
        self.model = model
        self.max_tool_iterations = max_tool_iterations

        logger.info(f"AIOrchestrator initialized with model: {model}")

    async def run(
        self,
        input: str | list[dict],
        instructions: str | None = None,
        text_format: type[BaseModel] | None = None,
        additional_tools: list[dict] | None = None,
        **kwargs: Any,
    ) -> Any:
        """Run AI completion with tool support.

        Args:
            input: User input (string or message list)
            instructions: System instructions
            text_format: Pydantic model for structured output (optional)
            additional_tools: Additional OpenAI tools (e.g., web_search_preview)
            **kwargs: Additional parameters for responses.create()

        Returns:
            Parsed output if text_format provided, otherwise raw response
        """
        # Initial API call
        logger.info(f"Making initial API call with {len(self.registry)} tools")

        if text_format:
            # Use parse() for structured output when text_format is provided
            # responses.parse() also uses Responses API format
            tools = self._build_responses_tools_list(additional_tools)
            response = await self.client.responses.parse(
                model=self.model,
                input=input,
                instructions=instructions,
                tools=tools if tools else None,
                text_format=text_format,
                **kwargs,
            )
            
            # Return parsed output
            if hasattr(response, "output_parsed"):
                return response.output_parsed
        else:
            # Use create() for unstructured output with Responses API format
            tools = self._build_responses_tools_list(additional_tools)
            logger.debug(f"Tools being sent to Responses API: {tools}")
            response = await self.client.responses.create(
                model=self.model,
                input=input,
                instructions=instructions,
                tools=tools if tools else None,
                **kwargs,
            )
            
            # Check if the LLM wants to call tools
            if hasattr(response, 'output') and response.output:
                tool_calls = [item for item in response.output if hasattr(item, 'type') and item.type == 'function_call']
                
                if tool_calls:
                    logger.info(f"LLM requested {len(tool_calls)} tool call(s)")
                    tool_results = []
                    
                    for tool_call in tool_calls:
                        import json
                        arguments = json.loads(tool_call.arguments) if isinstance(tool_call.arguments, str) else tool_call.arguments
                        
                        logger.info(f"Executing tool: {tool_call.name} with args: {arguments}")
                        result = await self.executor.execute(tool_call.name, arguments)
                        tool_results.append({
                            'tool_name': tool_call.name,
                            'call_id': tool_call.call_id,
                            'result': result
                        })
                    
                    # Return structured results
                    return {
                        'response': response,
                        'tool_calls': tool_calls,
                        'tool_results': tool_results
                    }

        return response

    async def run_with_tool_loop(
        self,
        input: str | list[dict],
        instructions: str | None = None,
        text_format: type[BaseModel] | None = None,
        **kwargs: Any,
    ) -> Any:
        """Run AI completion with automatic tool calling loop.

        This method handles multi-turn tool calling where the AI can
        call multiple tools in sequence to accomplish a task.

        Args:
            input: User input (string or message list)
            instructions: System instructions
            text_format: Pydantic model for structured output
            **kwargs: Additional parameters for responses.parse()

        Returns:
            Final parsed output
        """
        iteration = 0
        current_input = input

        while iteration < self.max_tool_iterations:
            logger.debug(f"Tool calling iteration {iteration + 1}/{self.max_tool_iterations}")

            # Get registered tools in Responses API format
            tools = self._build_responses_tools_list()

            # Make API call
            response = await self.client.responses.parse(
                model=self.model,
                input=current_input,
                instructions=instructions,
                tools=tools if tools else None,
                text_format=text_format,
                **kwargs,
            )

            # Check if we're done (no tool calls needed)
            if text_format and hasattr(response, "output_parsed"):
                logger.info("Received final structured output")
                return response.output_parsed

            # For Responses API, tool calling is handled automatically
            # Return the response
            return response

        logger.warning(f"Reached max tool iterations ({self.max_tool_iterations})")
        return response

    async def stream(
        self,
        input: str | list[dict],
        instructions: str | None = None,
        text_format: type[BaseModel] | None = None,
        additional_tools: list[dict] | None = None,
        **kwargs: Any,
    ):
        """Stream AI completion with tool support.

        Args:
            input: User input (string or message list)
            instructions: System instructions
            text_format: Pydantic model for structured output
            additional_tools: Additional OpenAI tools
            **kwargs: Additional parameters for responses.stream()

        Yields:
            Stream events
        """
        # Use Responses API format for tools
        tools = self._build_responses_tools_list(additional_tools)

        logger.info(f"Starting streaming response with {len(tools)} tools")

        async with self.client.responses.stream(
            model=self.model,
            input=input,
            instructions=instructions,
            tools=tools if tools else None,
            text_format=text_format,
            **kwargs,
        ) as stream:
            async for event in stream:
                yield event

            # Get final response if needed
            if text_format:
                final_response = await stream.get_final_response()
                if hasattr(final_response, "output_parsed"):
                    yield final_response.output_parsed

    def _build_responses_tools_list(self, additional_tools: list[dict] | None = None) -> list[dict]:
        """Build tools list formatted for OpenAI Responses API.

        The Responses API expects a different tool format than Chat Completions.
        It needs the 'name' field at the top level of each tool.

        Args:
            additional_tools: Additional tools to include

        Returns:
            List of tool definitions in Responses API format
        """
        tools_list = []
        definitions = self.registry.list_definitions()

        # Convert tool definitions to Responses API format
        for tool_def in definitions:
            tools_list.append({
                "type": "function",
                "name": tool_def.name,
                "description": tool_def.description,
                "parameters": tool_def.input_schema,
            })

        if additional_tools:
            tools_list.extend(additional_tools)

        return tools_list

    async def execute_tool_manually(
        self,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> ToolResult:
        """Manually execute a registered tool.

        Useful for testing or explicit tool invocation outside of AI flow.

        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments

        Returns:
            ToolResult with execution outcome
        """
        logger.info(f"Manually executing tool: {tool_name}")
        return await self.executor.execute(tool_name, arguments)

    def get_available_tools(self) -> list[str]:
        """Get list of available tool names.

        Returns:
            List of tool names
        """
        return self.registry.list_tools()

    def __repr__(self) -> str:
        """String representation."""
        return f"AIOrchestrator(model={self.model}, tools={len(self.registry)})"
