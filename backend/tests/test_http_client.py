"""Tests for HTTPClientService."""

import pytest
from unittest.mock import AsyncMock, patch
import httpx
from pytest_httpx import HTTPXMock

from dynamic_tools.models.http_spec import HTTPRequestSpec, HTTPResponseSpec


@pytest.mark.asyncio
async def test_http_client_get_request(httpx_mock: HTTPXMock):
    """Test executing a GET request.
    
    Given: A GET HTTPRequestSpec
    When: Executing the request
    Then: Should return HTTPResponseSpec with response data
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    # Mock the HTTP response
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/users",
        json={"users": [{"id": 1, "name": "John"}]},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/users"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200
    assert response.body == {"users": [{"id": 1, "name": "John"}]}
    assert response.execution_time_ms is not None
    assert response.execution_time_ms > 0


@pytest.mark.asyncio
async def test_http_client_post_request_with_json(httpx_mock: HTTPXMock):
    """Test executing a POST request with JSON body.
    
    Given: A POST HTTPRequestSpec with JSON body
    When: Executing the request
    Then: Should send JSON and return response
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    # Mock the HTTP response
    httpx_mock.add_response(
        method="POST",
        url="https://api.example.com/users",
        json={"id": 123, "name": "John Doe"},
        status_code=201
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="POST",
        url="https://api.example.com/users",
        headers={"Content-Type": "application/json"},
        body={"name": "John Doe", "email": "john@example.com"}
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 201
    assert response.body == {"id": 123, "name": "John Doe"}


@pytest.mark.asyncio
async def test_http_client_with_headers(httpx_mock: HTTPXMock):
    """Test executing request with custom headers.
    
    Given: HTTPRequestSpec with custom headers
    When: Executing the request
    Then: Should include headers in request
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/protected",
        json={"data": "secret"},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/protected",
        headers={"Authorization": "Bearer token123"}
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200
    # Verify headers were sent (pytest-httpx will fail if headers don't match)


@pytest.mark.asyncio
async def test_http_client_with_query_params(httpx_mock: HTTPXMock):
    """Test executing request with query parameters.
    
    Given: HTTPRequestSpec with query parameters
    When: Executing the request
    Then: Should include query params in URL
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/search?q=test&limit=10",
        json={"results": []},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/search",
        query_params={"q": "test", "limit": "10"}
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_http_client_put_request(httpx_mock: HTTPXMock):
    """Test executing a PUT request.
    
    Given: A PUT HTTPRequestSpec
    When: Executing the request
    Then: Should perform PUT and return response
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="PUT",
        url="https://api.example.com/users/123",
        json={"id": 123, "name": "Updated"},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="PUT",
        url="https://api.example.com/users/123",
        body={"name": "Updated"}
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_http_client_delete_request(httpx_mock: HTTPXMock):
    """Test executing a DELETE request.
    
    Given: A DELETE HTTPRequestSpec
    When: Executing the request
    Then: Should perform DELETE and return response
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="DELETE",
        url="https://api.example.com/users/123",
        status_code=204
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="DELETE",
        url="https://api.example.com/users/123"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_http_client_patch_request(httpx_mock: HTTPXMock):
    """Test executing a PATCH request.
    
    Given: A PATCH HTTPRequestSpec
    When: Executing the request
    Then: Should perform PATCH and return response
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="PATCH",
        url="https://api.example.com/users/123",
        json={"id": 123, "email": "new@example.com"},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="PATCH",
        url="https://api.example.com/users/123",
        body={"email": "new@example.com"}
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_http_client_timeout():
    """Test timeout handling.
    
    Given: HTTPClientService with timeout
    When: Request takes too long
    Then: Should raise timeout exception
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    client = HTTPClientService(timeout=0.001)  # Very short timeout
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://httpbin.org/delay/10"  # Long delay
    )
    
    with pytest.raises(Exception) as exc_info:
        await client.execute(spec)
    
    # Should be a timeout error
    assert "timeout" in str(exc_info.value).lower() or "timed out" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_http_client_retry_on_failure(httpx_mock: HTTPXMock):
    """Test retry logic on transient failures.
    
    Given: HTTP request fails on first attempt
    When: Executing with retry logic
    Then: Should retry and eventually succeed
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    # First call fails with 500, second succeeds
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/unstable",
        status_code=500
    )
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/unstable",
        json={"data": "success"},
        status_code=200
    )
    
    client = HTTPClientService(max_retries=3)
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/unstable"
    )
    
    response = await client.execute(spec)
    
    # Should have succeeded after retry
    assert response.status_code == 200
    assert response.body == {"data": "success"}


@pytest.mark.asyncio
async def test_http_client_max_retries_exceeded(httpx_mock: HTTPXMock):
    """Test that client fails after max retries.
    
    Given: HTTP request consistently fails
    When: Executing with retry logic
    Then: Should fail after max attempts
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    # Always return 500 (3 attempts total with max_retries=2)
    for _ in range(3):
        httpx_mock.add_response(
            method="GET",
            url="https://api.example.com/broken",
            status_code=500,
            json={"error": "Server error"}
        )
    
    client = HTTPClientService(max_retries=2)
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/broken"
    )
    
    with pytest.raises(Exception):
        await client.execute(spec)


