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


@app.on_event("startup")
async def load_tools_from_database():
    """Load all tools from database into workflow registry at startup.
    
    This ensures that tools created in the builder UI are automatically
    available to the workflow orchestrator without manual registration.
    """
    try:
        settings = get_settings()
        db = SupabaseService(settings.supabase_url, settings.supabase_key)
        
        # Get all tools from database
        tools = await db.get_tools()
        logger.info(f"📦 Found {len(tools)} tools in database")
        
        # Register each tool in the workflow registry
        factory = ToolFactory(registry=_global_registry)
        registered_count = 0
        
        for tool in tools:
            # Only register tools with basic HTTP info
            if tool.method and tool.url and tool.name:
                try:
                    # Create a simple tool config from database tool
                    from ..models.tool_config import ToolConfig, ApiConfig
                    from ..models.enums import HttpMethod
                    
                    # Convert method string to enum
                    method_enum = HttpMethod[tool.method.upper()] if tool.method else HttpMethod.GET
                    
                    # Create tool config
                    tool_config = ToolConfig(
                        name=tool.name,
                        description=tool.description or f"API tool: {tool.name}",
                        api=ApiConfig(
                            base_url=tool.url,
                            method=method_enum,
                            headers={},
                            params={}
                        ),
                        input_schema={"type": "object", "properties": {}},
                        output_schema={"type": "object"}
                    )
                    
                    # Create and register tool
                    tool_obj = factory.create_from_config(tool_config)
                    _global_registry.register(tool_obj)
                    registered_count += 1
                    logger.info(f"✅ Registered tool: {tool.name}")
                    
                except Exception as e:
                    logger.warning(f"⚠️  Could not register tool '{tool.name}': {e}")
            else:
                logger.debug(f"⏭️  Skipping incomplete tool: {tool.name}")
        
        logger.info(f"🎉 Successfully loaded {registered_count} tools into workflow registry")
        
    except Exception as e:
        logger.error(f"❌ Failed to load tools from database: {e}")
        # Don't crash the app, just log the error


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

