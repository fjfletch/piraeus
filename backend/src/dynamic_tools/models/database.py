"""Pydantic models for Supabase database tables.

This module contains models that reflect the database schema for tools, prompts, and flows.
Each entity has multiple model variants:
- Base: Core fields used for creation
- DB: Complete database representation including metadata
- Update: Optional fields for partial updates
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# ============================================================================
# TOOLS MODELS
# ============================================================================


class ToolBase(BaseModel):
    """Base model for tool creation and updates."""
    
    name: str = Field(
        ...,
        description="Unique tool name",
        min_length=1,
        max_length=255
    )
    description: Optional[str] = Field(
        None,
        description="Human-readable description of the tool"
    )
    tool_config: Dict[str, Any] = Field(
        ...,
        description="Complete ToolConfig as JSON object"
    )
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate tool name format."""
        if not v.strip():
            raise ValueError("Tool name cannot be empty")
        # Only allow alphanumeric, underscore, and hyphen
        if not all(c.isalnum() or c in ('_', '-') for c in v):
            raise ValueError("Tool name can only contain alphanumeric characters, underscores, and hyphens")
        return v.strip()


class ToolCreate(ToolBase):
    """Model for creating a new tool."""
    pass


class ToolUpdate(BaseModel):
    """Model for updating an existing tool (all fields optional)."""
    
    name: Optional[str] = Field(
        None,
        description="Updated tool name",
        min_length=1,
        max_length=255
    )
    description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    tool_config: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated tool configuration"
    )


class ToolDB(ToolBase):
    """Complete tool model as stored in database."""
    
    id: UUID = Field(
        ...,
        description="Unique identifier"
    )
    created_at: datetime = Field(
        ...,
        description="Creation timestamp"
    )
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp"
    )
    
    class Config:
        from_attributes = True


# ============================================================================
# PROMPTS MODELS
# ============================================================================


class PromptVariable(BaseModel):
    """Definition of a prompt variable."""
    
    name: str = Field(
        ...,
        description="Variable name (used in template as {name})"
    )
    type: str = Field(
        ...,
        description="Variable type (string, number, boolean, etc.)"
    )
    required: bool = Field(
        True,
        description="Whether this variable is required"
    )
    default: Optional[Any] = Field(
        None,
        description="Default value if not provided"
    )
    description: Optional[str] = Field(
        None,
        description="Description of the variable"
    )


class PromptBase(BaseModel):
    """Base model for prompt creation and updates."""
    
    name: str = Field(
        ...,
        description="Unique prompt name",
        min_length=1,
        max_length=255
    )
    description: Optional[str] = Field(
        None,
        description="Human-readable description of the prompt"
    )
    prompt_template: str = Field(
        ...,
        description="Prompt template with {variable} placeholders",
        min_length=1
    )
    variables: List[PromptVariable] = Field(
        default_factory=list,
        description="List of variable definitions"
    )
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate prompt name format."""
        if not v.strip():
            raise ValueError("Prompt name cannot be empty")
        # Only allow alphanumeric, underscore, and hyphen
        if not all(c.isalnum() or c in ('_', '-') for c in v):
            raise ValueError("Prompt name can only contain alphanumeric characters, underscores, and hyphens")
        return v.strip()


class PromptCreate(PromptBase):
    """Model for creating a new prompt."""
    pass


class PromptUpdate(BaseModel):
    """Model for updating an existing prompt (all fields optional)."""
    
    name: Optional[str] = Field(
        None,
        description="Updated prompt name",
        min_length=1,
        max_length=255
    )
    description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    prompt_template: Optional[str] = Field(
        None,
        description="Updated prompt template",
        min_length=1
    )
    variables: Optional[List[PromptVariable]] = Field(
        None,
        description="Updated variable definitions"
    )


class PromptDB(PromptBase):
    """Complete prompt model as stored in database."""
    
    id: UUID = Field(
        ...,
        description="Unique identifier"
    )
    created_at: datetime = Field(
        ...,
        description="Creation timestamp"
    )
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp"
    )
    
    class Config:
        from_attributes = True


# ============================================================================
# FLOWS MODELS
# ============================================================================


class FlowStep(BaseModel):
    """Definition of a single step in a flow."""
    
    step: int = Field(
        ...,
        ge=1,
        description="Step number (1-indexed)"
    )
    type: str = Field(
        ...,
        description="Step type: 'prompt', 'tool', or 'service'"
    )
    name: str = Field(
        ...,
        description="Name of the prompt/tool/service to execute"
    )
    inputs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Input mappings (can reference previous steps)"
    )
    description: Optional[str] = Field(
        None,
        description="Description of what this step does"
    )
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validate step type."""
        allowed_types = ['prompt', 'tool', 'service']
        if v not in allowed_types:
            raise ValueError(f"Step type must be one of {allowed_types}")
        return v


