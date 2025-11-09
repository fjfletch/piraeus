"""Configuration models for dynamic tool creation."""

from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field

from .enums import AuthMethod, HttpMethod


class AuthConfig(BaseModel):
    """Authentication configuration."""
    method: AuthMethod = AuthMethod.NONE
    key_name: str | None = Field(default=None, description="Name of auth parameter/header")
    secret_ref: str | None = Field(default=None, description="Reference to secret (e.g., ${ALPHA_VANTAGE_KEY})")


class ApiConfig(BaseModel):
    """API endpoint configuration."""
    base_url: str = Field(description="Base URL for the API endpoint")
    path: str = Field(default="", description="Path to append to base URL")
    method: HttpMethod = Field(default=HttpMethod.GET)
    headers: dict[str, str] | None = Field(default_factory=dict, description="Static headers")
    params: dict[str, str] | None = Field(default_factory=dict, description="Static query parameters")
    auth: AuthConfig = Field(default_factory=AuthConfig)
    timeout: float = Field(default=30.0, description="Request timeout in seconds")


class FieldMapping(BaseModel):
    """Maps input/output fields to API parameters/response."""
    input_to_params: dict[str, str] = Field(
        default_factory=dict,
        description="Map tool input fields to API parameters. e.g., {'symbol': 'symbol'}"
    )
    input_to_body: dict[str, str] = Field(
        default_factory=dict,
        description="Map tool input fields to request body fields"
    )
    response_to_output: dict[str, str] = Field(
        default_factory=dict,
        description="Map API response fields to tool output. e.g., {'price': '05. price'}"
    )
    response_path: str | None = Field(
        default=None,
        description="JSONPath to extract data from response (e.g., 'Global Quote')"
    )


class ToolConfig(BaseModel):
    """Complete configuration for a dynamic API tool."""
    
    # Basic metadata
    name: str = Field(description="Unique tool name")
    description: str = Field(description="Human-readable description")
    version: int = Field(default=1, description="Tool version")
    enabled: bool = Field(default=True, description="Whether tool is active")
    
    # API configuration
    api: ApiConfig = Field(description="API endpoint configuration")
    
    # Schemas (JSON Schema format)
    input_schema: dict = Field(description="JSON Schema for tool input")
    output_schema: dict = Field(description="JSON Schema for tool output")
    
    # Field mappings
    mapping: FieldMapping = Field(default_factory=FieldMapping)
    
    # Metadata
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


# Example tool config
EXAMPLE_STOCK_QUOTE_CONFIG = {
    "name": "get_stock_quote",
    "description": "Get real-time stock quote from Alpha Vantage API",
    "version": 1,
    "enabled": True,
    "api": {
        "base_url": "https://www.alphavantage.co/query",
        "method": "GET",
        "params": {
            "function": "GLOBAL_QUOTE"
        },
        "auth": {
            "method": "api_key_query",
            "key_name": "apikey",
            "secret_ref": "${ALPHA_VANTAGE_API_KEY}"
        },
        "timeout": 30.0
    },
    "input_schema": {
        "type": "object",
        "properties": {
            "symbol": {
                "type": "string",
                "description": "Stock ticker symbol (e.g., IBM, AAPL)"
            }
        },
        "required": ["symbol"]
    },
    "output_schema": {
        "type": "object",
        "properties": {
            "symbol": {"type": "string"},
            "price": {"type": "number"},
            "change": {"type": "number"},
            "change_percent": {"type": "string"},
            "volume": {"type": "integer"},
            "latest_trading_day": {"type": "string"}
        },
        "required": ["symbol", "price"]
    },
    "mapping": {
        "input_to_params": {
            "symbol": "symbol"
        },
        "response_path": "Global Quote",
        "response_to_output": {
            "symbol": "01. symbol",
            "price": "05. price",
            "change": "09. change",
            "change_percent": "10. change percent",
            "volume": "06. volume",
            "latest_trading_day": "07. latest trading day"
        }
    },
    "tags": ["finance", "stocks", "market-data"]
}

