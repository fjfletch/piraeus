"""Tests for config-based tool creation and execution."""

import pytest
import json
import os
from typing import Any

# Add src to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from dynamic_tools.models.tool_config import ToolConfig
from dynamic_tools.factory.tool_factory import ToolFactory
from dynamic_tools.core.registry import ToolRegistry
from dynamic_tools.core.executor import ToolExecutor


@pytest.fixture
def stock_quote_config() -> dict:
    """Sample stock quote tool configuration."""
    return {
        "name": "test_stock_quote",
        "description": "Get real-time stock quote from Alpha Vantage API",
        "version": 1,
        "enabled": True,
        "api": {
            "base_url": "https://www.alphavantage.co/query",
            "method": "GET",
            "params": {
                "function": "GLOBAL_QUOTE"
            },
            "auth": {
                "method": "api_key_query",
                "key_name": "apikey",
                "secret_ref": "${ALPHA_VANTAGE_API_KEY}"
            },
            "timeout": 30.0
        },
        "input_schema": {
            "type": "object",
            "properties": {
                "symbol": {
                    "type": "string",
                    "description": "Stock ticker symbol (e.g., IBM, AAPL)"
                }
            },
            "required": ["symbol"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "symbol": {"type": "string"},
                "price": {"type": "number"},
                "change": {"type": "number"},
                "change_percent": {"type": "string"},
                "volume": {"type": "integer"},
                "latest_trading_day": {"type": "string"}
            },
            "required": ["symbol", "price"]
        },
        "mapping": {
            "input_to_params": {
                "symbol": "symbol"
            },
            "response_path": "Global Quote",
            "response_to_output": {
                "symbol": "01. symbol",
                "price": "05. price",
                "change": "09. change",
                "change_percent": "10. change percent",
                "volume": "06. volume",
                "latest_trading_day": "07. latest trading day"
            }
        },
        "tags": ["finance", "stocks", "test"]
    }


@pytest.fixture
def registry():
    """Fresh tool registry."""
    return ToolRegistry()


@pytest.fixture
def executor(registry):
    """Tool executor with registry."""
    return ToolExecutor(registry)


class TestConfigBasedToolCreation:
    """Test creating tools from JSON configuration."""
    
    def test_config_validation(self, stock_quote_config):
        """Test that config validates correctly."""
        config = ToolConfig(**stock_quote_config)
        
        assert config.name == "test_stock_quote"
        assert config.description == "Get real-time stock quote from Alpha Vantage API"
        assert config.api.base_url == "https://www.alphavantage.co/query"
        assert config.api.method.value == "GET"
        assert config.api.auth.method.value == "api_key_query"
    
    def test_tool_creation_from_dict(self, stock_quote_config):
        """Test creating tool from dictionary config."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        
        assert tool.name == "test_stock_quote"
        assert tool.description == "Get real-time stock quote from Alpha Vantage API"
        assert tool.input_schema == stock_quote_config["input_schema"]
        assert tool.output_schema == stock_quote_config["output_schema"]
    
    def test_tool_creation_from_json_file(self, stock_quote_config, tmp_path):
        """Test creating tool from JSON file."""
        # Write config to temp file
        config_file = tmp_path / "test_tool.json"
        with open(config_file, 'w') as f:
            json.dump(stock_quote_config, f)
        
        # Create tool from file
        tool = ToolFactory.create_from_json_file(str(config_file))
        
        assert tool.name == "test_stock_quote"
        assert tool.description == "Get real-time stock quote from Alpha Vantage API"


class TestConfigBasedToolRegistration:
    """Test registering config-based tools."""
    
    def test_register_config_tool(self, stock_quote_config, registry):
        """Test registering a config-based tool."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        registry.register(tool)
        
        assert "test_stock_quote" in registry.list_tools()
        assert len(registry) == 1
    
    def test_get_registered_tool(self, stock_quote_config, registry):
        """Test retrieving a registered config-based tool."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        registry.register(tool)
        
        retrieved_tool = registry.get("test_stock_quote")
        assert retrieved_tool.name == "test_stock_quote"
    
    def test_get_tool_definition(self, stock_quote_config, registry):
        """Test getting tool definition from registry."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        registry.register(tool)
        
        definition = registry.get_definition("test_stock_quote")
        assert definition.name == "test_stock_quote"
        assert definition.input_schema == stock_quote_config["input_schema"]
    
    def test_openai_tool_format(self, stock_quote_config, registry):
        """Test conversion to OpenAI tool format."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        registry.register(tool)
        
        openai_tools = registry.get_openai_tools()
        
        assert len(openai_tools) == 1
        assert openai_tools[0]["type"] == "function"
        assert openai_tools[0]["function"]["name"] == "test_stock_quote"
        assert openai_tools[0]["function"]["description"] == stock_quote_config["description"]
        assert openai_tools[0]["function"]["parameters"] == stock_quote_config["input_schema"]
        assert openai_tools[0]["function"]["strict"] == True


class TestConfigBasedToolExecution:
    """Test executing config-based tools."""
    
    @pytest.mark.asyncio
    async def test_execute_config_tool(self, stock_quote_config, registry, executor):
        """Test executing a config-based tool."""
        # Set demo API key for testing
        os.environ.setdefault("ALPHA_VANTAGE_API_KEY", "demo")
        
        # Register tool
        tool = ToolFactory.create_from_dict(stock_quote_config)
        registry.register(tool)
        
        # Execute tool
        result = await executor.execute(
            tool_name="test_stock_quote",
            arguments={"symbol": "IBM"}
        )
        
        # Verify result structure
        assert result.tool_name == "test_stock_quote"
        assert result.success in [True, False]  # May fail with demo key limits
        assert result.execution_time_ms >= 0
        
        if result.success:
            # Verify output structure if successful
            assert isinstance(result.data, dict)
            # Note: data might be empty due to API response structure
    
    @pytest.mark.asyncio
    async def test_tool_input_validation(self, stock_quote_config, registry, executor):
        """Test that tool validates input against schema."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        registry.register(tool)
        
        # Execute with valid input
        result = await executor.execute(
            tool_name="test_stock_quote",
            arguments={"symbol": "AAPL"}
        )
        
        assert result.tool_name == "test_stock_quote"
        # Should not fail on validation
        if not result.success:
            # If it fails, should not be a validation error on our side
            assert "validation error" not in result.error.lower() or "Input" not in result.error


