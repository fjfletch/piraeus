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

