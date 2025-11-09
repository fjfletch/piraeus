"""HTTP request and response specification models."""

from typing import Any, Dict, Optional, Literal, Union
from pydantic import BaseModel, Field, field_validator, model_serializer
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema


class HTTPRequestSpec(BaseModel):
    """Model for HTTP request specifications.
    
    This model represents an HTTP request with all necessary components
    for execution by an HTTP client.
    
    Attributes:
        method: HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
        url: Target URL for the request
        headers: Optional HTTP headers as key-value pairs
        query_params: Optional query parameters as key-value pairs
        body: Optional request body (can be dict, list, or any JSON-serializable data)
    """
    
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] = Field(
        ...,
        description="HTTP method for the request"
    )
    url: str = Field(
        ...,
        description="Target URL for the HTTP request",
        min_length=1
    )
    headers: Optional[Dict[str, str]] = Field(
        default=None,
        description="HTTP headers as key-value pairs"
    )
    query_params: Optional[Dict[str, str]] = Field(
        default=None,
        description="URL query parameters as key-value pairs"
    )
    body: Optional[Union[Dict[str, Any], str]] = Field(
        default=None,
        description="Request body (JSON object or string)",
        json_schema_extra={
            "anyOf": [
                {"type": "object", "additionalProperties": False},
                {"type": "string"}
            ]
        }
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "method": "GET",
                    "url": "https://api.example.com/users",
                    "headers": {"Authorization": "Bearer token123"},
                    "query_params": {"page": "1", "limit": "10"}
                },
                {
                    "method": "POST",
                    "url": "https://api.example.com/users",
                    "headers": {"Content-Type": "application/json"},
                    "body": {"name": "John Doe", "email": "john@example.com"}
                }
            ]
        }
    }


class HTTPResponseSpec(BaseModel):
    """Model for HTTP response specifications.
    
    This model represents an HTTP response received from an API,
    including status, headers, body, and execution metrics.
    
    Attributes:
        status_code: HTTP status code (100-599)
        headers: Optional response headers as key-value pairs
        body: Optional response body (can be any JSON-serializable data)
        execution_time_ms: Optional execution time in milliseconds
    """
    
    status_code: int = Field(
        ...,
        description="HTTP status code",
        ge=100,
        le=599
    )
    headers: Optional[Dict[str, str]] = Field(
        default=None,
        description="HTTP response headers as key-value pairs"
    )
    body: Optional[Union[Dict[str, Any], str]] = Field(
        default=None,
        description="Response body (JSON object or string)",
        json_schema_extra={
            "anyOf": [
                {"type": "object", "additionalProperties": False},
                {"type": "string"}
            ]
        }
    )
    execution_time_ms: Optional[float] = Field(
        default=None,
        description="Request execution time in milliseconds",
        ge=0
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status_code": 200,
                    "headers": {"Content-Type": "application/json"},
                    "body": {"result": "success", "data": []},
                    "execution_time_ms": 245.6
                },
                {
                    "status_code": 404,
                    "body": {"error": "Not found"},
                    "execution_time_ms": 123.4
                }
            ]
        }
    }

