"""Executor for simplified tool specifications.

This module provides the SimpleToolExecutor class which takes a SimpleToolSpec
and parameters, builds an HTTPRequestSpec, and executes it via HTTPClientService.
"""

from typing import Any, Dict, Optional
import time
from loguru import logger

from ..models.simple_tool import SimpleToolSpec
from ..models.http_spec import HTTPRequestSpec, HTTPResponseSpec
from .http_client import HTTPClientService


class SimpleToolExecutor:
    """Executor for SimpleToolSpec objects.
    
    This executor takes a SimpleToolSpec (minimal tool definition) and parameters,
    builds an HTTPRequestSpec suitable for HTTPClientService, executes it, and
    returns the response.
    
    The executor automatically:
    - Routes parameters to query_params for GET requests
    - Routes parameters to body for POST/PUT/PATCH requests
    - Injects API keys into specified headers
    - Includes comprehensive logging
    """
    
    def __init__(self, timeout: float = 30.0, max_retries: int = 3):
        """Initialize the SimpleToolExecutor.
        
        Args:
            timeout: Request timeout in seconds (default: 30.0)
            max_retries: Maximum number of retry attempts (default: 3)
        """
        self.http_client = HTTPClientService(timeout=timeout, max_retries=max_retries)
        logger.info(f"SimpleToolExecutor initialized with timeout={timeout}s, max_retries={max_retries}")
    
    async def execute(
        self,
        spec: SimpleToolSpec,
        parameters: Optional[Dict[str, Any]] = None
    ) -> HTTPResponseSpec:
        """Execute a SimpleToolSpec with given parameters.
        
        This method:
        1. Builds an HTTPRequestSpec from the SimpleToolSpec and parameters
        2. Executes it via HTTPClientService
        3. Returns the response with all metadata
        
        Args:
            spec: SimpleToolSpec defining the tool
            parameters: Optional dict of parameters to pass to the API
            
        Returns:
            HTTPResponseSpec containing status_code, headers, body, execution_time_ms
            
        Raises:
            Exception: If request fails after all retries or other errors occur
        """
        start_time = time.time()
        
        try:
            logger.info(f"SimpleToolExecutor.execute() called for {spec.method} {spec.url}")
            if parameters:
                logger.debug(f"Parameters: {self._sanitize_parameters(parameters)}")
            
            # Build HTTPRequestSpec from SimpleToolSpec and parameters
            http_spec = self._build_http_spec(spec, parameters or {})
            logger.debug(f"Built HTTPRequestSpec: {http_spec.method} {http_spec.url}")
            
            # Execute via HTTPClientService
            response = await self.http_client.execute(http_spec)
            
            execution_time = (time.time() - start_time) * 1000
            logger.info(f"SimpleToolExecutor execution completed in {execution_time:.2f}ms with status {response.status_code}")
            
            return response
            
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.error(f"SimpleToolExecutor execution failed after {execution_time:.2f}ms: {e}")
            raise
    
    def _build_http_spec(
        self,
        spec: SimpleToolSpec,
        parameters: Dict[str, Any]
    ) -> HTTPRequestSpec:
        """Build HTTPRequestSpec from SimpleToolSpec and parameters.
        
        This method:
        - Merges static headers with api_key injection
        - Routes parameters to query_params (GET) or body (POST/PUT/PATCH)
        - Constructs a complete HTTPRequestSpec for HTTPClientService
        
        Args:
            spec: SimpleToolSpec defining the tool
            parameters: Parameters to pass to the API
            
        Returns:
            HTTPRequestSpec ready for HTTPClientService.execute()
        """
        logger.debug(f"Building HTTPRequestSpec from SimpleToolSpec")
        
        # Build headers: merge static headers + inject api_key
        headers = self._build_headers(spec)
        
        # Route parameters based on HTTP method
        query_params: Optional[Dict[str, str]] = None
        body: Optional[Dict[str, Any]] = None
        
        if spec.method == "GET":
            # GET requests use query parameters
            query_params = self._convert_params_to_strings(parameters) if parameters else None
            logger.debug(f"Routing parameters to query_params for GET: {query_params}")
        elif spec.method in ("HEAD", "OPTIONS"):
            # HEAD and OPTIONS typically don't have bodies, use query params
            query_params = self._convert_params_to_strings(parameters) if parameters else None
            logger.debug(f"Routing parameters to query_params for {spec.method}: {query_params}")
        else:
            # POST, PUT, PATCH use request body
            body = parameters if parameters else None
            logger.debug(f"Routing parameters to body for {spec.method}")
        
        # Build HTTPRequestSpec
        http_spec = HTTPRequestSpec(
            method=spec.method,
            url=spec.url,
            headers=headers if headers else None,
            query_params=query_params,
            body=body
        )
        
        logger.debug(f"HTTPRequestSpec built: method={http_spec.method}, url={http_spec.url}, has_headers={bool(http_spec.headers)}, has_query_params={bool(http_spec.query_params)}, has_body={bool(http_spec.body)}")
        
        return http_spec
    
    def _build_headers(self, spec: SimpleToolSpec) -> Optional[Dict[str, str]]:
        """Build final headers by merging static headers and injecting API key.
        
        Args:
            spec: SimpleToolSpec containing headers and api_key
            
        Returns:
            Merged headers dict with api_key injected, or None if no headers
        """
        headers: Dict[str, str] = {}
        
        # Copy static headers if present
        if spec.headers:
            headers.update(spec.headers)
            logger.debug(f"Merged static headers: {list(headers.keys())}")
        
        # Inject API key if present
        if spec.api_key:
            headers[spec.api_key_header] = spec.api_key
            logger.debug(f"Injected API key into header '{spec.api_key_header}'")
        
        return headers if headers else None
    
    @staticmethod
    def _convert_params_to_strings(params: Dict[str, Any]) -> Dict[str, str]:
        """Convert all parameter values to strings for query parameters.
        
        Query parameters must be strings, so convert all values.
        
        Args:
            params: Parameters dict with mixed types
            
        Returns:
            Parameters dict with all values converted to strings
        """
        return {str(k): str(v) for k, v in params.items()}
    
    @staticmethod
    def _sanitize_parameters(parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize parameters for logging (mask sensitive data).
        
        Masks values for common sensitive parameter names.
        
        Args:
            parameters: Parameters to sanitize
            
        Returns:
            Sanitized parameters dict safe for logging
        """
        sensitive_keys = {"password", "token", "secret", "api_key", "apikey", "key", "auth"}
        sanitized = {}
        
        for k, v in parameters.items():
            if k.lower() in sensitive_keys:
                sanitized[k] = "***REDACTED***"
            else:
                sanitized[k] = v
        
        return sanitized

