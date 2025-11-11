"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
from loguru import logger

from .endpoints import router, _global_registry
from .database_endpoints import router as db_router
from .proxy import router as proxy_router
from ..services.supabase_service import SupabaseService
from ..factory.tool_factory import ToolFactory
from ..config.settings import get_settings

# Configure loguru
logger.remove()  # Remove default handler
logger.add(sys.stdout, level="INFO")
logger.add("logs/app.log", rotation="500 MB", retention="10 days", level="INFO")

app = FastAPI(
    title="LLM HTTP Service",
    description="LLM-powered HTTP service with MCP support and dynamic_tools integration",
    version="0.1.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(router)
app.include_router(db_router)
app.include_router(proxy_router)


# NOTE: Tools are now loaded dynamically from the database on each workflow request
# No need to load them at startup - see workflow_orchestrator.py for implementation


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

