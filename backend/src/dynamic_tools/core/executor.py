"""Tool executor for running registered tools."""

from __future__ import annotations

import asyncio
import inspect
import time
from typing import Any, Callable
from pydantic import BaseModel, ValidationError
from loguru import logger

from .base import (
    BaseTool,
    ToolResult,
    ToolExecutionError,
    ToolValidationError,
)
from .registry import ToolRegistry


class ToolExecutor:
    """Executes tools with validation and error handling.

    This class handles the execution of registered tools, including:
    - Input validation using Pydantic schemas
    - Output validation
    - Error handling and logging
    - Execution time tracking
    """

    def __init__(self, registry: ToolRegistry) -> None:
        """Initialize the tool executor.

        Args:
            registry: ToolRegistry containing registered tools
        """
        self.registry = registry

    async def execute(
        self,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> ToolResult:
        """Execute a tool with given arguments.

        Args:
            tool_name: Name of the tool to execute
            arguments: Arguments to pass to the tool

        Returns:
            ToolResult containing execution outcome

        Raises:
            ToolExecutionError: If tool execution fails critically
        """
        start_time = time.perf_counter()

        try:
            # Get tool from registry
            tool = self.registry.get(tool_name)
            tool_def = self.registry.get_definition(tool_name)

            logger.debug(f"Executing tool: {tool_name} with args: {arguments}")

            # Validate inputs
            try:
                validated_args = self._validate_inputs(tool_name, tool_def.input_schema, arguments)
            except ValidationError as e:
                execution_time = (time.perf_counter() - start_time) * 1000
                logger.error(f"Input validation failed for {tool_name}: {e}")
                return ToolResult(
                    tool_name=tool_name,
                    success=False,
                    error=f"Input validation error: {str(e)}",
                    execution_time_ms=execution_time,
                )

            # Execute tool
            try:
                result = await self._execute_tool(tool, validated_args)
            except Exception as e:
                execution_time = (time.perf_counter() - start_time) * 1000
                logger.error(f"Tool execution failed for {tool_name}: {e}")
                return ToolResult(
                    tool_name=tool_name,
                    success=False,
                    error=f"Execution error: {str(e)}",
                    execution_time_ms=execution_time,
                )

            # Validate outputs (best effort - don't fail on output validation)
            try:
                validated_result = self._validate_outputs(tool_name, tool_def.output_schema, result)
            except ValidationError as e:
                logger.warning(f"Output validation warning for {tool_name}: {e}")
                # Still return the result, just log the warning
                validated_result = result

            execution_time = (time.perf_counter() - start_time) * 1000
            logger.info(f"Tool {tool_name} executed successfully in {execution_time:.2f}ms")

            return ToolResult(
                tool_name=tool_name,
                success=True,
                data=validated_result,
                execution_time_ms=execution_time,
            )

        except Exception as e:
            execution_time = (time.perf_counter() - start_time) * 1000
            logger.error(f"Unexpected error executing {tool_name}: {e}")
            return ToolResult(
                tool_name=tool_name,
                success=False,
                error=f"Unexpected error: {str(e)}",
                execution_time_ms=execution_time,
            )

    def _validate_inputs(
        self,
        tool_name: str,
        input_schema: dict,
        arguments: dict[str, Any],
    ) -> dict[str, Any]:
        """Validate tool inputs against schema.

        Args:
            tool_name: Name of the tool
            input_schema: JSON schema for inputs
            arguments: Raw arguments to validate

        Returns:
            Validated arguments

        Raises:
            ValidationError: If validation fails
        """
        # If schema has properties, validate against them
        if "properties" in input_schema:
            # Create a temporary Pydantic model for validation
            from pydantic import create_model, Field

            fields = {}
            properties = input_schema.get("properties", {})
            required = input_schema.get("required", [])

            for field_name, field_schema in properties.items():
                field_type = self._json_type_to_python(field_schema)
                is_required = field_name in required

                if is_required:
                    fields[field_name] = (field_type, ...)
                else:
                    fields[field_name] = (field_type, None)

            ValidationModel = create_model(f"{tool_name}_InputValidation", **fields)  # type: ignore
            validated = ValidationModel(**arguments)
            return validated.model_dump()

        return arguments

    def _validate_outputs(
        self,
        tool_name: str,
        output_schema: dict,
        result: Any,
    ) -> Any:
        """Validate tool outputs against schema.

        Args:
            tool_name: Name of the tool
            output_schema: JSON schema for outputs
            result: Raw result to validate

        Returns:
            Validated result

        Raises:
            ValidationError: If validation fails
        """
        # If result is already a Pydantic model, return as-is
        if isinstance(result, BaseModel):
            return result

        # Basic type validation
        schema_type = output_schema.get("type")
        if schema_type:
            if schema_type == "string" and not isinstance(result, str):
                raise ValidationError(f"Expected string, got {type(result)}")
            elif schema_type == "integer" and not isinstance(result, int):
                raise ValidationError(f"Expected integer, got {type(result)}")
            elif schema_type == "number" and not isinstance(result, (int, float)):
                raise ValidationError(f"Expected number, got {type(result)}")
            elif schema_type == "boolean" and not isinstance(result, bool):
                raise ValidationError(f"Expected boolean, got {type(result)}")
            elif schema_type == "array" and not isinstance(result, list):
                raise ValidationError(f"Expected array, got {type(result)}")
            elif schema_type == "object" and not isinstance(result, dict):
                raise ValidationError(f"Expected object, got {type(result)}")

        return result

    def _json_type_to_python(self, field_schema: dict) -> type:
        """Convert JSON schema type to Python type.

        Args:
            field_schema: JSON schema for a field

        Returns:
            Python type
        """
        json_type = field_schema.get("type", "string")

        type_mapping = {
            "string": str,
            "integer": int,
            "number": float,
            "boolean": bool,
            "array": list,
            "object": dict,
        }

        return type_mapping.get(json_type, str)

    async def _execute_tool(
        self,
        tool: BaseTool | Callable,
        arguments: dict[str, Any],
    ) -> Any:
        """Execute the actual tool function.

        Args:
            tool: Tool to execute
            arguments: Validated arguments

        Returns:
            Tool execution result

        Raises:
            Exception: Any exception from tool execution
        """
        # Check if tool expects a single Pydantic model parameter
        # This is the case when using @tool decorator with a single Pydantic input
        import inspect as insp
        
        # Skip signature inspection for objects with execute method (like GenericApiTool)
        if hasattr(tool, "execute") and callable(tool.execute) and not hasattr(tool, "_is_async"):
            return await tool.execute(**arguments)
        
        sig = insp.signature(tool._original_func if hasattr(tool, "_original_func") else tool)
        params = list(sig.parameters.values())
        
        # If there's exactly one parameter and it's named 'input', pass as single arg
        if len(params) == 1 and params[0].name == "input":
            from pydantic import BaseModel
            param_type = params[0].annotation
            
            # Create instance of the Pydantic model
            if isinstance(param_type, type) and issubclass(param_type, BaseModel):
                input_instance = param_type(**arguments)
                arguments = {"input": input_instance}
        
        # Handle decorated functions
        if hasattr(tool, "_is_async"):
            if tool._is_async:
                return await tool(**arguments)
            else:
                # Run sync function in executor to not block
                loop = asyncio.get_event_loop()
                return await loop.run_in_executor(None, lambda: tool(**arguments))

        # Handle BaseTool protocol objects or objects with execute method
        if hasattr(tool, "execute") and callable(tool.execute):
            return await tool.execute(**arguments)

        # Fallback: try to call it
        if inspect.iscoroutinefunction(tool):
            return await tool(**arguments)
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(None, lambda: tool(**arguments))
