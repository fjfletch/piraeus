"""Tests for FastAPI endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from dynamic_tools.api.app import app
from dynamic_tools.models.api_requests import PromptRequest, PromptResponse, MCPPromptRequest, ExecuteRequest, ExecuteResponse
from dynamic_tools.models.http_spec import HTTPRequestSpec, HTTPResponseSpec


@pytest.fixture
def mock_prompt_service():
    """Mock PromptService for testing."""
    with patch('dynamic_tools.api.endpoints.PromptService') as mock:
        service_instance = AsyncMock()
        mock.return_value = service_instance
        yield service_instance


@pytest.fixture
def mock_http_client():
    """Mock HTTPClientService for testing."""
    with patch('dynamic_tools.api.endpoints.HTTPClientService') as mock:
        client_instance = AsyncMock()
        mock.return_value = client_instance
        yield client_instance


def test_prompt_endpoint_success(client, mock_prompt_service):
    """Test /prompt endpoint with valid request.
    
    Given: Valid PromptRequest
    When: Posting to /prompt
    Then: Should return PromptResponse with text content
    """
    # Mock the service response
    mock_prompt_service.prompt_normal.return_value = PromptResponse(
        content="This is a test response from the LLM",
        type="text"
    )
    
    request_data = {
        "instructions": "Explain what REST APIs are",
        "context": "The user is a beginner",
        "response_format_prompt": "Keep it simple"
    }
    
    response = client.post("/prompt", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "This is a test response from the LLM"
    assert data["type"] == "text"


def test_prompt_endpoint_missing_instructions(client):
    """Test /prompt endpoint with missing required field.
    
    Given: PromptRequest without instructions
    When: Posting to /prompt
    Then: Should return 422 validation error
    """
    request_data = {
        "context": "Some context"
    }
    
    response = client.post("/prompt", json=request_data)
    
    assert response.status_code == 422


def test_prompt_endpoint_empty_instructions(client):
    """Test /prompt endpoint with empty instructions.
    
    Given: PromptRequest with empty instructions
    When: Posting to /prompt
    Then: Should return 422 validation error
    """
    request_data = {
        "instructions": ""
    }
    
    response = client.post("/prompt", json=request_data)
    
    assert response.status_code == 422


def test_prompt_endpoint_service_failure(client, mock_prompt_service):
    """Test /prompt endpoint when service fails.
    
    Given: PromptService raises exception
    When: Posting to /prompt
    Then: Should return 500 error
    """
    mock_prompt_service.prompt_normal.side_effect = Exception("LLM API failure")
    
    request_data = {
        "instructions": "Test instruction"
    }
    
    response = client.post("/prompt", json=request_data)
    
    assert response.status_code == 500
    data = response.json()
    assert "detail" in data


def test_prompt_mcp_endpoint_success(client, mock_prompt_service):
    """Test /prompt-mcp endpoint with valid request.
    
    Given: Valid MCPPromptRequest
    When: Posting to /prompt-mcp
    Then: Should return PromptResponse with HTTP spec
    """
    # Mock the service response
    mock_prompt_service.prompt_mcp.return_value = PromptResponse(
        content={
            "method": "GET",
            "url": "https://api.example.com/users/123",
            "headers": None,
            "query_params": None,
            "body": None
        },
        type="http_spec"
    )
    
    request_data = {
        "instructions": "Get user with ID 123",
        "api_docs": "GET /users/{id} - Returns user data"
    }
    
    response = client.post("/prompt-mcp", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "http_spec"
    assert data["content"]["method"] == "GET"
    assert "api.example.com" in data["content"]["url"]


def test_prompt_mcp_endpoint_missing_api_docs(client):
    """Test /prompt-mcp endpoint without api_docs.
    
    Given: MCPPromptRequest without api_docs
    When: Posting to /prompt-mcp
    Then: Should return 422 validation error
    """
    request_data = {
        "instructions": "Get user data"
    }
    
    response = client.post("/prompt-mcp", json=request_data)
    
    assert response.status_code == 422


def test_execute_endpoint_success(client, mock_http_client):
    """Test /execute endpoint with valid HTTP spec.
    
    Given: Valid ExecuteRequest with HTTPRequestSpec
    When: Posting to /execute
    Then: Should return ExecuteResponse with success
    """
    # Mock the HTTP client response
    mock_http_client.execute.return_value = HTTPResponseSpec(
        status_code=200,
        headers={"Content-Type": "application/json"},
        body={"id": 123, "name": "John Doe"},
        execution_time_ms=250.5
    )
    
    request_data = {
        "http_spec": {
            "method": "GET",
            "url": "https://jsonplaceholder.typicode.com/users/1"
        }
    }
    
    response = client.post("/execute", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["status_code"] == 200
    assert data["data"]["body"]["id"] == 123
    assert data["data"]["body"]["name"] == "John Doe"


def test_execute_endpoint_http_error(client, mock_http_client):
    """Test /execute endpoint when HTTP request fails.
    
    Given: HTTP client raises exception
    When: Posting to /execute
    Then: Should return ExecuteResponse with error
    """
    mock_http_client.execute.side_effect = Exception("Network timeout")
    
    request_data = {
        "http_spec": {
            "method": "GET",
            "url": "https://api.example.com/users/1"
        }
    }
    
    response = client.post("/execute", json=request_data)
    
    assert response.status_code == 200  # Still 200, but status="error" in response
    data = response.json()
    assert data["status"] == "error"
    assert "timeout" in data["error"].lower()


def test_execute_endpoint_invalid_spec(client):
    """Test /execute endpoint with invalid HTTP spec.
    
    Given: ExecuteRequest with invalid HTTPRequestSpec
    When: Posting to /execute
    Then: Should return 422 validation error
    """
    request_data = {
        "http_spec": {
            "method": "INVALID_METHOD",
            "url": "not-a-valid-url"
        }
    }
    
    response = client.post("/execute", json=request_data)
    
    assert response.status_code == 422


def test_prompt_execute_endpoint_success(client, mock_prompt_service, mock_http_client):
    """Test /prompt-execute endpoint full flow.
    
    Given: Valid MCPPromptRequest
    When: Posting to /prompt-execute
    Then: Should generate HTTP spec and execute it
    """
    # Mock prompt service to return HTTP spec
    mock_prompt_service.prompt_mcp.return_value = PromptResponse(
        content={
            "method": "GET",
            "url": "https://jsonplaceholder.typicode.com/posts/1",
            "headers": None,
            "query_params": None,
            "body": None
        },
        type="http_spec"
    )
    
    # Mock HTTP client to return successful response
    mock_http_client.execute.return_value = HTTPResponseSpec(
        status_code=200,
        headers={"Content-Type": "application/json"},
        body={
            "userId": 1,
            "id": 1,
            "title": "Test post",
            "body": "Test content"
        },
        execution_time_ms=180.2
    )
    
    request_data = {
        "instructions": "Get the first post from JSONPlaceholder",
        "api_docs": "GET /posts/{id} - Returns post data"
    }
    
    response = client.post("/prompt-execute", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["status_code"] == 200
    assert data["data"]["body"]["id"] == 1
    assert data["data"]["body"]["title"] == "Test post"


def test_prompt_execute_endpoint_llm_failure(client, mock_prompt_service):
    """Test /prompt-execute when LLM fails.
    
    Given: PromptService raises exception
    When: Posting to /prompt-execute
    Then: Should return ExecuteResponse with error
    """
    mock_prompt_service.prompt_mcp.side_effect = Exception("OpenAI API error")
    
    request_data = {
        "instructions": "Get user data",
        "api_docs": "GET /users/{id}"
    }
    
    response = client.post("/prompt-execute", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert "api error" in data["error"].lower()


def test_prompt_execute_endpoint_http_failure(client, mock_prompt_service, mock_http_client):
    """Test /prompt-execute when HTTP execution fails.
    
    Given: HTTP spec generated but execution fails
    When: Posting to /prompt-execute
    Then: Should return ExecuteResponse with error
    """
    # Mock prompt service succeeds
    mock_prompt_service.prompt_mcp.return_value = PromptResponse(
        content={
            "method": "GET",
            "url": "https://api.example.com/users/1",
            "headers": None,
            "query_params": None,
            "body": None
        },
        type="http_spec"
    )
    
    # Mock HTTP client fails
    mock_http_client.execute.side_effect = Exception("Connection refused")
    
    request_data = {
        "instructions": "Get user data",
        "api_docs": "GET /users/{id}"
    }
    
    response = client.post("/prompt-execute", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert "connection" in data["error"].lower()


def test_all_endpoints_have_openapi_docs(client):
    """Test that all endpoints are documented in OpenAPI schema.
    
    Given: FastAPI application
    When: Getting /openapi.json
    Then: Should include all endpoint paths
    """
    response = client.get("/openapi.json")
    
    assert response.status_code == 200
    openapi = response.json()
    
    # Check that all required paths exist
    assert "/prompt" in openapi["paths"]
    assert "/prompt-mcp" in openapi["paths"]
    assert "/execute" in openapi["paths"]
    assert "/prompt-execute" in openapi["paths"]
    
    # Check that paths have POST methods
    assert "post" in openapi["paths"]["/prompt"]
    assert "post" in openapi["paths"]["/prompt-mcp"]
    assert "post" in openapi["paths"]["/execute"]
    assert "post" in openapi["paths"]["/prompt-execute"]


def test_endpoint_response_models(client):
    """Test that endpoints have proper response models in OpenAPI.
    
    Given: FastAPI application
    When: Getting /openapi.json
    Then: Should include response schemas
    """
    response = client.get("/openapi.json")
    
    assert response.status_code == 200
    openapi = response.json()
    
    # Check /prompt response schema
    prompt_responses = openapi["paths"]["/prompt"]["post"]["responses"]
    assert "200" in prompt_responses
    
    # Check /execute response schema
    execute_responses = openapi["paths"]["/execute"]["post"]["responses"]
    assert "200" in execute_responses


def test_health_endpoint_still_works(client):
    """Test that health endpoint from Phase 1 still works.
    
    Given: FastAPI application
    When: Getting /health
    Then: Should return healthy status
    """
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_root_endpoint_still_works(client):
    """Test that root endpoint from Phase 1 still works.
    
    Given: FastAPI application
    When: Getting /
    Then: Should return service info
    """
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert data["service"] == "LLM HTTP Service"


def test_prompt_endpoint_with_only_instructions(client, mock_prompt_service):
    """Test /prompt endpoint with minimal request.
    
    Given: PromptRequest with only instructions
    When: Posting to /prompt
    Then: Should work without optional fields
    """
    mock_prompt_service.prompt_normal.return_value = PromptResponse(
        content="Response text",
        type="text"
    )
    
    request_data = {
        "instructions": "Say hello"
    }
    
    response = client.post("/prompt", json=request_data)
    
    assert response.status_code == 200


def test_execute_endpoint_with_post_request(client, mock_http_client):
    """Test /execute endpoint with POST method.
    
    Given: ExecuteRequest with POST HTTPRequestSpec
    When: Posting to /execute
    Then: Should execute POST request successfully
    """
    mock_http_client.execute.return_value = HTTPResponseSpec(
        status_code=201,
        headers={"Content-Type": "application/json"},
        body={"id": 456, "created": True},
        execution_time_ms=320.1
    )
    
    request_data = {
        "http_spec": {
            "method": "POST",
            "url": "https://api.example.com/users",
            "headers": {"Content-Type": "application/json"},
            "body": {"name": "Jane Doe", "email": "jane@example.com"}
        }
    }
    
    response = client.post("/execute", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["status_code"] == 201
    assert data["data"]["body"]["id"] == 456
    assert data["data"]["body"]["created"] is True

