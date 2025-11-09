"""
Proxy endpoint to forward requests to AWS backend.
This solves the Mixed Content issue (HTTPS -> HTTP blocking).
"""

from fastapi import APIRouter, Request, Response
import httpx
from loguru import logger

router = APIRouter(prefix="/proxy", tags=["proxy"])

# AWS Backend URL
AWS_BACKEND_URL = "http://3.136.147.20:8000"


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_aws(path: str, request: Request):
    """
    Proxy all requests to AWS backend.
    This allows HTTPS frontend to communicate with HTTP AWS backend.
    
    Example:
    Frontend calls: https://preview.com/proxy/api/projects
    This proxies to: http://3.136.147.20:8000/api/projects
    """
    # Build target URL
    target_url = f"{AWS_BACKEND_URL}/{path}"
    
    # Get query parameters
    query_params = dict(request.query_params)
    
    # Get request body if present
    body = None
    if request.method in ["POST", "PUT", "PATCH"]:
        body = await request.body()
    
    # Forward headers (excluding host)
    headers = {
        key: value 
        for key, value in request.headers.items() 
        if key.lower() not in ["host", "content-length"]
    }
    
    logger.info(f"Proxying {request.method} {target_url}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=request.method,
                url=target_url,
                params=query_params,
                headers=headers,
                content=body,
                timeout=30.0
            )
            
            # Return response with same status code and content
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
    
    except Exception as e:
        logger.error(f"Proxy error: {str(e)}")
        return Response(
            content=f'{{"error": "Proxy error: {str(e)}"}}',
            status_code=500,
            media_type="application/json"
        )
