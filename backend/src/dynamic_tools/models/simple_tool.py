"""Simplified tool specification model for lightweight API execution.

This module provides a minimal tool schema designed to work with HTTPClientService.
It captures just the essentials: URL, HTTP method, headers, and API key.
"""

from typing import Literal, Optional, Dict
from pydantic import BaseModel, Field


class SimpleToolSpec(BaseModel):
    """Minimal tool specification for direct HTTP API execution.
    
    This model represents a simple API tool with just the essential fields needed
    to construct and execute an HTTP request via HTTPClientService.
    
    Attributes:
        url: The full API endpoint URL
        method: HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
        headers: Optional static HTTP headers to include in all requests
        api_key: Optional API key to inject into headers for authentication
        api_key_header: The header name where api_key should be injected (default: "Authorization")
        type: Tool type identifier (default: "api")
    """
    
    url: str = Field(
        ...,
        description="Full API endpoint URL",
        min_length=1,
        examples=["https://api.example.com/users", "https://api.openweather.org/data/2.5/weather"]
    )
    
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] = Field(
        default="GET",
        description="HTTP method for the request"
    )
    
    headers: Optional[Dict[str, str]] = Field(
        default=None,
        description="Static HTTP headers (e.g., Accept, User-Agent)",
        examples=[{"Accept": "application/json", "User-Agent": "MyApp/1.0"}]
    )
    
    api_key: Optional[str] = Field(
        default=None,
        description="Optional API key for authentication",
        examples=["sk-1234567890", "Bearer token123"]
    )
    
    api_key_header: str = Field(
        default="Authorization",
        description="Header name where api_key should be injected",
        examples=["Authorization", "X-API-Key", "X-Auth-Token"]
    )
    
    type: Literal["api", "http"] = Field(
        default="api",
        description="Tool type identifier"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "url": "https://api.example.com/users",
                    "method": "GET",
                    "headers": {"Accept": "application/json"},
                    "api_key": "sk-12345",
                    "api_key_header": "Authorization",
                    "type": "api"
                },
                {
                    "url": "https://api.openweather.org/data/2.5/weather",
                    "method": "GET",
                    "headers": None,
                    "api_key": "my-openweather-api-key",
                    "api_key_header": "appid",
                    "type": "api"
                }
            ]
        }
    }

