"""Base abstractions and models for the tool system."""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable
from pydantic import BaseModel, Field
from enum import Enum
import json


class ToolConfig(BaseModel):
    """Configuration for tool execution."""

    max_retries: int = Field(default=3, ge=0, description="Maximum retry attempts")
    retry_delay: float = Field(default=1.0, ge=0, description="Initial retry delay in seconds")
    backoff_factor: float = Field(default=1.5, gt=0, description="Exponential backoff multiplier")
    timeout: float | None = Field(default=None, ge=0, description="Execution timeout in seconds")


class ToolDefinition(BaseModel):
    """Definition of a tool for OpenAI function calling."""

    name: str = Field(description="Unique tool name")
    description: str = Field(description="Human-readable description of what the tool does")
    input_schema: dict = Field(description="JSON schema for input parameters")
    output_schema: dict = Field(description="JSON schema for output")
    tags: list[str] = Field(default_factory=list, description="Optional tags for categorization")

    def to_openai_tool(self) -> dict:
        """Convert to OpenAI function tool format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.input_schema,
                "strict": True,
            },
        }


class ToolResult(BaseModel):
    """Result of tool execution."""

    tool_name: str = Field(description="Name of the tool that was executed")
    success: bool = Field(description="Whether execution succeeded")
    data: Any = Field(default=None, description="Result data on success")
    error: str | None = Field(default=None, description="Error message on failure")
    execution_time_ms: float = Field(default=0.0, description="Execution time in milliseconds")

    class Config:
        arbitrary_types_allowed = True


class ToolInput(BaseModel):
    """Wrapper for tool input."""

    tool_name: str
    arguments: dict


class ToolCallRequest(BaseModel):
    """Request to execute a tool call from OpenAI."""

    id: str = Field(description="Tool call ID from OpenAI")
    tool_name: str = Field(description="Name of the tool to invoke")
    arguments: dict = Field(description="Arguments to pass to the tool")


@runtime_checkable
class BaseTool(Protocol):
    """Protocol for tool implementations."""

    @property
    def name(self) -> str:
        """Unique name of the tool."""
        ...

    @property
    def description(self) -> str:
        """Human-readable description."""
        ...

    @property
    def input_schema(self) -> dict:
        """JSON schema for inputs."""
        ...

    @property
    def output_schema(self) -> dict:
        """JSON schema for outputs."""
        ...

    async def execute(self, **kwargs: Any) -> Any:
        """Execute the tool with given arguments.

        Args:
            **kwargs: Arguments matching the input schema

        Returns:
            Tool output matching the output schema

        Raises:
            ValueError: If arguments don't match schema
            RuntimeError: If execution fails
        """
        ...


class ToolError(Exception):
    """Base exception for tool-related errors."""

    pass


class ToolValidationError(ToolError):
    """Raised when tool input/output validation fails."""

    pass


class ToolExecutionError(ToolError):
    """Raised when tool execution fails."""

    pass


class ToolRegistrationError(ToolError):
    """Raised when tool registration fails."""

    pass
