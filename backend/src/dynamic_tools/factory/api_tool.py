"""Generic API tool that executes based on configuration."""

from __future__ import annotations

import os
import httpx
from typing import Any
from loguru import logger

from ..models.tool_config import ToolConfig
from ..models.enums import AuthMethod, HttpMethod
from ..core.base import BaseTool, ToolDefinition


class GenericApiTool:
    """A generic tool that can execute any REST API based on configuration."""
    
    def __init__(self, config: ToolConfig):
        """Initialize with tool configuration.
        
        Args:
            config: ToolConfig defining the API behavior
        """
        self.config = config
        self._validate_config()
    
    def _validate_config(self):
        """Validate the tool configuration."""
        if not self.config.name:
            raise ValueError("Tool name is required")
        if not self.config.api.base_url:
            raise ValueError("API base_url is required")
    
    @property
    def name(self) -> str:
        """Tool name."""
        return self.config.name
    
    @property
    def description(self) -> str:
        """Tool description."""
        return self.config.description
    
    @property
    def input_schema(self) -> dict:
        """Input JSON schema."""
        return self.config.input_schema
    
    @property
    def output_schema(self) -> dict:
        """Output JSON schema."""
        return self.config.output_schema
    
    async def execute(self, **kwargs: Any) -> dict:
        """Execute the API tool with given arguments.
        
        Args:
            **kwargs: Tool input arguments matching input_schema
            
        Returns:
            Dict matching output_schema
        """
        logger.debug(f"Executing {self.name} with args: {kwargs}")
        
        # Build the request
        url = self._build_url()
        headers = self._build_headers(kwargs)
        params = self._build_params(kwargs)
        body = self._build_body(kwargs)
        
        # Make the HTTP request
        async with httpx.AsyncClient(timeout=self.config.api.timeout) as client:
            response = await self._make_request(client, url, headers, params, body)
            
        # Transform response to output format
        output = self._transform_response(response)
        
        logger.debug(f"{self.name} returned: {output}")
        return output
    
    def _build_url(self) -> str:
        """Build the complete URL."""
        base = self.config.api.base_url.rstrip('/')
        path = self.config.api.path.lstrip('/')
        
        if path:
            return f"{base}/{path}"
        return base
    
    def _build_headers(self, input_args: dict) -> dict:
        """Build request headers including auth."""
        headers = self.config.api.headers.copy()
        
        # Add authentication header if needed
        if self.config.api.auth.method == AuthMethod.API_KEY_HEADER:
            key_name = self.config.api.auth.key_name or "X-API-Key"
            api_key = self._resolve_secret(self.config.api.auth.secret_ref)
            headers[key_name] = api_key
            
        elif self.config.api.auth.method == AuthMethod.BEARER:
            api_key = self._resolve_secret(self.config.api.auth.secret_ref)
            headers["Authorization"] = f"Bearer {api_key}"
        
        return headers
    
    def _build_params(self, input_args: dict) -> dict:
        """Build query parameters including auth and input mapping."""
        params = self.config.api.params.copy()
        
        # Add authentication query param if needed
        if self.config.api.auth.method == AuthMethod.API_KEY_QUERY:
            key_name = self.config.api.auth.key_name or "apikey"
            api_key = self._resolve_secret(self.config.api.auth.secret_ref)
            params[key_name] = api_key
        
        # Map input fields to query parameters
        for input_field, param_name in self.config.mapping.input_to_params.items():
            if input_field in input_args:
                params[param_name] = str(input_args[input_field])
        
        return params
    
    def _build_body(self, input_args: dict) -> dict | None:
        """Build request body if needed."""
        if not self.config.mapping.input_to_body:
            return None
        
        body = {}
        for input_field, body_field in self.config.mapping.input_to_body.items():
            if input_field in input_args:
                body[body_field] = input_args[input_field]
        
        return body if body else None
    
    async def _make_request(
        self,
        client: httpx.AsyncClient,
        url: str,
        headers: dict,
        params: dict,
        body: dict | None
    ) -> dict:
        """Make the HTTP request."""
        method = self.config.api.method
        
        if method == HttpMethod.GET:
            response = await client.get(url, headers=headers, params=params)
        elif method == HttpMethod.POST:
            response = await client.post(url, headers=headers, params=params, json=body)
        elif method == HttpMethod.PUT:
            response = await client.put(url, headers=headers, params=params, json=body)
        elif method == HttpMethod.PATCH:
            response = await client.patch(url, headers=headers, params=params, json=body)
        elif method == HttpMethod.DELETE:
            response = await client.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    def _transform_response(self, response_data: dict) -> dict:
        """Transform API response to tool output format."""
        # Extract data from nested path if specified
        data = response_data
        if self.config.mapping.response_path:
            for key in self.config.mapping.response_path.split('.'):
                data = data.get(key, {})
        
        # Map response fields to output schema
        output = {}
        for output_field, response_field in self.config.mapping.response_to_output.items():
            # Handle nested fields (e.g., "user.name")
            value = data
            for key in response_field.split('.'):
                if isinstance(value, dict):
                    value = value.get(key)
                else:
                    value = None
                    break
            
            # Type conversion based on output schema
            if value is not None:
                field_schema = self.config.output_schema.get("properties", {}).get(output_field, {})
                output[output_field] = self._convert_type(value, field_schema.get("type"))
        
        return output
    
    def _convert_type(self, value: Any, target_type: str | None) -> Any:
        """Convert value to target type."""
        if target_type == "number" or target_type == "integer":
            try:
                return float(value) if target_type == "number" else int(float(value))
            except (ValueError, TypeError):
                return value
        return value
    
    def _resolve_secret(self, secret_ref: str | None) -> str:
        """Resolve secret reference to actual value.
        
        Args:
            secret_ref: Secret reference like "${ALPHA_VANTAGE_API_KEY}"
            
        Returns:
            Actual secret value from environment
        """
        if not secret_ref:
            return ""
        
        # Simple env var interpolation
        if secret_ref.startswith("${") and secret_ref.endswith("}"):
            env_var = secret_ref[2:-1]
            value = os.getenv(env_var)
            if not value:
                logger.warning(f"Secret {env_var} not found in environment")
                return ""
            return value
        
        # TODO: Add support for Supabase secrets table lookup
        return secret_ref

