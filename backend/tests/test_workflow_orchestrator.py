"""Unit tests for WorkflowOrchestrator service."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from dynamic_tools.services.workflow_orchestrator import WorkflowOrchestrator
from dynamic_tools.core.registry import ToolRegistry
from dynamic_tools.core.base import BaseTool
from dynamic_tools.models.api_requests import WorkflowRequest, PromptResponse
from dynamic_tools.models.http_spec import HTTPRequestSpec, HTTPResponseSpec


# Test tool implementation
class MockTool(BaseTool):
    """Mock tool for testing."""
    
    def __init__(self, name: str, description: str = "Test tool"):
        self._name = name
        self._description = description
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def description(self) -> str:
        return self._description
    
    @property
    def input_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "param1": {"type": "string", "description": "Test parameter"}
            },
            "required": ["param1"]
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
def tool_registry():
    """Create a tool registry with test tools."""
    registry = ToolRegistry()
    registry.register(MockTool("stock_quote", "Get stock quotes"))
    registry.register(MockTool("weather_api", "Get weather data"))
    return registry


@pytest.fixture
def mock_prompt_service():
    """Create a mock prompt service."""
    service = MagicMock()
    
    # Mock MCP response
    service.prompt_mcp = AsyncMock(return_value=PromptResponse(
        content={
            "method": "GET",
            "url": "https://api.example.com/stock/quote",
            "query_params": {"symbol": "AAPL"}
        },
        type="http_spec"
    ))
    
    # Mock normal response
    service.prompt_normal = AsyncMock(return_value=PromptResponse(
        content="Formatted response text",
        type="text"
    ))
    
    return service


@pytest.fixture
def mock_http_client():
    """Create a mock HTTP client."""
    client = MagicMock()
    client.execute = AsyncMock(return_value=HTTPResponseSpec(
        status_code=200,
        body={"data": "test"},
        execution_time_ms=100.0
    ))
    return client


@pytest.fixture
def orchestrator(tool_registry, mock_prompt_service, mock_http_client):
    """Create a WorkflowOrchestrator with mocked dependencies."""
    return WorkflowOrchestrator(
        tool_registry=tool_registry,
        prompt_service=mock_prompt_service,
        http_client=mock_http_client
    )


class TestRetrieveTools:
    """Tests for _retrieve_tools method."""
    
    def test_retrieve_existing_tools(self, orchestrator):
        """Test retrieving tools that exist in registry."""
        found, missing = orchestrator._retrieve_tools(["stock_quote", "weather_api"])
        
        assert len(found) == 2
        assert len(missing) == 0
        assert found[0].name in ["stock_quote", "weather_api"]
    
    def test_retrieve_with_missing_tools(self, orchestrator):
        """Test retrieving with some missing tools."""
        found, missing = orchestrator._retrieve_tools(["stock_quote", "missing_tool"])
        
        assert len(found) == 1
        assert len(missing) == 1
        assert "missing_tool" in missing
        assert found[0].name == "stock_quote"
    
    def test_retrieve_all_missing(self, orchestrator):
        """Test retrieving when all tools are missing."""
        found, missing = orchestrator._retrieve_tools(["missing1", "missing2"])
        
        assert len(found) == 0
        assert len(missing) == 2
        assert "missing1" in missing
        assert "missing2" in missing
    
    def test_retrieve_empty_list(self, orchestrator):
        """Test retrieving with empty tool list."""
        found, missing = orchestrator._retrieve_tools([])
        
        assert len(found) == 0
        assert len(missing) == 0


class TestFormatToolsAsContext:
    """Tests for _format_tools_as_context method."""
    
    def test_format_single_tool(self, orchestrator, tool_registry):
        """Test formatting a single tool."""
        tools = [tool_registry.get("stock_quote")]
        context = orchestrator._format_tools_as_context(tools)
        
        assert "stock_quote" in context
        assert "Get stock quotes" in context
        assert "param1" in context
        assert "required" in context.lower()
    
    def test_format_multiple_tools(self, orchestrator, tool_registry):
        """Test formatting multiple tools."""
        tools = [
            tool_registry.get("stock_quote"),
            tool_registry.get("weather_api")
        ]
        context = orchestrator._format_tools_as_context(tools)
        
        assert "stock_quote" in context
        assert "weather_api" in context
        assert context.count("Tool:") == 2
    
    def test_format_empty_list(self, orchestrator):
        """Test formatting empty tool list."""
        context = orchestrator._format_tools_as_context([])
        
        assert "No tools available" in context


class TestExtractToolNameFromSpec:
    """Tests for _extract_tool_name_from_spec method."""
    
    def test_extract_via_url_keyword(self, orchestrator, tool_registry):
        """Test extracting tool name via URL keyword match."""
        http_spec = HTTPRequestSpec(
            method="GET",
            url="https://api.example.com/stock/data"
        )
        tools = [
            tool_registry.get("stock_quote"),
            tool_registry.get("weather_api")
        ]
        
        tool_name = orchestrator._extract_tool_name_from_spec(http_spec, tools)
        assert tool_name == "stock_quote"
    
    def test_extract_single_tool(self, orchestrator, tool_registry):
        """Test extracting when only one tool available."""
        http_spec = HTTPRequestSpec(
            method="GET",
            url="https://api.example.com/data"
        )
        tools = [tool_registry.get("stock_quote")]
        
        tool_name = orchestrator._extract_tool_name_from_spec(http_spec, tools)
        assert tool_name == "stock_quote"
    
    def test_extract_empty_tools(self, orchestrator):
        """Test extracting with no tools."""
        http_spec = HTTPRequestSpec(
            method="GET",
            url="https://api.example.com/data"
        )
        
        tool_name = orchestrator._extract_tool_name_from_spec(http_spec, [])
        assert tool_name == "unknown"


class TestExecuteWorkflow:
    """Tests for execute_workflow method."""
    
    @pytest.mark.asyncio
    async def test_successful_workflow_without_formatting(self, orchestrator):
        """Test successful workflow execution without response formatting."""
        request = WorkflowRequest(
            user_instructions="Get stock price for AAPL",
            tool_ids=["stock_quote"],
            format_response=False
        )
        
        response = await orchestrator.execute_workflow(request)
        
        assert response.status == "success"
        assert response.selected_tool == "stock_quote"
        assert response.http_spec is not None
        assert response.raw_response is not None
        assert response.formatted_response is None
        assert response.error is None
    
    @pytest.mark.asyncio
    async def test_successful_workflow_with_formatting(self, orchestrator):
        """Test successful workflow execution with response formatting."""
        request = WorkflowRequest(
            user_instructions="Get stock price for AAPL",
            tool_ids=["stock_quote"],
            format_response=True,
            response_format_instructions="Keep it brief"
        )
        
        response = await orchestrator.execute_workflow(request)
        
        assert response.status == "success"
        assert response.formatted_response is not None
        assert response.formatted_response == "Formatted response text"
    
    @pytest.mark.asyncio
    async def test_workflow_missing_tools_error(self, orchestrator):
        """Test workflow with missing tools."""
        request = WorkflowRequest(
            user_instructions="Get data",
            tool_ids=["missing_tool"],
            format_response=False
        )
        
        response = await orchestrator.execute_workflow(request)
        
        assert response.status == "error"
        assert response.error_stage == "tool_retrieval"
        assert "missing_tool" in response.error
    
    @pytest.mark.asyncio
    async def test_workflow_llm_error(self, orchestrator, mock_prompt_service):
        """Test workflow with LLM error."""
        mock_prompt_service.prompt_mcp = AsyncMock(
            side_effect=Exception("LLM API error")
        )
        
        request = WorkflowRequest(
            user_instructions="Get stock price",
            tool_ids=["stock_quote"],
            format_response=False
        )
        
        response = await orchestrator.execute_workflow(request)
        
        assert response.status == "error"
        assert response.error_stage == "llm_selection"
        assert "error" in response.error.lower()
    
    @pytest.mark.asyncio
    async def test_workflow_api_execution_error(self, orchestrator, mock_http_client):
        """Test workflow with API execution error."""
        mock_http_client.execute = AsyncMock(
            side_effect=Exception("API connection failed")
        )
        
        request = WorkflowRequest(
            user_instructions="Get stock price",
            tool_ids=["stock_quote"],
            format_response=False
        )
        
        response = await orchestrator.execute_workflow(request)
        
        assert response.status == "error"
        assert response.error_stage == "api_execution"
    
    @pytest.mark.asyncio
    async def test_workflow_formatting_error_non_fatal(self, orchestrator, mock_prompt_service):
        """Test that formatting errors don't fail the whole workflow."""
        # Make formatting fail but MCP succeed
        mock_prompt_service.prompt_normal = AsyncMock(
            side_effect=Exception("Formatting failed")
        )
        
        request = WorkflowRequest(
            user_instructions="Get stock price",
            tool_ids=["stock_quote"],
            format_response=True
        )
        
        response = await orchestrator.execute_workflow(request)
        
        # Should still succeed with raw response
        assert response.status == "success"
        assert response.raw_response is not None
        assert response.formatted_response is None  # Formatting failed
