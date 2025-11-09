"""FastAPI endpoints for database CRUD operations.

These endpoints provide REST API access to all database entities.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from loguru import logger

from ..models.database_models import (
    Project, ProjectCreate, ProjectUpdate, ProjectWithData,
    MCPConfig, MCPConfigCreate, MCPConfigUpdate,
    ResponseConfig, ResponseConfigCreate, ResponseConfigUpdate,
    Tool, ToolCreate, ToolUpdate,
    Prompt, PromptCreate, PromptUpdate,
    Flow, FlowCreate, FlowUpdate,
)
from ..services.supabase_service import SupabaseService
from ..config.settings import Settings, get_settings

# Create router
router = APIRouter(prefix="/api", tags=["database"])

# Dependency to get Supabase service
def get_supabase_service(settings: Settings = Depends(get_settings)) -> SupabaseService:
    """Get Supabase service instance."""
    return SupabaseService(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_key
    )


# ============================================================================
# Project Endpoints
# ============================================================================

@router.get("/projects", response_model=List[Project])
async def list_projects(
    user_id: Optional[UUID] = None,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get all projects, optionally filtered by user_id."""
    try:
        return await db.get_projects(user_id)
    except Exception as e:
        logger.error(f"Error listing projects: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch projects: {str(e)}"
        )


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a single project by ID."""
    try:
        project = await db.get_project(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )


@router.get("/projects/{project_id}/full", response_model=ProjectWithData)
async def get_project_with_data(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a project with all related entities (tools, prompts, flows, configs)."""
    try:
        project = await db.get_project_with_data(project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching project with data {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch project: {str(e)}"
        )


@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Create a new project."""
    try:
        return await db.create_project(project)
    except Exception as e:
        logger.error(f"Error creating project: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )


@router.patch("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: UUID,
    project: ProjectUpdate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Update an existing project."""
    try:
        return await db.update_project(project_id, project)
    except Exception as e:
        logger.error(f"Error updating project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Delete a project (cascades to all related entities)."""
    try:
        await db.delete_project(project_id)
    except Exception as e:
        logger.error(f"Error deleting project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}"
        )


# ============================================================================
# MCP Config Endpoints
# ============================================================================

@router.get("/projects/{project_id}/mcp-configs", response_model=List[MCPConfig])
async def list_mcp_configs(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get all MCP configs for a project."""
    try:
        return await db.get_mcp_configs(project_id)
    except Exception as e:
        logger.error(f"Error listing MCP configs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch MCP configs: {str(e)}"
        )


@router.get("/mcp-configs/{config_id}", response_model=MCPConfig)
async def get_mcp_config(
    config_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a single MCP config by ID."""
    try:
        config = await db.get_mcp_config(config_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"MCP config {config_id} not found"
            )
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching MCP config {config_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch MCP config: {str(e)}"
        )


@router.post("/projects/{project_id}/mcp-configs", response_model=MCPConfig, status_code=status.HTTP_201_CREATED)
async def create_mcp_config(
    project_id: UUID,
    config: MCPConfigCreate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Create a new MCP config."""
    try:
        # Ensure project_id matches the path
        if config.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id in body must match path parameter"
            )
        return await db.create_mcp_config(config)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating MCP config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create MCP config: {str(e)}"
        )


@router.patch("/mcp-configs/{config_id}", response_model=MCPConfig)
async def update_mcp_config(
    config_id: UUID,
    config: MCPConfigUpdate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Update an existing MCP config."""
    try:
        return await db.update_mcp_config(config_id, config)
    except Exception as e:
        logger.error(f"Error updating MCP config {config_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update MCP config: {str(e)}"
        )


@router.delete("/mcp-configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mcp_config(
    config_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Delete an MCP config."""
    try:
        await db.delete_mcp_config(config_id)
    except Exception as e:
        logger.error(f"Error deleting MCP config {config_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete MCP config: {str(e)}"
        )


# ============================================================================
# Response Config Endpoints
# ============================================================================

@router.get("/projects/{project_id}/response-configs", response_model=List[ResponseConfig])
async def list_response_configs(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get all response configs for a project."""
    try:
        return await db.get_response_configs(project_id)
    except Exception as e:
        logger.error(f"Error listing response configs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch response configs: {str(e)}"
        )


@router.get("/response-configs/{config_id}", response_model=ResponseConfig)
async def get_response_config(
    config_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a single response config by ID."""
    try:
        config = await db.get_response_config(config_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Response config {config_id} not found"
            )
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching response config {config_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch response config: {str(e)}"
        )


@router.post("/projects/{project_id}/response-configs", response_model=ResponseConfig, status_code=status.HTTP_201_CREATED)
async def create_response_config(
    project_id: UUID,
    config: ResponseConfigCreate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Create a new response config."""
    try:
        # Ensure project_id matches the path
        if config.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id in body must match path parameter"
            )
        return await db.create_response_config(config)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating response config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create response config: {str(e)}"
        )


@router.patch("/response-configs/{config_id}", response_model=ResponseConfig)
async def update_response_config(
    config_id: UUID,
    config: ResponseConfigUpdate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Update an existing response config."""
    try:
        return await db.update_response_config(config_id, config)
    except Exception as e:
        logger.error(f"Error updating response config {config_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update response config: {str(e)}"
        )


@router.delete("/response-configs/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_response_config(
    config_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Delete a response config."""
    try:
        await db.delete_response_config(config_id)
    except Exception as e:
        logger.error(f"Error deleting response config {config_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete response config: {str(e)}"
        )


# ============================================================================
# Tool Endpoints
# ============================================================================

@router.get("/projects/{project_id}/tools", response_model=List[Tool])
async def list_tools(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get all tools for a project."""
    try:
        return await db.get_tools(project_id)
    except Exception as e:
        logger.error(f"Error listing tools: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tools: {str(e)}"
        )


@router.get("/tools/{tool_id}", response_model=Tool)
async def get_tool(
    tool_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a single tool by ID."""
    try:
        tool = await db.get_tool(tool_id)
        if not tool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool {tool_id} not found"
            )
        return tool
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tool: {str(e)}"
        )


@router.post("/projects/{project_id}/tools", response_model=Tool, status_code=status.HTTP_201_CREATED)
async def create_tool(
    project_id: UUID,
    tool: ToolCreate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Create a new tool."""
    try:
        # Ensure project_id matches the path
        if tool.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id in body must match path parameter"
            )
        return await db.create_tool(tool)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating tool: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tool: {str(e)}"
        )


@router.patch("/tools/{tool_id}", response_model=Tool)
async def update_tool(
    tool_id: UUID,
    tool: ToolUpdate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Update an existing tool."""
    try:
        return await db.update_tool(tool_id, tool)
    except Exception as e:
        logger.error(f"Error updating tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update tool: {str(e)}"
        )


@router.delete("/tools/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tool(
    tool_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Delete a tool."""
    try:
        await db.delete_tool(tool_id)
    except Exception as e:
        logger.error(f"Error deleting tool {tool_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tool: {str(e)}"
        )


# ============================================================================
# Prompt Endpoints
# ============================================================================

@router.get("/projects/{project_id}/prompts", response_model=List[Prompt])
async def list_prompts(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get all prompts for a project."""
    try:
        return await db.get_prompts(project_id)
    except Exception as e:
        logger.error(f"Error listing prompts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch prompts: {str(e)}"
        )


@router.get("/prompts/{prompt_id}", response_model=Prompt)
async def get_prompt(
    prompt_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a single prompt by ID."""
    try:
        prompt = await db.get_prompt(prompt_id)
        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prompt {prompt_id} not found"
            )
        return prompt
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch prompt: {str(e)}"
        )


@router.post("/projects/{project_id}/prompts", response_model=Prompt, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    project_id: UUID,
    prompt: PromptCreate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Create a new prompt."""
    try:
        # Ensure project_id matches the path
        if prompt.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id in body must match path parameter"
            )
        return await db.create_prompt(prompt)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating prompt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create prompt: {str(e)}"
        )


@router.patch("/prompts/{prompt_id}", response_model=Prompt)
async def update_prompt(
    prompt_id: UUID,
    prompt: PromptUpdate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Update an existing prompt."""
    try:
        return await db.update_prompt(prompt_id, prompt)
    except Exception as e:
        logger.error(f"Error updating prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update prompt: {str(e)}"
        )


@router.delete("/prompts/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Delete a prompt."""
    try:
        await db.delete_prompt(prompt_id)
    except Exception as e:
        logger.error(f"Error deleting prompt {prompt_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete prompt: {str(e)}"
        )


# ============================================================================
# Flow Endpoints
# ============================================================================

@router.get("/projects/{project_id}/flows", response_model=List[Flow])
async def list_flows(
    project_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get all flows for a project."""
    try:
        return await db.get_flows(project_id)
    except Exception as e:
        logger.error(f"Error listing flows: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flows: {str(e)}"
        )


@router.get("/flows/{flow_id}", response_model=Flow)
async def get_flow(
    flow_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a single flow by ID."""
    try:
        flow = await db.get_flow(flow_id)
        if not flow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flow {flow_id} not found"
            )
        return flow
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching flow {flow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flow: {str(e)}"
        )


@router.post("/projects/{project_id}/flows", response_model=Flow, status_code=status.HTTP_201_CREATED)
async def create_flow(
    project_id: UUID,
    flow: FlowCreate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Create a new flow."""
    try:
        # Ensure project_id matches the path
        if flow.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="project_id in body must match path parameter"
            )
        return await db.create_flow(flow)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating flow: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create flow: {str(e)}"
        )


@router.patch("/flows/{flow_id}", response_model=Flow)
async def update_flow(
    flow_id: UUID,
    flow: FlowUpdate,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Update an existing flow."""
    try:
        return await db.update_flow(flow_id, flow)
    except Exception as e:
        logger.error(f"Error updating flow {flow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update flow: {str(e)}"
        )


@router.delete("/flows/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: UUID,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Delete a flow."""
    try:
        await db.delete_flow(flow_id)
    except Exception as e:
        logger.error(f"Error deleting flow {flow_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete flow: {str(e)}"
        )


# ============================================================================
# Numeric ID Lookup Endpoints (Frontend Compatibility)
# ============================================================================

@router.get("/tools/by-numeric-id/{numeric_id}", response_model=Tool)
async def get_tool_by_numeric_id(
    numeric_id: int,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a tool by its numeric_id (frontend-compatible)."""
    try:
        tool = await db.get_tool_by_numeric_id(numeric_id)
        if not tool:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tool with numeric_id {numeric_id} not found"
            )
        return tool
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tool by numeric_id {numeric_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tool: {str(e)}"
        )


@router.get("/prompts/by-numeric-id/{numeric_id}", response_model=Prompt)
async def get_prompt_by_numeric_id(
    numeric_id: int,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a prompt by its numeric_id (frontend-compatible)."""
    try:
        prompt = await db.get_prompt_by_numeric_id(numeric_id)
        if not prompt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Prompt with numeric_id {numeric_id} not found"
            )
        return prompt
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prompt by numeric_id {numeric_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch prompt: {str(e)}"
        )


@router.get("/mcp-configs/by-numeric-id/{numeric_id}", response_model=MCPConfig)
async def get_mcp_config_by_numeric_id(
    numeric_id: int,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get an MCP config by its numeric_id (frontend-compatible)."""
    try:
        config = await db.get_mcp_config_by_numeric_id(numeric_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"MCP config with numeric_id {numeric_id} not found"
            )
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching MCP config by numeric_id {numeric_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch MCP config: {str(e)}"
        )


@router.get("/response-configs/by-numeric-id/{numeric_id}", response_model=ResponseConfig)
async def get_response_config_by_numeric_id(
    numeric_id: int,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a response config by its numeric_id (frontend-compatible)."""
    try:
        config = await db.get_response_config_by_numeric_id(numeric_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Response config with numeric_id {numeric_id} not found"
            )
        return config
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching response config by numeric_id {numeric_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch response config: {str(e)}"
        )


@router.get("/flows/by-numeric-id/{numeric_id}", response_model=Flow)
async def get_flow_by_numeric_id(
    numeric_id: int,
    db: SupabaseService = Depends(get_supabase_service)
):
    """Get a flow by its numeric_id (frontend-compatible)."""
    try:
        flow = await db.get_flow_by_numeric_id(numeric_id)
        if not flow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Flow with numeric_id {numeric_id} not found"
            )
        return flow
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching flow by numeric_id {numeric_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch flow: {str(e)}"
        )

