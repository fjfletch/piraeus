"""Factory for creating tools from configurations."""

from __future__ import annotations

from ..models.tool_config import ToolConfig
from .api_tool import GenericApiTool
from ..core.base import ToolDefinition
from ..core.registry import ToolRegistry
from loguru import logger


class ToolFactory:
    """Factory for creating tools from configuration."""
    
    @staticmethod
    def create_from_config(config: ToolConfig) -> GenericApiTool:
        """Create a GenericApiTool from configuration.
        
        Args:
            config: ToolConfig defining the tool
            
        Returns:
            GenericApiTool instance
        """
        logger.info(f"Creating tool from config: {config.name}")
        return GenericApiTool(config)
    
    @staticmethod
    def create_from_dict(config_dict: dict) -> GenericApiTool:
        """Create a tool from a dictionary configuration.
        
        Args:
            config_dict: Dictionary matching ToolConfig schema
            
        Returns:
            GenericApiTool instance
        """
        config = ToolConfig(**config_dict)
        return ToolFactory.create_from_config(config)
    
    @staticmethod
    def create_from_json_file(file_path: str) -> GenericApiTool:
        """Create a tool from a JSON configuration file.
        
        Args:
            file_path: Path to JSON config file
            
        Returns:
            GenericApiTool instance
        """
        import json
        with open(file_path, 'r') as f:
            config_dict = json.load(f)
        return ToolFactory.create_from_dict(config_dict)
    
    @staticmethod
    async def create_from_supabase(tool_version_id: str) -> GenericApiTool:
        """Create a tool from Supabase catalog.tool_versions table.
        
        Args:
            tool_version_id: UUID of the tool version in Supabase
            
        Returns:
            GenericApiTool instance
            
        Note:
            Requires Supabase MCP to be configured
        """
        # TODO: Implement Supabase lookup
        # This would query catalog.tool_versions and reconstruct ToolConfig
        raise NotImplementedError("Supabase lookup not yet implemented")
    
    @staticmethod
    def register_config_tool(
        registry: ToolRegistry,
        config: ToolConfig | dict | str
    ) -> None:
        """Create a tool from config and register it.
        
        Args:
            registry: ToolRegistry to register the tool with
            config: ToolConfig, dict, or path to JSON file
        """
        # Create the tool
        if isinstance(config, ToolConfig):
            tool = ToolFactory.create_from_config(config)
        elif isinstance(config, dict):
            tool = ToolFactory.create_from_dict(config)
        elif isinstance(config, str):
            tool = ToolFactory.create_from_json_file(config)
        else:
            raise ValueError(f"Unsupported config type: {type(config)}")
        
        # Register it
        registry.register(tool)
        logger.info(f"Registered config-based tool: {tool.name}")

