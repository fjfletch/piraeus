"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
from loguru import logger

from .endpoints import router

# Configure loguru
logger.remove()  # Remove default handler
logger.add(sys.stdout, level="INFO")
logger.add("logs/app.log", rotation="500 MB", retention="10 days", level="INFO")

app = FastAPI(
    title="LLM HTTP Service",
    description="LLM-powered HTTP service with MCP support and dynamic_tools integration",
    version="0.1.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",   # Vercel deployments
        "https://mcp-factor.vercel.app",  # Production (update with your actual domain)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(router)


@app.get("/health")
async def health_check():
    """Health check endpoint.
    
    Returns:
        JSON response with service status
    """
    logger.info("Health check requested")
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "service": "llm-http-service"}
    )


@app.get("/")
async def root():
    """Root endpoint with API information.
    
    Returns:
        JSON response with service info
    """
    return {
        "service": "LLM HTTP Service",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

