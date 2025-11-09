"""Tests for PromptService."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from dynamic_tools.models.http_spec import HTTPRequestSpec
from dynamic_tools.models.api_requests import PromptRequest, MCPPromptRequest


@pytest.fixture
def mock_openai_client():
    """Mock AsyncOpenAI client."""
    return AsyncMock()


@pytest.fixture
def mock_orchestrator():
    """Mock AIOrchestrator."""
    return AsyncMock()


@pytest.mark.asyncio
async def test_prompt_service_initialization():
    """Test PromptService can be initialized.
    
    Given: Valid OpenAI API key
    When: Creating PromptService instance
    Then: Should initialize successfully with orchestrator
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client:
        service = PromptService(api_key="test-key")
        
        assert service is not None
        assert service.client is not None
        assert service.orchestrator is not None


@pytest.mark.asyncio
async def test_prompt_normal_mode_text_response():
    """Test normal mode prompt returns text response.
    
    Given: A normal PromptRequest
    When: Calling prompt() method
    Then: Should return PromptResponse with text content
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock chat completion response
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "REST APIs are interfaces that allow..."
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = PromptRequest(
            instructions="Explain what REST APIs are",
            context="The user is a beginner developer"
        )
        
        response = await service.prompt_normal(request)
        
        assert response.type == "text"
        assert isinstance(response.content, str)
        assert "REST APIs" in response.content


@pytest.mark.asyncio
async def test_prompt_mcp_mode_http_spec():
    """Test MCP mode prompt returns HTTPRequestSpec.
    
    Given: An MCPPromptRequest
    When: Calling prompt_mcp() method
    Then: Should return PromptResponse with http_spec content
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock responses.parse for structured output
        mock_http_spec = HTTPRequestSpec(
            method="GET",
            url="https://api.openweathermap.org/data/2.5/weather",
            query_params={"q": "New York", "appid": "test"}
        )
        mock_response = AsyncMock()
        mock_response.output_parsed = mock_http_spec
        mock_client.responses.parse = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = MCPPromptRequest(
            instructions="Get the current weather for New York",
            api_docs="OpenWeatherMap API: GET https://api.openweathermap.org/data/2.5/weather"
        )
        
        response = await service.prompt_mcp(request)
        
        assert response.type == "http_spec"
        assert isinstance(response.content, dict)
        assert response.content["method"] == "GET"
        assert "weather" in response.content["url"]


@pytest.mark.asyncio
async def test_prompt_with_single_stage():
    """Test single-stage prompting (instructions only).
    
    Given: PromptRequest with only instructions
    When: Calling prompt_normal()
    Then: Should build prompt with only instructions stage
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock chat completion
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "Hello world!"
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = PromptRequest(instructions="Say hello")
        
        response = await service.prompt_normal(request)
        
        assert response is not None
        assert mock_client.chat.completions.create.called


@pytest.mark.asyncio
async def test_prompt_with_two_stages():
    """Test two-stage prompting (instructions + context).
    
    Given: PromptRequest with instructions and context
    When: Calling prompt_normal()
    Then: Should build prompt combining both stages
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock chat completion
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "Python is a programming language..."
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = PromptRequest(
            instructions="Explain Python",
            context="For a beginner"
        )
        
        response = await service.prompt_normal(request)
        
        assert response is not None
        assert mock_client.chat.completions.create.called


@pytest.mark.asyncio
async def test_prompt_with_three_stages():
    """Test three-stage prompting (instructions + context + format).
    
    Given: PromptRequest with all fields
    When: Calling prompt_normal()
    Then: Should build prompt combining all three stages
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock chat completion
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "Short answer: Python is easy to learn."
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = PromptRequest(
            instructions="Explain Python",
            context="For a beginner",
            response_format_prompt="Keep it under 50 words"
        )
        
        response = await service.prompt_normal(request)
        
        assert response is not None
        assert mock_client.chat.completions.create.called


@pytest.mark.asyncio
async def test_prompt_service_retry_on_failure():
    """Test retry logic on LLM API failure.
    
    Given: LLM API fails on first attempt
    When: Calling prompt_normal()
    Then: Should retry and eventually succeed
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # First call fails, second succeeds
        mock_success_response = AsyncMock()
        mock_success_response.choices = [AsyncMock()]
        mock_success_response.choices[0].message.content = "Success response"
        
        mock_client.chat.completions.create = AsyncMock(
            side_effect=[Exception("API Error"), mock_success_response]
        )
        
        service = PromptService(api_key="test-key")
        
        request = PromptRequest(instructions="Test retry")
        
        response = await service.prompt_normal(request)
        
        # Should have succeeded after retry
        assert response.content == "Success response"
        assert mock_client.chat.completions.create.call_count == 2


