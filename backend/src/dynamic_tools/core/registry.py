"""Tool registry for managing and storing tools."""

from __future__ import annotations

from typing import Any, Callable
from loguru import logger

from .base import BaseTool, ToolDefinition, ToolRegistrationError


class ToolRegistry:
    """Registry for managing available tools.

    This class manages tool registration, retrieval, and OpenAI schema generation.
    """

    def __init__(self) -> None:
        """Initialize the tool registry."""
        self._tools: dict[str, BaseTool] = {}
        self._definitions: dict[str, ToolDefinition] = {}

    def register(self, tool: BaseTool | Callable) -> None:
        """Register a tool.

        Args:
            tool: A tool implementing BaseTool protocol or a decorated function

        Raises:
            ToolRegistrationError: If tool is invalid or name already registered
        """
        # Handle decorated functions
        if hasattr(tool, "_tool_definition"):
            tool_def = tool._tool_definition
            tool_name = tool_def.name

            if tool_name in self._tools:
                raise ToolRegistrationError(f"Tool '{tool_name}' already registered")

            self._tools[tool_name] = tool  # type: ignore
            self._definitions[tool_name] = tool_def
            logger.info(f"Registered tool: {tool_name}")
            return

        # Handle BaseTool protocol objects
        if isinstance(tool, BaseTool):
            tool_name = tool.name

            if tool_name in self._tools:
                raise ToolRegistrationError(f"Tool '{tool_name}' already registered")

            self._tools[tool_name] = tool
            self._definitions[tool_name] = ToolDefinition(
                name=tool.name,
                description=tool.description,
                input_schema=tool.input_schema,
                output_schema=tool.output_schema,
            )
            logger.info(f"Registered tool: {tool_name}")
            return

        raise ToolRegistrationError(
            f"Tool must be either a @tool decorated function or implement BaseTool protocol"
        )

    def unregister(self, tool_name: str) -> None:
        """Unregister a tool.

        Args:
            tool_name: Name of the tool to unregister

        Raises:
            ToolRegistrationError: If tool not found
        """
        if tool_name not in self._tools:
            raise ToolRegistrationError(f"Tool '{tool_name}' not registered")

        del self._tools[tool_name]
        del self._definitions[tool_name]
        logger.info(f"Unregistered tool: {tool_name}")

    def get(self, tool_name: str) -> BaseTool | Callable:
        """Get a tool by name.

        Args:
            tool_name: Name of the tool

        Returns:
            The tool

        Raises:
            ToolRegistrationError: If tool not found
        """
        if tool_name not in self._tools:
            raise ToolRegistrationError(f"Tool '{tool_name}' not found")

        return self._tools[tool_name]

    def get_multiple(self, tool_names: list[str]) -> tuple[list[BaseTool | Callable], list[str]]:
        """Get multiple tools by name.

        Args:
            tool_names: List of tool names to retrieve

        Returns:
            Tuple of (found_tools, missing_names) where:
            - found_tools: List of tools that were found
            - missing_names: List of tool names that were not found
        """
        found_tools: list[BaseTool | Callable] = []
        missing_names: list[str] = []

        for tool_name in tool_names:
            if tool_name in self._tools:
                found_tools.append(self._tools[tool_name])
                logger.debug(f"Found tool: {tool_name}")
            else:
                missing_names.append(tool_name)
                logger.warning(f"Tool not found: {tool_name}")

        logger.info(f"Retrieved {len(found_tools)} tools, {len(missing_names)} missing")
        return found_tools, missing_names

    def get_definition(self, tool_name: str) -> ToolDefinition:
        """Get a tool's definition by name.

        Args:
            tool_name: Name of the tool

        Returns:
            The tool definition

        Raises:
            ToolRegistrationError: If tool not found
        """
        if tool_name not in self._definitions:
            raise ToolRegistrationError(f"Tool '{tool_name}' not found")

        return self._definitions[tool_name]

    def list_tools(self) -> list[str]:
        """List all registered tool names.

        Returns:
            List of tool names
        """
        return list(self._tools.keys())

    def list_definitions(self) -> list[ToolDefinition]:
        """List all tool definitions.

        Returns:
            List of ToolDefinition objects
        """
        return list(self._definitions.values())

    def get_openai_tools(self) -> list[dict]:
        """Get all tools formatted for OpenAI function calling.

        Returns:
            List of tool definitions in OpenAI format
        """
        return [definition.to_openai_tool() for definition in self._definitions.values()]

    def has_tool(self, tool_name: str) -> bool:
        """Check if a tool is registered.

        Args:
            tool_name: Name of the tool

        Returns:
            True if registered, False otherwise
        """
        return tool_name in self._tools

    def clear(self) -> None:
        """Clear all registered tools."""
        self._tools.clear()
        self._definitions.clear()
        logger.info("Cleared all tools from registry")

    def __len__(self) -> int:
        """Return number of registered tools."""
        return len(self._tools)

    def __contains__(self, tool_name: str) -> bool:
        """Check if tool is registered (supports 'in' operator)."""
        return self.has_tool(tool_name)

    def __repr__(self) -> str:
        """String representation of registry."""
        return f"ToolRegistry({len(self._tools)} tools: {', '.join(self.list_tools())})"
