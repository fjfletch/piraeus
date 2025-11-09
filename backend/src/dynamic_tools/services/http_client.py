"""HTTP client service for executing HTTP requests."""

import time
from typing import Optional
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from loguru import logger

from ..models.http_spec import HTTPRequestSpec, HTTPResponseSpec


class HTTPClientService:
    """Service for executing HTTP requests from HTTPRequestSpec.
    
    This service uses httpx to execute HTTP requests with support for:
    - All HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
    - Custom headers and query parameters
    - JSON and text request bodies
    - Timeout handling
    - Automatic retry on transient failures (5xx errors)
    - Response time tracking
    
    Attributes:
        timeout: Request timeout in seconds
        max_retries: Maximum number of retry attempts for failed requests
    """
    
    def __init__(self, timeout: float = 30.0, max_retries: int = 3):
        """Initialize the HTTP client service.
        
        Args:
            timeout: Request timeout in seconds (default: 30.0)
            max_retries: Maximum number of retry attempts (default: 3)
        """
        self.timeout = timeout
        self.max_retries = max_retries
        logger.info(f"HTTPClientService initialized with timeout={timeout}s, max_retries={max_retries}")
    
    def _should_retry(self, exception: Exception) -> bool:
        """Determine if request should be retried based on exception.
        
        Args:
            exception: The exception that occurred
            
        Returns:
            True if request should be retried, False otherwise
        """
        # Retry on httpx timeout and network errors
        if isinstance(exception, (httpx.TimeoutException, httpx.NetworkError)):
            return True
        
        # Retry on 5xx server errors (via HTTPStatusError)
        if isinstance(exception, httpx.HTTPStatusError):
            return exception.response.status_code >= 500
        
        return False
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError)),
        reraise=True
    )
    async def _execute_with_retry(
        self,
        client: httpx.AsyncClient,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """Execute HTTP request with retry logic.
        
        Args:
            client: httpx AsyncClient instance
            method: HTTP method
            url: Request URL
            **kwargs: Additional request parameters
            
        Returns:
            httpx.Response object
            
        Raises:
            httpx.HTTPError: If request fails after all retries
        """
        try:
            response = await client.request(method, url, **kwargs)
            
            # Raise for 5xx errors to trigger retry
            if response.status_code >= 500:
                logger.warning(f"Server error {response.status_code} for {method} {url}, will retry")
                response.raise_for_status()
            
            return response
            
        except httpx.HTTPStatusError as e:
            # Re-raise 5xx for retry, but return response for 4xx
            if e.response.status_code >= 500:
                logger.error(f"5xx error, will retry: {e}")
                raise
            # For 4xx errors, return the response (don't retry)
            logger.info(f"4xx error, not retrying: {e.response.status_code}")
            return e.response
            
        except Exception as e:
            logger.error(f"HTTP request failed: {e}")
            raise
    
    async def execute(self, spec: HTTPRequestSpec) -> HTTPResponseSpec:
        """Execute an HTTP request from HTTPRequestSpec.
        
        Args:
            spec: HTTPRequestSpec defining the request to execute
            
        Returns:
            HTTPResponseSpec containing response data and metadata
            
        Raises:
            httpx.HTTPError: If request fails after all retries
        """
        start_time = time.time()
        
        logger.info(f"Executing HTTP request: {spec.method} {spec.url}")
        
        # Prepare request parameters
        headers = spec.headers or {}
        params = spec.query_params or {}
        
        # Prepare request body
        json_data = None
        content = None
        
        if spec.body is not None:
            # If body is dict, send as JSON
            if isinstance(spec.body, dict):
                json_data = spec.body
                if "Content-Type" not in headers and "content-type" not in headers:
                    headers["Content-Type"] = "application/json"
            else:
                # Otherwise send as raw content
                content = str(spec.body).encode() if not isinstance(spec.body, bytes) else spec.body
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Execute request with retry logic
                response = await self._execute_with_retry(
                    client=client,
                    method=spec.method,
                    url=spec.url,
                    headers=headers,
                    params=params,
                    json=json_data,
                    content=content
                )
                
                # Calculate execution time
                execution_time_ms = (time.time() - start_time) * 1000
                
                # Parse response body
                response_body = None
                content_type = response.headers.get("content-type", "")
                
                if response.status_code == 204:
                    # No content
                    response_body = None
                elif "application/json" in content_type:
                    try:
                        response_body = response.json()
                    except Exception:
                        response_body = response.text
                elif response.text:
                    response_body = response.text
                else:
                    response_body = None
                
                # Convert headers to dict
                response_headers = dict(response.headers)
                
                logger.info(f"HTTP request completed: {response.status_code} in {execution_time_ms:.2f}ms")
                
                return HTTPResponseSpec(
                    status_code=response.status_code,
                    headers=response_headers,
                    body=response_body,
                    execution_time_ms=execution_time_ms
                )
                
        except httpx.TimeoutException as e:
            execution_time_ms = (time.time() - start_time) * 1000
            logger.error(f"HTTP request timed out after {execution_time_ms:.2f}ms")
            raise Exception(f"Request timed out after {self.timeout}s") from e
            
        except httpx.HTTPError as e:
            execution_time_ms = (time.time() - start_time) * 1000
            logger.error(f"HTTP request failed after {execution_time_ms:.2f}ms: {e}")
            raise
            
        except Exception as e:
            execution_time_ms = (time.time() - start_time) * 1000
            logger.error(f"Unexpected error after {execution_time_ms:.2f}ms: {e}")
            raise

