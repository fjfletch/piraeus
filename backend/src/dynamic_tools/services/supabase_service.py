"""Supabase database service for CRUD operations.

This service handles all database interactions with Supabase.
"""

from typing import List, Optional
from uuid import UUID
from supabase import create_client, Client
from loguru import logger

from ..models.database_models import (
    Project, ProjectCreate, ProjectUpdate,
    MCPConfig, MCPConfigCreate, MCPConfigUpdate,
    ResponseConfig, ResponseConfigCreate, ResponseConfigUpdate,
    Tool, ToolCreate, ToolUpdate,
    Prompt, PromptCreate, PromptUpdate,
    Flow, FlowCreate, FlowUpdate,
    ProjectWithData
)


class SupabaseService:
    """Service for interacting with Supabase database."""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        """Initialize Supabase client.
        
        Args:
            supabase_url: Supabase project URL
            supabase_key: Supabase API key
        """
        self.client: Client = create_client(supabase_url, supabase_key)
        logger.info("SupabaseService initialized")
    
    # ========================================================================
    # Projects
    # ========================================================================
    
    async def get_projects(self, user_id: Optional[UUID] = None) -> List[Project]:
        """Get all projects, optionally filtered by user."""
        try:
            query = self.client.table('projects').select('*')
            if user_id:
                query = query.eq('user_id', str(user_id))
            
            result = query.execute()
            return [Project(**project) for project in result.data]
        except Exception as e:
            logger.error(f"Error fetching projects: {e}")
            raise
    
    async def get_project(self, project_id: UUID) -> Optional[Project]:
        """Get a single project by ID."""
        try:
            result = self.client.table('projects').select('*').eq('id', str(project_id)).execute()
            if result.data:
                return Project(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching project {project_id}: {e}")
            raise
    
    async def create_project(self, project: ProjectCreate) -> Project:
        """Create a new project."""
        try:
            data = project.model_dump()
            if data.get('user_id'):
                data['user_id'] = str(data['user_id'])
            
            result = self.client.table('projects').insert(data).execute()
            return Project(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            raise
    
    async def update_project(self, project_id: UUID, project: ProjectUpdate) -> Project:
        """Update an existing project."""
        try:
            data = project.model_dump(exclude_unset=True)
            if 'user_id' in data and data['user_id']:
                data['user_id'] = str(data['user_id'])
            
            result = self.client.table('projects').update(data).eq('id', str(project_id)).execute()
            return Project(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating project {project_id}: {e}")
            raise
    
    async def delete_project(self, project_id: UUID) -> bool:
        """Delete a project (cascades to all related entities)."""
        try:
            self.client.table('projects').delete().eq('id', str(project_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting project {project_id}: {e}")
            raise
    
    async def get_project_with_data(self, project_id: UUID) -> Optional[ProjectWithData]:
        """Get project with all related entities."""
        try:
            project = await self.get_project(project_id)
            if not project:
                return None
            
            # Fetch all related entities
            tools = await self.get_tools(project_id)
            prompts = await self.get_prompts(project_id)
            flows = await self.get_flows(project_id)
            mcp_configs = await self.get_mcp_configs(project_id)
            response_configs = await self.get_response_configs(project_id)
            
            return ProjectWithData(
                **project.model_dump(),
                tools=tools,
                prompts=prompts,
                flows=flows,
                mcp_configs=mcp_configs,
                response_configs=response_configs
            )
        except Exception as e:
            logger.error(f"Error fetching project with data {project_id}: {e}")
            raise
    
    # ========================================================================
    # MCP Configs
    # ========================================================================
    
    async def get_mcp_configs(self, project_id: UUID) -> List[MCPConfig]:
        """Get all MCP configs for a project."""
        try:
            result = self.client.table('mcp_configs').select('*').eq('project_id', str(project_id)).execute()
            return [MCPConfig(**config) for config in result.data]
        except Exception as e:
            logger.error(f"Error fetching MCP configs: {e}")
            raise
    
    async def get_mcp_config(self, config_id: UUID) -> Optional[MCPConfig]:
        """Get a single MCP config by ID."""
        try:
            result = self.client.table('mcp_configs').select('*').eq('id', str(config_id)).execute()
            if result.data:
                return MCPConfig(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching MCP config {config_id}: {e}")
            raise
    
    async def create_mcp_config(self, config: MCPConfigCreate) -> MCPConfig:
        """Create a new MCP config."""
        try:
            data = config.model_dump()
            data['project_id'] = str(data['project_id'])
            data['selected_tool_ids'] = [str(tid) for tid in data['selected_tool_ids']]
            
            result = self.client.table('mcp_configs').insert(data).execute()
            return MCPConfig(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating MCP config: {e}")
            raise
    
    async def update_mcp_config(self, config_id: UUID, config: MCPConfigUpdate) -> MCPConfig:
        """Update an existing MCP config."""
        try:
            data = config.model_dump(exclude_unset=True)
            if 'selected_tool_ids' in data:
                data['selected_tool_ids'] = [str(tid) for tid in data['selected_tool_ids']]
            
            result = self.client.table('mcp_configs').update(data).eq('id', str(config_id)).execute()
            return MCPConfig(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating MCP config {config_id}: {e}")
            raise
    
    async def delete_mcp_config(self, config_id: UUID) -> bool:
        """Delete an MCP config."""
        try:
            self.client.table('mcp_configs').delete().eq('id', str(config_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting MCP config {config_id}: {e}")
            raise
    
    # ========================================================================
    # Response Configs
    # ========================================================================
    
    async def get_response_configs(self, project_id: UUID) -> List[ResponseConfig]:
        """Get all response configs for a project."""
        try:
            result = self.client.table('response_configs').select('*').eq('project_id', str(project_id)).execute()
            return [ResponseConfig(**config) for config in result.data]
        except Exception as e:
            logger.error(f"Error fetching response configs: {e}")
            raise
    
    async def get_response_config(self, config_id: UUID) -> Optional[ResponseConfig]:
        """Get a single response config by ID."""
        try:
            result = self.client.table('response_configs').select('*').eq('id', str(config_id)).execute()
            if result.data:
                return ResponseConfig(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching response config {config_id}: {e}")
            raise
    
    async def create_response_config(self, config: ResponseConfigCreate) -> ResponseConfig:
        """Create a new response config."""
        try:
            data = config.model_dump()
            data['project_id'] = str(data['project_id'])
            
            result = self.client.table('response_configs').insert(data).execute()
            return ResponseConfig(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating response config: {e}")
            raise
    
    async def update_response_config(self, config_id: UUID, config: ResponseConfigUpdate) -> ResponseConfig:
        """Update an existing response config."""
        try:
            data = config.model_dump(exclude_unset=True)
            result = self.client.table('response_configs').update(data).eq('id', str(config_id)).execute()
            return ResponseConfig(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating response config {config_id}: {e}")
            raise
    
    async def delete_response_config(self, config_id: UUID) -> bool:
        """Delete a response config."""
        try:
            self.client.table('response_configs').delete().eq('id', str(config_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting response config {config_id}: {e}")
            raise
    
    # ========================================================================
    # Tools
    # ========================================================================
    
    async def get_tools(self, project_id: Optional[UUID] = None) -> List[Tool]:
        """Get all tools, optionally filtered by project."""
        try:
            query = self.client.table('tools').select('*')
            if project_id:
                query = query.eq('project_id', str(project_id))
            
            result = query.execute()
            return [Tool(**tool) for tool in result.data]
        except Exception as e:
            logger.error(f"Error fetching tools: {e}")
            raise
    
    async def get_tool(self, tool_id: UUID) -> Optional[Tool]:
        """Get a single tool by ID."""
        try:
            result = self.client.table('tools').select('*').eq('id', str(tool_id)).execute()
            if result.data:
                return Tool(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching tool {tool_id}: {e}")
            raise
    
    async def create_tool(self, tool: ToolCreate) -> Tool:
        """Create a new tool."""
        try:
            data = tool.model_dump()
            data['project_id'] = str(data['project_id'])
            
            result = self.client.table('tools').insert(data).execute()
            return Tool(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating tool: {e}")
            raise
    
    async def update_tool(self, tool_id: UUID, tool: ToolUpdate) -> Tool:
        """Update an existing tool."""
        try:
            data = tool.model_dump(exclude_unset=True)
            if 'project_id' in data and data['project_id']:
                data['project_id'] = str(data['project_id'])
            
            result = self.client.table('tools').update(data).eq('id', str(tool_id)).execute()
            return Tool(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating tool {tool_id}: {e}")
            raise
    
    async def delete_tool(self, tool_id: UUID) -> bool:
        """Delete a tool."""
        try:
            self.client.table('tools').delete().eq('id', str(tool_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting tool {tool_id}: {e}")
            raise
    
    # ========================================================================
    # Prompts
    # ========================================================================
    
    async def get_prompts(self, project_id: Optional[UUID] = None) -> List[Prompt]:
        """Get all prompts, optionally filtered by project."""
        try:
            query = self.client.table('prompts').select('*')
            if project_id:
                query = query.eq('project_id', str(project_id))
            
            result = query.execute()
            return [Prompt(**prompt) for prompt in result.data]
        except Exception as e:
            logger.error(f"Error fetching prompts: {e}")
            raise
    
    async def get_prompt(self, prompt_id: UUID) -> Optional[Prompt]:
        """Get a single prompt by ID."""
        try:
            result = self.client.table('prompts').select('*').eq('id', str(prompt_id)).execute()
            if result.data:
                return Prompt(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching prompt {prompt_id}: {e}")
            raise
    
    async def create_prompt(self, prompt: PromptCreate) -> Prompt:
        """Create a new prompt."""
        try:
            data = prompt.model_dump()
            data['project_id'] = str(data['project_id'])
            
            result = self.client.table('prompts').insert(data).execute()
            return Prompt(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating prompt: {e}")
            raise
    
    async def update_prompt(self, prompt_id: UUID, prompt: PromptUpdate) -> Prompt:
        """Update an existing prompt."""
        try:
            data = prompt.model_dump(exclude_unset=True)
            if 'project_id' in data and data['project_id']:
                data['project_id'] = str(data['project_id'])
            
            result = self.client.table('prompts').update(data).eq('id', str(prompt_id)).execute()
            return Prompt(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating prompt {prompt_id}: {e}")
            raise
    
    async def delete_prompt(self, prompt_id: UUID) -> bool:
        """Delete a prompt."""
        try:
            self.client.table('prompts').delete().eq('id', str(prompt_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting prompt {prompt_id}: {e}")
            raise
    
    # ========================================================================
    # Flows
    # ========================================================================
    
    async def get_flows(self, project_id: Optional[UUID] = None) -> List[Flow]:
        """Get all flows, optionally filtered by project."""
        try:
            query = self.client.table('flows').select('*')
            if project_id:
                query = query.eq('project_id', str(project_id))
            
            result = query.execute()
            return [Flow(**flow) for flow in result.data]
        except Exception as e:
            logger.error(f"Error fetching flows: {e}")
            raise
    
    async def get_flow(self, flow_id: UUID) -> Optional[Flow]:
        """Get a single flow by ID."""
        try:
            result = self.client.table('flows').select('*').eq('id', str(flow_id)).execute()
            if result.data:
                return Flow(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching flow {flow_id}: {e}")
            raise
    
    async def create_flow(self, flow: FlowCreate) -> Flow:
        """Create a new flow."""
        try:
            data = flow.model_dump()
            data['project_id'] = str(data['project_id'])
            
            result = self.client.table('flows').insert(data).execute()
            return Flow(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating flow: {e}")
            raise
    
    async def update_flow(self, flow_id: UUID, flow: FlowUpdate) -> Flow:
        """Update an existing flow."""
        try:
            data = flow.model_dump(exclude_unset=True)
            if 'project_id' in data and data['project_id']:
                data['project_id'] = str(data['project_id'])
            
            result = self.client.table('flows').update(data).eq('id', str(flow_id)).execute()
            return Flow(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating flow {flow_id}: {e}")
            raise
    
    async def delete_flow(self, flow_id: UUID) -> bool:
        """Delete a flow."""
        try:
            self.client.table('flows').delete().eq('id', str(flow_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Error deleting flow {flow_id}: {e}")
            raise
    
    # ========================================================================
    # Numeric ID Lookups (Frontend Compatibility)
    # ========================================================================
    
    async def get_tool_by_numeric_id(self, numeric_id: int) -> Optional[Tool]:
        """Get a tool by its numeric_id."""
        try:
            result = self.client.table('tools').select('*').eq('numeric_id', numeric_id).execute()
            return Tool(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error fetching tool by numeric_id {numeric_id}: {e}")
            raise
    
    async def get_prompt_by_numeric_id(self, numeric_id: int) -> Optional[Prompt]:
        """Get a prompt by its numeric_id."""
        try:
            result = self.client.table('prompts').select('*').eq('numeric_id', numeric_id).execute()
            return Prompt(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error fetching prompt by numeric_id {numeric_id}: {e}")
            raise
    
    async def get_mcp_config_by_numeric_id(self, numeric_id: int) -> Optional[MCPConfig]:
        """Get an MCP config by its numeric_id."""
        try:
            result = self.client.table('mcp_configs').select('*').eq('numeric_id', numeric_id).execute()
            return MCPConfig(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error fetching MCP config by numeric_id {numeric_id}: {e}")
            raise
    
    async def get_response_config_by_numeric_id(self, numeric_id: int) -> Optional[ResponseConfig]:
        """Get a response config by its numeric_id."""
        try:
            result = self.client.table('response_configs').select('*').eq('numeric_id', numeric_id).execute()
            return ResponseConfig(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error fetching response config by numeric_id {numeric_id}: {e}")
            raise
    
    async def get_flow_by_numeric_id(self, numeric_id: int) -> Optional[Flow]:
        """Get a flow by its numeric_id."""
        try:
            result = self.client.table('flows').select('*').eq('numeric_id', numeric_id).execute()
            return Flow(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error fetching flow by numeric_id {numeric_id}: {e}")
            raise

