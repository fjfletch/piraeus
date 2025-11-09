"""Database models for Supabase persistence.

These models represent the database schema and are used for API requests/responses.
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# ============================================================================
# Project Models
# ============================================================================

class ProjectBase(BaseModel):
    """Base project model with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    """Model for creating a new project."""
    user_id: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    """Model for updating an existing project."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    user_id: Optional[UUID] = None


class Project(ProjectBase):
    """Complete project model with all fields."""
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# MCP Config Models
# ============================================================================

class MCPConfigBase(BaseModel):
    """Base MCP config model with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    model: str = Field(default="gpt-4o-mini")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=1000, gt=0)
    system_prompt: Optional[str] = None
    instruction: Optional[str] = None
    selected_tool_ids: List[UUID] = Field(default_factory=list)


class MCPConfigCreate(MCPConfigBase):
    """Model for creating a new MCP config."""
    project_id: Optional[UUID] = None  # Optional for global mode


class MCPConfigUpdate(BaseModel):
    """Model for updating an existing MCP config."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    system_prompt: Optional[str] = None
    instruction: Optional[str] = None
    selected_tool_ids: Optional[List[UUID]] = None
    deployment_status: Optional[str] = Field(
        None, 
        pattern="^(not-deployed|deploying|deployed|failed)$"
    )
    deployment_url: Optional[str] = None


class MCPConfig(MCPConfigBase):
    """Complete MCP config model with all fields."""
    id: UUID
    numeric_id: int  # Frontend-compatible integer ID
    project_id: Optional[UUID] = None
    deployment_status: str = "not-deployed"
    deployment_url: Optional[str] = None
    deployed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Response Config Models
# ============================================================================

class ResponseConfigBase(BaseModel):
    """Base response config model with common fields."""
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(default="raw-output", pattern="^(raw-output|llm-reprocess)$")
    reprocess_instructions: Optional[str] = None
    error_handling: str = Field(
        default="pass-through", 
        pattern="^(pass-through|retry|fallback)$"
    )


class ResponseConfigCreate(ResponseConfigBase):
    """Model for creating a new response config."""
    project_id: Optional[UUID] = None  # Optional for global mode


class ResponseConfigUpdate(BaseModel):
    """Model for updating an existing response config."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, pattern="^(raw-output|llm-reprocess)$")
    reprocess_instructions: Optional[str] = None
    error_handling: Optional[str] = Field(
        None, 
        pattern="^(pass-through|retry|fallback)$"
    )


class ResponseConfig(ResponseConfigBase):
    """Complete response config model with all fields."""
    id: UUID
    numeric_id: int  # Frontend-compatible integer ID
    project_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Tool Models (extended with project_id)
# ============================================================================

class ToolCreate(BaseModel):
    """Model for creating a new tool."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    tool_config: Optional[dict] = None
    project_id: Optional[UUID] = None
    # Frontend-compatible flattened fields (alternative to tool_config)
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[List[dict]] = None
    query_params: Optional[List[dict]] = None
    body_config: Optional[dict] = None


class ToolUpdate(BaseModel):
    """Model for updating an existing tool."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tool_config: Optional[dict] = None
    project_id: Optional[UUID] = None
    # Frontend-compatible flattened fields
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[List[dict]] = None
    query_params: Optional[List[dict]] = None
    body_config: Optional[dict] = None


class Tool(BaseModel):
    """Complete tool model."""
    id: UUID
    numeric_id: int  # Frontend-compatible integer ID
    name: str
    description: Optional[str] = None
    tool_config: Optional[dict] = None
    project_id: Optional[UUID] = None
    # Frontend-compatible flattened fields
    method: Optional[str] = None
    url: Optional[str] = None
    headers: Optional[List[dict]] = None
    query_params: Optional[List[dict]] = None
    body_config: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Prompt Models (extended with project_id)
# ============================================================================

class PromptCreate(BaseModel):
    """Model for creating a new prompt."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: Optional[List[str]] = Field(default_factory=list)
    project_id: Optional[UUID] = None
    # Frontend-compatible simple content field (alternative to prompt_template)
    content: Optional[str] = None


class PromptUpdate(BaseModel):
    """Model for updating an existing prompt."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: Optional[List[str]] = None
    project_id: Optional[UUID] = None
    # Frontend-compatible content field
    content: Optional[str] = None


class Prompt(BaseModel):
    """Complete prompt model."""
    id: UUID
    numeric_id: int  # Frontend-compatible integer ID
    name: str
    description: Optional[str] = None
    prompt_template: Optional[str] = None
    variables: Optional[List[str]] = None
    project_id: Optional[UUID] = None
    # Frontend-compatible content field
    content: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Flow Models (extended with project_id)
# ============================================================================

class FlowCreate(BaseModel):
    """Model for creating a new flow."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    steps: Optional[dict] = Field(default_factory=dict)  # Graph format (nodes/edges)
    steps_array: Optional[List[dict]] = None  # Linear array format for v6 builder
    project_id: Optional[UUID] = None  # Optional for global mode


class FlowUpdate(BaseModel):
    """Model for updating an existing flow."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    steps: Optional[dict] = None  # Graph format
    steps_array: Optional[List[dict]] = None  # Linear array format
    project_id: Optional[UUID] = None


class Flow(BaseModel):
    """Complete flow model."""
    id: UUID
    numeric_id: int  # Frontend-compatible integer ID
    name: str
    description: Optional[str] = None
    steps: Optional[dict] = None  # Graph format (nodes/edges)
    steps_array: Optional[List[dict]] = None  # Linear array format for v6 builder
    project_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Composite Models (for loading full project data)
# ============================================================================

class ProjectWithData(Project):
    """Project with all related entities."""
    tools: List[Tool] = Field(default_factory=list)
    prompts: List[Prompt] = Field(default_factory=list)
    flows: List[Flow] = Field(default_factory=list)
    mcp_configs: List[MCPConfig] = Field(default_factory=list)
    response_configs: List[ResponseConfig] = Field(default_factory=list)

