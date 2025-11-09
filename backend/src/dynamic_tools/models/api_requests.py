"""API request and response models."""

from typing import Any, Optional, Literal, Union
from pydantic import BaseModel, Field
from .http_spec import HTTPRequestSpec, HTTPResponseSpec


class PromptRequest(BaseModel):
    """Model for normal prompt requests.
    
    This model represents a request for standard LLM prompting
    without API integration.
    
    Attributes:
        instructions: The main instruction or question for the LLM
        context: Optional contextual information for the LLM
        response_format_prompt: Optional instruction for response formatting
    """
    
    instructions: str = Field(
        ...,
        description="Main instruction or question for the LLM",
        min_length=1
    )
    context: Optional[str] = Field(
        default=None,
        description="Contextual information to help the LLM"
    )
    response_format_prompt: Optional[str] = Field(
        default=None,
        description="Instructions for how to format the response"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "instructions": "Explain what REST APIs are",
                    "context": "The user is a beginner developer",
                    "response_format_prompt": "Keep it simple and concise"
                }
            ]
        }
    }


class PromptResponse(BaseModel):
    """Model for prompt responses.
    
    This model represents the response from an LLM prompt,
    which can be either text or an HTTP specification.
    
    Attributes:
        content: The response content (text string or dict for http_spec)
        type: The type of response ('text' or 'http_spec')
    """
    
    content: Any = Field(
        ...,
        description="Response content (text or HTTP specification)"
    )
    type: Literal["text", "http_spec"] = Field(
        ...,
        description="Type of response content"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "content": "REST APIs are interfaces that allow...",
                    "type": "text"
                },
                {
                    "content": {
                        "method": "GET",
                        "url": "https://api.example.com/data",
                        "headers": {}
                    },
                    "type": "http_spec"
                }
            ]
        }
    }


class MCPPromptRequest(BaseModel):
    """Model for MCP (Model Context Protocol) prompt requests.
    
    This model represents a request for LLM prompting with API context,
    intended to generate HTTP request specifications.
    
    Attributes:
        instructions: The main instruction for what API call to make
        api_docs: API documentation or context for the LLM
        response_format_prompt: Optional instruction for response formatting
    """
    
    instructions: str = Field(
        ...,
        description="Instruction for what API call to generate",
        min_length=1
    )
    api_docs: str = Field(
        ...,
        description="API documentation or context",
        min_length=1
    )
    response_format_prompt: Optional[str] = Field(
        default=None,
        description="Instructions for response formatting"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "instructions": "Get the current weather for New York City",
                    "api_docs": "OpenWeatherMap API: GET https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}",
                    "response_format_prompt": "Return as HTTP request specification"
                }
            ]
        }
    }


class ExecuteRequest(BaseModel):
    """Model for HTTP request execution.
    
    This model represents a request to execute an HTTP call
    based on an HTTPRequestSpec.
    
    Attributes:
        http_spec: The HTTP request specification to execute
    """
    
    http_spec: HTTPRequestSpec = Field(
        ...,
        description="HTTP request specification to execute"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "http_spec": {
                        "method": "GET",
                        "url": "https://api.example.com/data",
                        "headers": {"Authorization": "Bearer token"}
                    }
                }
            ]
        }
    }


class ExecuteResponse(BaseModel):
    """Model for HTTP request execution response.
    
    This model represents the result of executing an HTTP request,
    which can be either successful (with data) or failed (with error).
    
    Attributes:
        status: Execution status ('success' or 'error')
        data: Optional HTTP response data (present on success)
        error: Optional error message (present on error)
    """
    
    status: Literal["success", "error"] = Field(
        ...,
        description="Execution status"
    )
    data: Optional[HTTPResponseSpec] = Field(
        default=None,
        description="HTTP response data (present on success)"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message (present on error)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "success",
                    "data": {
                        "status_code": 200,
                        "body": {"result": "data"},
                        "execution_time_ms": 245.6
                    }
                },
                {
                    "status": "error",
                    "error": "Connection timeout after 30 seconds"
                }
            ]
        }
    }


class WorkflowRequest(BaseModel):
    """Model for complete MCP workflow execution requests.
    
    This model represents a request to execute the full MCP workflow,
    including tool selection, API execution, and optional response formatting.
    
    Attributes:
        user_instructions: Natural language instructions for what to accomplish
        tool_ids: List of tool identifiers to make available for selection
        format_response: Whether to format the raw API response using LLM
        response_format_instructions: Custom instructions for response formatting
    """
    
    user_instructions: str = Field(
        ...,
        description="Natural language instructions for what to accomplish",
        min_length=1
    )
    tool_ids: list[str] = Field(
        ...,
        description="List of tool identifiers to make available for selection",
        min_length=1
    )
    format_response: bool = Field(
        default=False,
        description="Whether to format the raw API response using LLM"
    )
    response_format_instructions: Optional[str] = Field(
        default=None,
        description="Custom instructions for response formatting"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "user_instructions": "Get the current stock price for Apple",
                    "tool_ids": ["get_stock_quote", "get_company_info"],
                    "format_response": True,
                    "response_format_instructions": "Provide a brief summary with the price"
                },
                {
                    "user_instructions": "Fetch weather data for San Francisco",
                    "tool_ids": ["get_weather"],
                    "format_response": False
                }
            ]
        }
    }


class WorkflowResponse(BaseModel):
    """Model for workflow execution results.
    
    This model represents the complete result of executing an MCP workflow,
    including tool selection, API execution, and optional formatting.
    
    Attributes:
        status: Overall workflow execution status
        selected_tool: Name of the tool selected by LLM (present on success)
        http_spec: Generated HTTP request specification (present on success)
        raw_response: Raw API response data (present on success)
        formatted_response: LLM-formatted response (present when format_response=true)
        error: Error message (present on error)
        error_stage: Stage where error occurred (present on error)
    """
    
    status: Literal["success", "error"] = Field(
        ...,
        description="Overall workflow execution status"
    )
    selected_tool: Optional[str] = Field(
        default=None,
        description="Name of the tool selected by LLM (present on success)"
    )
    http_spec: Optional[dict] = Field(
        default=None,
        description="Generated HTTP request specification (present on success)"
    )
    raw_response: Optional[dict] = Field(
        default=None,
        description="Raw API response data (present on success)"
    )
    formatted_response: Optional[str] = Field(
        default=None,
        description="LLM-formatted response (present when format_response=true)"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message (present on error)"
    )
    error_stage: Optional[Literal[
        "tool_retrieval",
        "tool_context_generation",
        "llm_selection",
        "api_execution",
        "response_formatting"
    ]] = Field(
        default=None,
        description="Stage where error occurred (present on error)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "success",
                    "selected_tool": "get_stock_quote",
                    "http_spec": {
                        "method": "GET",
                        "url": "https://www.alphavantage.co/query",
                        "query_params": {
                            "function": "GLOBAL_QUOTE",
                            "symbol": "AAPL"
                        }
                    },
                    "raw_response": {
                        "status_code": 200,
                        "body": {"Global Quote": {"01. symbol": "AAPL", "05. price": "150.25"}},
                        "execution_time_ms": 234.5
                    },
                    "formatted_response": "The current stock price for Apple (AAPL) is $150.25."
                },
                {
                    "status": "error",
                    "error": "Tools not found in registry: ['invalid_tool']",
                    "error_stage": "tool_retrieval"
                }
            ]
        }
    }