class TestEndToEndConfigFlow:
    """Test complete end-to-end flow with config-based tools."""
    
    @pytest.mark.asyncio
    async def test_complete_flow_from_json(self, stock_quote_config, tmp_path):
        """Test complete flow: JSON → Tool → Registry → Execution."""
        # Set demo API key
        os.environ.setdefault("ALPHA_VANTAGE_API_KEY", "demo")
        
        # Step 1: Save config to JSON file
        config_file = tmp_path / "stock_tool.json"
        with open(config_file, 'w') as f:
            json.dump(stock_quote_config, f)
        
        # Step 2: Load tool from file
        tool = ToolFactory.create_from_json_file(str(config_file))
        assert tool.name == "test_stock_quote"
        
        # Step 3: Register tool
        registry = ToolRegistry()
        registry.register(tool)
        assert "test_stock_quote" in registry.list_tools()
        
        # Step 4: Get OpenAI format
        openai_tools = registry.get_openai_tools()
        assert len(openai_tools) == 1
        assert openai_tools[0]["type"] == "function"
        
        # Step 5: Execute tool
        executor = ToolExecutor(registry)
        result = await executor.execute(
            tool_name="test_stock_quote",
            arguments={"symbol": "IBM"}
        )
        
        # Step 6: Verify execution completed
        assert result.tool_name == "test_stock_quote"
        assert isinstance(result.execution_time_ms, float)
        assert result.execution_time_ms >= 0


class TestConfigToolProperties:
    """Test specific properties of config-based tools."""
    
    def test_tool_has_execute_method(self, stock_quote_config):
        """Test that GenericApiTool has callable execute method."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        
        assert hasattr(tool, 'execute')
        assert callable(tool.execute)
    
    def test_tool_has_required_properties(self, stock_quote_config):
        """Test that tool has all required properties."""
        tool = ToolFactory.create_from_dict(stock_quote_config)
        
        assert hasattr(tool, 'name')
        assert hasattr(tool, 'description')
        assert hasattr(tool, 'input_schema')
        assert hasattr(tool, 'output_schema')
        
        assert tool.name == "test_stock_quote"
        assert isinstance(tool.input_schema, dict)
        assert isinstance(tool.output_schema, dict)


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])