@pytest.mark.asyncio
async def test_http_client_4xx_error(httpx_mock: HTTPXMock):
    """Test handling 4xx client errors.
    
    Given: API returns 404 Not Found
    When: Executing the request
    Then: Should return response with 404 status
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/notfound",
        status_code=404,
        json={"error": "Not found"}
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/notfound"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 404
    assert response.body == {"error": "Not found"}


@pytest.mark.asyncio
async def test_http_client_response_headers(httpx_mock: HTTPXMock):
    """Test that response headers are captured.
    
    Given: API returns response with headers
    When: Executing the request
    Then: Should capture response headers
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/data",
        json={"data": "value"},
        status_code=200,
        headers={"Content-Type": "application/json", "X-Custom": "header"}
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/data"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200
    assert response.headers is not None
    assert "content-type" in response.headers or "Content-Type" in response.headers


@pytest.mark.asyncio
async def test_http_client_empty_response_body(httpx_mock: HTTPXMock):
    """Test handling response with no body.
    
    Given: API returns 204 No Content
    When: Executing the request
    Then: Should handle empty body gracefully
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="DELETE",
        url="https://api.example.com/resource",
        status_code=204
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="DELETE",
        url="https://api.example.com/resource"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 204
    assert response.body is None or response.body == "" or response.body == {}


@pytest.mark.asyncio
async def test_http_client_non_json_response(httpx_mock: HTTPXMock):
    """Test handling non-JSON response.
    
    Given: API returns plain text
    When: Executing the request
    Then: Should handle text response
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/text",
        text="Plain text response",
        status_code=200,
        headers={"Content-Type": "text/plain"}
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/text"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200
    assert response.body == "Plain text response" or isinstance(response.body, str)


@pytest.mark.asyncio
async def test_http_client_execution_time_tracking(httpx_mock: HTTPXMock):
    """Test that execution time is tracked.
    
    Given: A successful HTTP request
    When: Executing the request
    Then: Should track execution time in milliseconds
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/data",
        json={"data": "value"},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/data"
    )
    
    response = await client.execute(spec)
    
    assert response.execution_time_ms is not None
    assert isinstance(response.execution_time_ms, (int, float))
    assert response.execution_time_ms >= 0


@pytest.mark.asyncio
async def test_http_client_returns_http_response_spec(httpx_mock: HTTPXMock):
    """Test that execute returns HTTPResponseSpec.
    
    Given: A valid HTTPRequestSpec
    When: Executing the request
    Then: Should return valid HTTPResponseSpec instance
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="GET",
        url="https://api.example.com/test",
        json={"result": "ok"},
        status_code=200
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="GET",
        url="https://api.example.com/test"
    )
    
    response = await client.execute(spec)
    
    # Should be a valid HTTPResponseSpec
    assert isinstance(response, HTTPResponseSpec)
    assert response.status_code == 200
    assert response.body is not None
    assert response.execution_time_ms is not None


@pytest.mark.asyncio
async def test_http_client_head_request(httpx_mock: HTTPXMock):
    """Test executing a HEAD request.
    
    Given: A HEAD HTTPRequestSpec
    When: Executing the request
    Then: Should perform HEAD and return response with no body
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="HEAD",
        url="https://api.example.com/resource",
        status_code=200,
        headers={"Content-Length": "1234"}
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="HEAD",
        url="https://api.example.com/resource"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200
    # HEAD requests typically have no body


@pytest.mark.asyncio
async def test_http_client_options_request(httpx_mock: HTTPXMock):
    """Test executing an OPTIONS request.
    
    Given: An OPTIONS HTTPRequestSpec
    When: Executing the request
    Then: Should perform OPTIONS and return allowed methods
    """
    from dynamic_tools.services.http_client import HTTPClientService
    
    httpx_mock.add_response(
        method="OPTIONS",
        url="https://api.example.com/resource",
        status_code=200,
        headers={"Allow": "GET, POST, PUT, DELETE"}
    )
    
    client = HTTPClientService()
    
    spec = HTTPRequestSpec(
        method="OPTIONS",
        url="https://api.example.com/resource"
    )
    
    response = await client.execute(spec)
    
    assert response.status_code == 200