class FlowBase(BaseModel):
    """Base model for flow creation and updates."""
    
    name: str = Field(
        ...,
        description="Unique flow name",
        min_length=1,
        max_length=255
    )
    description: Optional[str] = Field(
        None,
        description="Human-readable description of the flow"
    )
    steps: List[FlowStep] = Field(
        ...,
        min_length=1,
        description="Ordered list of steps to execute"
    )
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate flow name format."""
        if not v.strip():
            raise ValueError("Flow name cannot be empty")
        # Only allow alphanumeric, underscore, and hyphen
        if not all(c.isalnum() or c in ('_', '-') for c in v):
            raise ValueError("Flow name can only contain alphanumeric characters, underscores, and hyphens")
        return v.strip()
    
    @field_validator('steps')
    @classmethod
    def validate_steps(cls, v: List[FlowStep]) -> List[FlowStep]:
        """Validate steps are properly ordered."""
        if not v:
            raise ValueError("Flow must have at least one step")
        
        # Check that step numbers are sequential starting from 1
        step_numbers = [step.step for step in v]
        expected = list(range(1, len(v) + 1))
        if sorted(step_numbers) != expected:
            raise ValueError(f"Step numbers must be sequential starting from 1, got {step_numbers}")
        
        return v


class FlowCreate(FlowBase):
    """Model for creating a new flow."""
    pass


class FlowUpdate(BaseModel):
    """Model for updating an existing flow (all fields optional)."""
    
    name: Optional[str] = Field(
        None,
        description="Updated flow name",
        min_length=1,
        max_length=255
    )
    description: Optional[str] = Field(
        None,
        description="Updated description"
    )
    steps: Optional[List[FlowStep]] = Field(
        None,
        min_length=1,
        description="Updated steps"
    )


class FlowDB(FlowBase):
    """Complete flow model as stored in database."""
    
    id: UUID = Field(
        ...,
        description="Unique identifier"
    )
    created_at: datetime = Field(
        ...,
        description="Creation timestamp"
    )
    updated_at: datetime = Field(
        ...,
        description="Last update timestamp"
    )
    
    class Config:
        from_attributes = True


# ============================================================================
# RESPONSE MODELS
# ============================================================================


class ToolListResponse(BaseModel):
    """Response model for listing tools."""
    
    tools: List[ToolDB] = Field(
        ...,
        description="List of tools"
    )
    total: int = Field(
        ...,
        description="Total number of tools"
    )


class PromptListResponse(BaseModel):
    """Response model for listing prompts."""
    
    prompts: List[PromptDB] = Field(
        ...,
        description="List of prompts"
    )
    total: int = Field(
        ...,
        description="Total number of prompts"
    )


class FlowListResponse(BaseModel):
    """Response model for listing flows."""
    
    flows: List[FlowDB] = Field(
        ...,
        description="List of flows"
    )
    total: int = Field(
        ...,
        description="Total number of flows"
    )


class FlowExecuteRequest(BaseModel):
    """Request model for executing a flow."""
    
    inputs: Dict[str, Any] = Field(
        default_factory=dict,
        description="Input values for the flow"
    )


class FlowExecuteResponse(BaseModel):
    """Response model for flow execution."""
    
    status: str = Field(
        ...,
        description="Execution status: 'success' or 'error'"
    )
    flow_name: str = Field(
        ...,
        description="Name of the executed flow"
    )
    steps_executed: int = Field(
        ...,
        description="Number of steps completed"
    )
    outputs: Optional[Dict[str, Any]] = Field(
        None,
        description="Final outputs from the flow"
    )
    error: Optional[str] = Field(
        None,
        description="Error message if execution failed"
    )
    execution_log: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Log of each step execution"
    )

