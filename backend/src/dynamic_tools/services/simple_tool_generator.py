"""Service for generating simple tool configurations from API descriptions.

This module provides a simplified tool generator that creates SimpleToolSpec objects
instead of complex ToolConfig objects. It uses the LLM to extract just the essential
information needed: URL, HTTP method, headers, and API key requirements.
"""

from typing import Optional, Dict, Any
import json
import re
from loguru import logger

from ..models.simple_tool import SimpleToolSpec
from ..models.api_requests import PromptRequest
from .prompt_service import PromptService


class SimpleToolConfigGenerator:
    """Service for generating SimpleToolSpec from API descriptions.
    
    This generator uses the PromptService to convert API documentation into
    minimal SimpleToolSpec objects with just the essentials: URL, method, headers,
    and API key configuration.
    
    Advantages over complex ToolConfig:
    - Simpler to understand and use
    - Faster generation (fewer LLM calls)
    - Works directly with SimpleToolExecutor
    - Easier to debug and modify
    """
    
    def __init__(self, api_key: str, max_retries: int = 3):
        """Initialize the SimpleToolConfigGenerator.
        
        Args:
            api_key: OpenAI API key for LLM calls
            max_retries: Maximum number of retry attempts (default: 3)
        """
        self.prompt_service = PromptService(
            api_key=api_key,
            max_retries=max_retries
        )
        self.max_retries = max_retries
        logger.info("SimpleToolConfigGenerator initialized")
    
    async def generate_simple_tool_config(
        self,
        tool_name: str,
        tool_description: str,
        api_docs: str
    ) -> Dict[str, Any]:
        """Generate a SimpleToolSpec from API description.
        
        This method extracts the essential information needed to call an API:
        1. Determines the API endpoint URL
        2. Identifies the HTTP method (GET, POST, PUT, DELETE, etc.)
        3. Detects if API key authentication is required
        4. Identifies which header to use for API key (Authorization, X-API-Key, etc.)
        5. Returns a simple, executable tool specification
        
        Args:
            tool_name: Unique name for the tool
            tool_description: Human-readable description of what the tool does
            api_docs: API documentation or endpoint information
            
        Returns:
            Dictionary representation of SimpleToolSpec with fields:
            - url: API endpoint URL
            - method: HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
            - headers: Optional static headers dict
            - api_key: Optional placeholder for API key
            - api_key_header: Header name where API key should be injected
            - type: Tool type ("api" by default)
            
        Raises:
            Exception: If URL extraction fails or invalid config produced
        """
        try:
            logger.info(f"Starting simple tool config generation for: {tool_name}")
            logger.debug(f"Tool description: {tool_description[:100]}...")
            
            # Extract URL and method from API docs
            logger.info("Extracting API endpoint and method...")
            url, method = await self._extract_url_and_method(
                tool_description=tool_description,
                api_docs=api_docs
            )
            logger.info(f"Extracted URL: {url}, Method: {method}")
            
            # Detect API key requirements
            logger.info("Detecting API key requirements...")
            api_key, api_key_header = await self._detect_api_key_config(api_docs)
            if api_key:
                logger.info(f"API key required, will be injected into header: {api_key_header}")
            else:
                logger.info("No API key authentication detected")
            
            # Extract static headers if specified
            logger.info("Extracting static headers...")
            headers = self._extract_static_headers(api_docs)
            if headers:
                logger.info(f"Extracted static headers: {list(headers.keys())}")
            
            # Create SimpleToolSpec
            simple_spec = SimpleToolSpec(
                url=url,
                method=method,
                headers=headers if headers else None,
                api_key=api_key if api_key else None,
                api_key_header=api_key_header,
                type="api"
            )
            
            logger.info(f"✅ Successfully generated simple tool config for: {tool_name}")
            return simple_spec.model_dump()
            
        except Exception as e:
            logger.error(f"❌ Failed to generate simple tool config: {e}")
            raise
    
    async def _extract_url_and_method(
        self,
        tool_description: str,
        api_docs: str
    ) -> tuple[str, str]:
        """Extract the API endpoint URL and HTTP method from documentation.
        
        Args:
            tool_description: Description of the tool
            api_docs: API documentation
            
        Returns:
            Tuple of (url, method) where method is one of:
            GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
            
        Raises:
            Exception: If URL cannot be extracted
        """
        prompt = f"""Extract the API endpoint URL and HTTP method from the following API documentation.

Tool Description: {tool_description}

API Documentation:
{api_docs}

Return a JSON object with exactly these fields (no other text):
{{
  "url": "full API endpoint URL (e.g., https://api.example.com/v1/endpoint)",
  "method": "HTTP method: GET, POST, PUT, DELETE, PATCH, HEAD, or OPTIONS"
}}

Requirements:
- URL must be a complete endpoint, not just base URL
- Include the full path after the domain
- Method must be exactly one of: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Return ONLY valid JSON, no markdown or extra text"""
        
        try:
            request = PromptRequest(
                instructions=prompt,
                context=None
            )
            
            response = await self.prompt_service.prompt_normal(request)
            
            # Parse JSON response
            response_text = response.content.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            data = json.loads(response_text.strip())
            
            url = data.get("url", "")
            method = data.get("method", "GET").upper()
            
            if not url:
                raise ValueError("URL not extracted from API docs")
            
            if method not in ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]:
                logger.warning(f"Invalid method {method}, defaulting to GET")
                method = "GET"
            
            return url, method
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to extract URL and method: {e}")
            raise
    
    async def _detect_api_key_config(
        self,
        api_docs: str
    ) -> tuple[Optional[str], str]:
        """Detect if API key authentication is required and where it goes.
        
        Args:
            api_docs: API documentation
            
        Returns:
            Tuple of (api_key, api_key_header) where:
            - api_key: "YOUR_API_KEY" if required, None otherwise
            - api_key_header: Header name (default "Authorization")
            
        Raises:
            Exception: If detection fails
        """
        prompt = f"""Analyze the API documentation and determine:
1. Does this API require an API key for authentication?
2. If yes, what header should the API key be sent in?

API Documentation:
{api_docs}

Return a JSON object with exactly these fields (no other text):
{{
  "requires_api_key": true or false,
  "api_key_header": "header name (e.g., Authorization, X-API-Key, x-api-key, key, apikey)"
}}

Requirements:
- requires_api_key: boolean (true if API key is mentioned in authentication)
- api_key_header: the header/parameter name where API key should be sent
- If no API key required, set requires_api_key to false and api_key_header to "Authorization"
- Return ONLY valid JSON, no markdown or extra text"""
        
        try:
            request = PromptRequest(
                instructions=prompt,
                context=None
            )
            
            response = await self.prompt_service.prompt_normal(request)
            
            # Parse JSON response
            response_text = response.content.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            data = json.loads(response_text.strip())
            
            requires_api_key = data.get("requires_api_key", False)
            api_key_header = data.get("api_key_header", "Authorization").strip()
            
            # Normalize header name
            if api_key_header.lower() in ["key", "apikey", "api_key"]:
                api_key_header = "key"
            elif api_key_header.lower() == "authorization":
                api_key_header = "Authorization"
            else:
                # Keep as-is but normalize case
                if api_key_header.lower().startswith("x-"):
                    api_key_header = api_key_header.lower()
            
            api_key = "YOUR_API_KEY" if requires_api_key else None
            
            return api_key, api_key_header
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse API key config response as JSON: {e}")
            # Default to Authorization header
            return None, "Authorization"
        except Exception as e:
            logger.error(f"Failed to detect API key config: {e}")
            # Default to Authorization header
            return None, "Authorization"
    
    def _extract_static_headers(self, api_docs: str) -> Optional[Dict[str, str]]:
        """Extract static headers that should always be sent.
        
        Looks for mentions of standard headers like Content-Type, Accept, User-Agent.
        
        Args:
            api_docs: API documentation
            
        Returns:
            Dict of static headers, or None if none found
        """
        headers: Dict[str, str] = {}
        
        # Look for JSON content type mentions
        if "application/json" in api_docs.lower() or "json" in api_docs.lower():
            # Check if it's mentioned for request or response
            if any(phrase in api_docs.lower() for phrase in ["request", "send", "post", "put", "body"]):
                headers["Content-Type"] = "application/json"
            if any(phrase in api_docs.lower() for phrase in ["response", "accept", "receive"]):
                headers["Accept"] = "application/json"
        
        # Look for specific header mentions
        if "user-agent" in api_docs.lower():
            headers["User-Agent"] = "DynamicTools/1.0"
        
        return headers if headers else None