@pytest.mark.asyncio
async def test_prompt_service_max_retries_exceeded():
    """Test that service fails after max retries.
    
    Given: LLM API consistently fails
    When: Calling prompt_normal()
    Then: Should raise exception after max retries
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Always fail
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("Persistent API Error")
        )
        
        service = PromptService(api_key="test-key", max_retries=2)
        
        request = PromptRequest(instructions="Test failure")
        
        with pytest.raises(Exception) as exc_info:
            await service.prompt_normal(request)
        
        assert "Persistent API Error" in str(exc_info.value)


@pytest.mark.asyncio
async def test_mcp_prompt_uses_structured_output():
    """Test MCP mode uses structured output with text_format.
    
    Given: MCPPromptRequest
    When: Calling prompt_mcp()
    Then: Should call responses.parse with text_format=HTTPRequestSpec
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock responses.parse
        mock_spec = HTTPRequestSpec(method="GET", url="https://api.example.com")
        mock_response = AsyncMock()
        mock_response.output_parsed = mock_spec
        mock_client.responses.parse = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = MCPPromptRequest(
            instructions="Get user data",
            api_docs="API: GET /users"
        )
        
        response = await service.prompt_mcp(request)
        
        # Verify responses.parse was called with text_format parameter
        assert mock_client.responses.parse.called
        call_kwargs = mock_client.responses.parse.call_args.kwargs
        assert 'text_format' in call_kwargs
        assert call_kwargs['text_format'] == HTTPRequestSpec


@pytest.mark.asyncio
async def test_prompt_templates_applied_correctly():
    """Test that prompt templates are applied for different modes.
    
    Given: Normal and MCP mode requests
    When: Processing prompts
    Then: Should use appropriate API methods
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock chat completion
        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "Response"
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        # Mock responses.parse
        mock_spec = HTTPRequestSpec(method="GET", url="https://test.com")
        mock_parse_response = AsyncMock()
        mock_parse_response.output_parsed = mock_spec
        mock_client.responses.parse = AsyncMock(return_value=mock_parse_response)
        
        service = PromptService(api_key="test-key")
        
        # Normal mode
        normal_request = PromptRequest(instructions="Test")
        await service.prompt_normal(normal_request)
        
        # Check that chat.completions.create was called
        assert mock_client.chat.completions.create.called
        
        # MCP mode
        mcp_request = MCPPromptRequest(
            instructions="Test",
            api_docs="API docs"
        )
        await service.prompt_mcp(mcp_request)
        
        assert mock_client.responses.parse.called


@pytest.mark.asyncio
async def test_prompt_service_handles_empty_response():
    """Test handling of empty response from LLM.
    
    Given: LLM returns empty string
    When: Calling prompt_normal()
    Then: Should handle gracefully or retry
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        service = PromptService(api_key="test-key")
        service.orchestrator.run = AsyncMock(return_value="")
        
        request = PromptRequest(instructions="Test")
        
        response = await service.prompt_normal(request)
        
        # Should still return a response, even if empty
        assert response is not None
        assert response.type == "text"


@pytest.mark.asyncio
async def test_mcp_response_serialization():
    """Test that MCP response properly serializes HTTPRequestSpec.
    
    Given: HTTPRequestSpec returned from responses.parse
    When: Creating PromptResponse
    Then: Should serialize spec to dict in content field
    """
    from dynamic_tools.services.prompt_service import PromptService
    
    with patch('src.services.prompt_service.AsyncOpenAI') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value = mock_client
        
        # Mock responses.parse
        mock_spec = HTTPRequestSpec(
            method="POST",
            url="https://api.example.com/data",
            headers={"Content-Type": "application/json"},
            body={"key": "value"}
        )
        mock_response = AsyncMock()
        mock_response.output_parsed = mock_spec
        mock_client.responses.parse = AsyncMock(return_value=mock_response)
        
        service = PromptService(api_key="test-key")
        
        request = MCPPromptRequest(
            instructions="Create data",
            api_docs="API: POST /data"
        )
        
        response = await service.prompt_mcp(request)
        
        # Response content should be a dict (serialized HTTPRequestSpec)
        assert isinstance(response.content, dict)
        assert response.content["method"] == "POST"
        assert response.content["url"] == "https://api.example.com/data"
        assert response.content["body"] == {"key": "value"}


def test_prompt_templates_module():
    """Test that prompt templates module works correctly.
    
    Given: PromptTemplates class
    When: Generating prompts for different modes
    Then: Should return appropriate templates
    """
    from src.services.prompt_templates import PromptTemplates
    
    # Test normal mode templates
    system, user = PromptTemplates.normal_mode_prompt(
        instructions="Test instruction",
        context="Test context"
    )
    assert "helpful" in system.lower()
    assert "Test instruction" in user
    assert "Test context" in user
    
    # Test MCP mode templates
    system, user = PromptTemplates.mcp_mode_prompt(
        instructions="Get data",
        api_docs="API: GET /data"
    )
    assert "HTTP request" in system
    assert "Get data" in user
    assert "API: GET /data" in user


def test_prompt_templates_build_user_prompt():
    """Test building multi-stage user prompts.
    
    Given: Different combinations of prompt stages
    When: Building user prompt
    Then: Should combine stages correctly
    """
    from src.services.prompt_templates import PromptTemplates
    
    # Single stage
    prompt = PromptTemplates.build_user_prompt(
        instructions="Do something"
    )
    assert "Do something" in prompt
    
    # Two stages
    prompt = PromptTemplates.build_user_prompt(
        instructions="Do something",
        context="With this context"
    )
    assert "Do something" in prompt
    assert "With this context" in prompt
    
    # Three stages
    prompt = PromptTemplates.build_user_prompt(
        instructions="Do something",
        api_docs="API documentation",
        response_format_prompt="Format like this"
    )
    assert "Do something" in prompt
    assert "API documentation" in prompt
    assert "Format like this" in prompt

