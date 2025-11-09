"""Decorators for defining tools."""

from __future__ import annotations

import inspect
import functools
from typing import Any, Callable, TypeVar, Union, get_type_hints
from pydantic import BaseModel, create_model
from pydantic.json_schema import GenerateJsonSchema, model_json_schema

from .core.base import ToolDefinition

F = TypeVar("F", bound=Callable[..., Any])


def tool(
    name: str | None = None,
    description: str | None = None,
    tags: list[str] | None = None,
) -> Callable[[F], F]:
    """Decorator to convert a function into a tool.

    The decorated function must have type annotations for all parameters.
    If parameters are not Pydantic models, they will be converted to one.

    Args:
        name: Tool name (defaults to function name)
        description: Tool description (defaults to function docstring)
        tags: Optional tags for categorization

    Example:
        @tool(description="Search for weather information")
        async def get_weather(city: str) -> str:
            '''Get current weather for a city.'''
            return f"Weather in {city}"
    """

    def decorator(func: F) -> F:
        # Get function metadata
        func_name = name or func.__name__
        func_description = description or (func.__doc__ or "").strip().split("\n")[0]

        if not func_description:
            raise ValueError(
                f"Tool '{func_name}' requires a description via docstring or description parameter"
            )

        # Get type hints
        try:
            hints = get_type_hints(func)
        except Exception as e:
            raise ValueError(f"Failed to extract type hints from {func_name}: {e}")

        # Separate return type from parameters
        return_type = hints.pop("return", None)
        param_hints = hints

        if not param_hints:
            raise ValueError(f"Tool '{func_name}' must have at least one parameter")

        if not return_type:
            raise ValueError(f"Tool '{func_name}' must have a return type annotation")

        # Build input schema
        input_schema = _build_input_schema(func_name, param_hints)

        # Build output schema
        output_schema = _build_output_schema(return_type)

        # Create ToolDefinition
        tool_def = ToolDefinition(
            name=func_name,
            description=func_description,
            input_schema=input_schema,
            output_schema=output_schema,
            tags=tags or [],
        )

        # Attach metadata to function
        func._tool_definition = tool_def  # type: ignore
        func._is_tool = True  # type: ignore
        func._is_async = inspect.iscoroutinefunction(func)  # type: ignore

        # Wrap the function to add validation if needed
        if inspect.iscoroutinefunction(func):

            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                return await func(*args, **kwargs)

            async_wrapper._tool_definition = tool_def  # type: ignore
            async_wrapper._is_tool = True  # type: ignore
            async_wrapper._is_async = True  # type: ignore
            async_wrapper._original_func = func  # type: ignore
            return async_wrapper  # type: ignore
        else:

            @functools.wraps(func)
            def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                return func(*args, **kwargs)

            sync_wrapper._tool_definition = tool_def  # type: ignore
            sync_wrapper._is_tool = True  # type: ignore
            sync_wrapper._is_async = False  # type: ignore
            sync_wrapper._original_func = func  # type: ignore
            return sync_wrapper  # type: ignore

    return decorator


def _build_input_schema(tool_name: str, param_hints: dict[str, Any]) -> dict:
    """Build JSON schema for tool inputs from parameter type hints."""

    # If there's exactly one parameter and it's a Pydantic model, use it directly
    if len(param_hints) == 1:
        param_name, param_type = next(iter(param_hints.items()))
        if isinstance(param_type, type) and issubclass(param_type, BaseModel):
            schema = model_json_schema(param_type, mode="validation")
            # Ensure required fields are set
            if "properties" in schema:
                schema["required"] = list(schema.get("properties", {}).keys())
            return schema

    # Otherwise, create a Pydantic model from the parameters
    field_definitions = {}
    for param_name, param_type in param_hints.items():
        # Convert basic types to Pydantic Fields
        if param_type in (str, int, float, bool):
            field_definitions[param_name] = (param_type, ...)
        elif hasattr(param_type, "__origin__"):  # Generic type like list, dict
            field_definitions[param_name] = (param_type, ...)
        elif isinstance(param_type, type) and issubclass(param_type, BaseModel):
            field_definitions[param_name] = (param_type, ...)
        else:
            field_definitions[param_name] = (param_type, ...)

    # Create dynamic Pydantic model
    input_model = create_model(
        f"{tool_name}_Input",
        **field_definitions,  # type: ignore
    )

    schema = model_json_schema(input_model, mode="validation")
    return schema


def _build_output_schema(return_type: Any) -> dict:
    """Build JSON schema for tool output from return type annotation."""

    # If it's a Pydantic model, use its schema
    if isinstance(return_type, type) and issubclass(return_type, BaseModel):
        return model_json_schema(return_type, mode="serialization")

    # For simple types, create a simple schema
    if return_type is str:
        return {"type": "string"}
    elif return_type is int:
        return {"type": "integer"}
    elif return_type is float:
        return {"type": "number"}
    elif return_type is bool:
        return {"type": "boolean"}
    elif return_type is list or getattr(return_type, "__origin__", None) is list:
        return {"type": "array", "items": {}}
    elif return_type is dict or getattr(return_type, "__origin__", None) is dict:
        return {"type": "object", "additionalProperties": True}

    # Fallback: create a wrapper model
    output_model = create_model("Output", result=(return_type, ...))
    return model_json_schema(output_model, mode="serialization")
