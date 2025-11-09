"""Integration tests for workflow endpoint."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from dynamic_tools.api.app import app
from dynamic_tools.core.registry import ToolRegistry
from dynamic_tools.core.base import BaseTool
from dynamic_tools.models.api_requests import PromptResponse
from dynamic_tools.models.http_spec import HTTPResponseSpec


# Test tool for integration tests
class IntegrationTestTool(BaseTool):
    """Test tool for integration testing."""
    
    def __init__(self, name: str):
        self._name = name
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def description(self) -> str:
        return f"Integration test tool: {self._name}"
    
    @property
    def input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Query parameter"}
            },
            "required": ["query"]
        }
    
    @property
    def output_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "result": {"type": "string"}
            }
        }
    
    async def execute(self, **kwargs):
        return {"result": "success"}


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def setup_test_tools():
    """Set up test tools in registry."""
    # This would normally be done through the tool registration endpoint
    # For now, we'll mock the services
    pass


class TestWorkflowEndpoint:
    """Integration tests for /workflow endpoint."""
    
    @patch('dynamic_tools.api.endpoints.ToolRegistry')
    @patch('dynamic_tools.api.endpoints.PromptService')
    @patch('dynamic_tools.api.endpoints.HTTPClientService')
    def test_workflow_endpoint_success_without_formatting(
        self,
        mock_http_client_class,
        mock_prompt_service_class,
        mock_registry_class,
        client
    ):
        """Test successful workflow execution without formatting."""
        # Set up mocks
        mock_registry = MagicMock()
        mock_tool = IntegrationTestTool("test_tool")
        mock_registry.get_multiple.return_value = ([mock_tool], [])
        mock_registry.get_definition.return_value = MagicMock(
            name="test_tool",
            description="Test tool",
            input_schema=mock_tool.input_schema,
            output_schema=mock_tool.output_schema
        )
        mock_registry_class.return_value = mock_registry
        
        mock_prompt_service = MagicMock()
        mock_prompt_service.prompt_mcp = AsyncMock(return_value=PromptResponse(
            content={
                "method": "GET",
                "url": "https://api.example.com/test",
                "query_params": {"q": "test"}
            },
            type="http_spec"
        ))
        mock_prompt_service_class.return_value = mock_prompt_service
        
        mock_http_client = MagicMock()
        mock_http_client.execute = AsyncMock(return_value=HTTPResponseSpec(
            status_code=200,
            body={"data": "test result"},
            execution_time_ms=150.0
        ))
        mock_http_client_class.return_value = mock_http_client
        
        # Make request
        response = client.post(
            "/workflow",
            json={
                "user_instructions": "Get test data",
                "tool_ids": ["test_tool"],
                "format_response": False
            }
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["selected_tool"] == "test_tool"
        assert data["http_spec"] is not None
        assert data["raw_response"] is not None
        assert data["formatted_response"] is None
    
    @patch('dynamic_tools.api.endpoints.ToolRegistry')
    @patch('dynamic_tools.api.endpoints.PromptService')
    @patch('dynamic_tools.api.endpoints.HTTPClientService')
    def test_workflow_endpoint_success_with_formatting(
        self,
        mock_http_client_class,
        mock_prompt_service_class,
        mock_registry_class,
        client
    ):
        """Test successful workflow execution with formatting."""
        # Set up mocks
        mock_registry = MagicMock()
        mock_tool = IntegrationTestTool("test_tool")
        mock_registry.get_multiple.return_value = ([mock_tool], [])
        mock_registry.get_definition.return_value = MagicMock(
            name="test_tool",
            description="Test tool",
            input_schema=mock_tool.input_schema,
            output_schema=mock_tool.output_schema
        )
        mock_registry_class.return_value = mock_registry
        
        mock_prompt_service = MagicMock()
        mock_prompt_service.prompt_mcp = AsyncMock(return_value=PromptResponse(
            content={
                "method": "GET",
                "url": "https://api.example.com/test",
                "query_params": {"q": "test"}
            },
            type="http_spec"
        ))
        mock_prompt_service.prompt_normal = AsyncMock(return_value=PromptResponse(
            content="This is a formatted response",
            type="text"
        ))
        mock_prompt_service_class.return_value = mock_prompt_service
        
        mock_http_client = MagicMock()
        mock_http_client.execute = AsyncMock(return_value=HTTPResponseSpec(
            status_code=200,
            body={"data": "test result"},
            execution_time_ms=150.0
        ))
        mock_http_client_class.return_value = mock_http_client
        
        # Make request
        response = client.post(
            "/workflow",
            json={
                "user_instructions": "Get test data",
                "tool_ids": ["test_tool"],
                "format_response": True,
                "response_format_instructions": "Keep it brief"
            }
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["formatted_response"] == "This is a formatted response"
    
    @patch('dynamic_tools.api.endpoints.ToolRegistry')
    def test_workflow_endpoint_missing_tools_error(
        self,
        mock_registry_class,
        client
    ):
        """Test workflow with missing tools."""
        # Set up mock to return missing tools
        mock_registry = MagicMock()
        mock_registry.get_multiple.return_value = ([], ["missing_tool"])
        mock_registry_class.return_value = mock_registry
        
        # Make request
        response = client.post(
            "/workflow",
            json={
                "user_instructions": "Get data",
                "tool_ids": ["missing_tool"],
                "format_response": False
            }
        )
        
        # Verify error response
        assert response.status_code == 200  # Still 200, but status="error"
        data = response.json()
        assert data["status"] == "error"
        assert data["error_stage"] == "tool_retrieval"
        assert "missing_tool" in data["error"]
    
    def test_workflow_endpoint_invalid_request(self, client):
        """Test workflow with invalid request data."""
        # Missing required fields
        response = client.post(
            "/workflow",
            json={
                "user_instructions": "Get data"
                # Missing tool_ids
            }
        )
        
        # Should return 422 validation error
        assert response.status_code == 422
    
    def test_workflow_endpoint_empty_tool_ids(self, client):
        """Test workflow with empty tool_ids list."""
        response = client.post(
            "/workflow",
            json={
                "user_instructions": "Get data",
                "tool_ids": []  # Empty list
            }
        )
        
        # Should return 422 validation error (min_length=1)
        assert response.status_code == 422
    
    @patch('dynamic_tools.api.endpoints.ToolRegistry')
    @patch('dynamic_tools.api.endpoints.PromptService')
    @patch('dynamic_tools.api.endpoints.HTTPClientService')
    def test_workflow_endpoint_multiple_tools(
        self,
        mock_http_client_class,
        mock_prompt_service_class,
        mock_registry_class,
        client
    ):
        """Test workflow with multiple tools available."""
        # Set up mocks with multiple tools
        mock_registry = MagicMock()
        tool1 = IntegrationTestTool("stock_api")
        tool2 = IntegrationTestTool("weather_api")
        mock_registry.get_multiple.return_value = ([tool1, tool2], [])
        
        def get_definition_side_effect(name):
            tool = tool1 if name == "stock_api" else tool2
            return MagicMock(
                name=name,
                description=tool.description,
                input_schema=tool.input_schema,
                output_schema=tool.output_schema
            )
        
        mock_registry.get_definition.side_effect = get_definition_side_effect
        mock_registry_class.return_value = mock_registry
        
        mock_prompt_service = MagicMock()
        mock_prompt_service.prompt_mcp = AsyncMock(return_value=PromptResponse(
            content={
                "method": "GET",
                "url": "https://api.example.com/stock/quote",
                "query_params": {"symbol": "AAPL"}
            },
            type="http_spec"
        ))
        mock_prompt_service_class.return_value = mock_prompt_service
        
        mock_http_client = MagicMock()
        mock_http_client.execute = AsyncMock(return_value=HTTPResponseSpec(
            status_code=200,
            body={"price": 150.25},
            execution_time_ms=200.0
        ))
        mock_http_client_class.return_value = mock_http_client
        
        # Make request
        response = client.post(
            "/workflow",
            json={
                "user_instructions": "Get stock price for AAPL",
                "tool_ids": ["stock_api", "weather_api"],
                "format_response": False
            }
        )
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        # Should select stock_api based on URL matching
        assert data["selected_tool"] == "stock_api"
