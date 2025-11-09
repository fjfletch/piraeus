"""Tests for SimpleToolExecutor and SimpleToolSpec."""

import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch

from dynamic_tools.models.simple_tool import SimpleToolSpec
from dynamic_tools.models.http_spec import HTTPRequestSpec, HTTPResponseSpec
from dynamic_tools.services.simple_tool_executor import SimpleToolExecutor


class TestSimpleToolSpec:
    """Tests for SimpleToolSpec model validation."""
    
    def test_simple_tool_spec_minimal(self):
        """Test creating SimpleToolSpec with minimal required fields."""
        spec = SimpleToolSpec(url="https://api.example.com/endpoint")
        
        assert spec.url == "https://api.example.com/endpoint"
        assert spec.method == "GET"
        assert spec.headers is None
        assert spec.api_key is None
        assert spec.api_key_header == "Authorization"
        assert spec.type == "api"
    
    def test_simple_tool_spec_full(self):
        """Test creating SimpleToolSpec with all fields."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="POST",
            headers={"Accept": "application/json", "User-Agent": "MyApp/1.0"},
            api_key="sk-12345",
            api_key_header="X-API-Key",
            type="api"
        )
        
        assert spec.url == "https://api.example.com/users"
        assert spec.method == "POST"
        assert spec.headers == {"Accept": "application/json", "User-Agent": "MyApp/1.0"}
        assert spec.api_key == "sk-12345"
        assert spec.api_key_header == "X-API-Key"
        assert spec.type == "api"
    
    def test_simple_tool_spec_all_methods(self):
        """Test SimpleToolSpec accepts all HTTP methods."""
        methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]
        
        for method in methods:
            spec = SimpleToolSpec(
                url="https://api.example.com/endpoint",
                method=method
            )
            assert spec.method == method
    
    def test_simple_tool_spec_invalid_method(self):
        """Test SimpleToolSpec rejects invalid HTTP methods."""
        with pytest.raises(Exception):  # Pydantic validation error
            SimpleToolSpec(
                url="https://api.example.com/endpoint",
                method="INVALID"
            )
    
    def test_simple_tool_spec_missing_url(self):
        """Test SimpleToolSpec requires URL."""
        with pytest.raises(Exception):  # Pydantic validation error
            SimpleToolSpec()
    
    def test_simple_tool_spec_to_json(self):
        """Test SimpleToolSpec can be serialized to JSON."""
        spec = SimpleToolSpec(
            url="https://api.example.com/endpoint",
            method="GET",
            api_key="sk-12345"
        )
        
        json_str = spec.model_dump_json()
        assert json_str
        
        data = json.loads(json_str)
        assert data["url"] == "https://api.example.com/endpoint"
        assert data["method"] == "GET"
        assert data["api_key"] == "sk-12345"


class TestSimpleToolExecutorBuildHeaders:
    """Tests for header building logic."""
    
    def test_build_headers_no_headers_no_api_key(self):
        """Test building headers when spec has neither headers nor api_key."""
        spec = SimpleToolSpec(url="https://api.example.com/endpoint")
        executor = SimpleToolExecutor()
        
        headers = executor._build_headers(spec)
        
        assert headers is None
    
    def test_build_headers_with_static_headers(self):
        """Test building headers with static headers from spec."""
        spec = SimpleToolSpec(
            url="https://api.example.com/endpoint",
            headers={"Accept": "application/json", "User-Agent": "MyApp/1.0"}
        )
        executor = SimpleToolExecutor()
        
        headers = executor._build_headers(spec)
        
        assert headers == {"Accept": "application/json", "User-Agent": "MyApp/1.0"}
    
    def test_build_headers_with_api_key(self):
        """Test building headers with API key injection."""
        spec = SimpleToolSpec(
            url="https://api.example.com/endpoint",
            api_key="sk-12345",
            api_key_header="Authorization"
        )
        executor = SimpleToolExecutor()
        
        headers = executor._build_headers(spec)
        
        assert headers == {"Authorization": "sk-12345"}
    
    def test_build_headers_with_static_headers_and_api_key(self):
        """Test building headers merging static headers and api_key."""
        spec = SimpleToolSpec(
            url="https://api.example.com/endpoint",
            headers={"Accept": "application/json"},
            api_key="sk-12345",
            api_key_header="X-API-Key"
        )
        executor = SimpleToolExecutor()
        
        headers = executor._build_headers(spec)
        
        assert headers == {"Accept": "application/json", "X-API-Key": "sk-12345"}
    
    def test_build_headers_custom_api_key_header(self):
        """Test building headers with custom api_key_header name."""
        spec = SimpleToolSpec(
            url="https://api.example.com/endpoint",
            api_key="my-secret-key",
            api_key_header="X-Custom-Auth"
        )
        executor = SimpleToolExecutor()
        
        headers = executor._build_headers(spec)
        
        assert headers == {"X-Custom-Auth": "my-secret-key"}


class TestSimpleToolExecutorBuildHttpSpec:
    """Tests for HTTPRequestSpec building logic."""
    
    def test_build_http_spec_get_with_params(self):
        """Test building HTTPRequestSpec for GET with query parameters."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="GET"
        )
        executor = SimpleToolExecutor()
        
        http_spec = executor._build_http_spec(spec, {"page": 1, "limit": 10})
        
        assert http_spec.method == "GET"
        assert http_spec.url == "https://api.example.com/users"
        assert http_spec.query_params == {"page": "1", "limit": "10"}
        assert http_spec.body is None
    
    def test_build_http_spec_post_with_body(self):
        """Test building HTTPRequestSpec for POST with body."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="POST"
        )
        executor = SimpleToolExecutor()
        
        params = {"name": "John", "email": "john@example.com"}
        http_spec = executor._build_http_spec(spec, params)
        
        assert http_spec.method == "POST"
        assert http_spec.url == "https://api.example.com/users"
        assert http_spec.query_params is None
        assert http_spec.body == params
    
    def test_build_http_spec_put_with_body(self):
        """Test building HTTPRequestSpec for PUT with body."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users/123",
            method="PUT"
        )
        executor = SimpleToolExecutor()
        
        params = {"name": "Jane"}
        http_spec = executor._build_http_spec(spec, params)
        
        assert http_spec.method == "PUT"
        assert http_spec.body == params
    
    def test_build_http_spec_delete(self):
        """Test building HTTPRequestSpec for DELETE."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users/123",
            method="DELETE"
        )
        executor = SimpleToolExecutor()
        
        http_spec = executor._build_http_spec(spec, {})
        
        assert http_spec.method == "DELETE"
        assert http_spec.query_params is None
        assert http_spec.body is None
    
    def test_build_http_spec_patch(self):
        """Test building HTTPRequestSpec for PATCH."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users/123",
            method="PATCH"
        )
        executor = SimpleToolExecutor()
        
        params = {"status": "active"}
        http_spec = executor._build_http_spec(spec, params)
        
        assert http_spec.method == "PATCH"
        assert http_spec.body == params
    
    def test_build_http_spec_head(self):
        """Test building HTTPRequestSpec for HEAD."""
        spec = SimpleToolSpec(
            url="https://api.example.com/status",
            method="HEAD"
        )
        executor = SimpleToolExecutor()
        
        http_spec = executor._build_http_spec(spec, {})
        
        assert http_spec.method == "HEAD"
        assert http_spec.query_params is None
        assert http_spec.body is None
    
    def test_build_http_spec_with_headers_and_api_key(self):
        """Test building HTTPRequestSpec with headers and API key."""
        spec = SimpleToolSpec(
            url="https://api.example.com/data",
            method="GET",
            headers={"Accept": "application/json"},
            api_key="sk-12345",
            api_key_header="Authorization"
        )
        executor = SimpleToolExecutor()
        
        http_spec = executor._build_http_spec(spec, {"query": "test"})
        
        assert http_spec.headers == {"Accept": "application/json", "Authorization": "sk-12345"}
        assert http_spec.query_params == {"query": "test"}
    
    def test_build_http_spec_no_params(self):
        """Test building HTTPRequestSpec with empty parameters."""
        spec = SimpleToolSpec(
            url="https://api.example.com/status",
            method="GET"
        )
        executor = SimpleToolExecutor()
        
        http_spec = executor._build_http_spec(spec, {})
        
        assert http_spec.query_params is None
        assert http_spec.body is None


class TestSimpleToolExecutorConvertParams:
    """Tests for parameter type conversion."""
    
    def test_convert_params_to_strings_mixed_types(self):
        """Test converting mixed parameter types to strings."""
        params = {"page": 1, "limit": 10, "active": True, "name": "John"}
        
        result = SimpleToolExecutor._convert_params_to_strings(params)
        
        assert result == {"page": "1", "limit": "10", "active": "True", "name": "John"}
    
    def test_convert_params_to_strings_empty(self):
        """Test converting empty parameters."""
        params = {}
        
        result = SimpleToolExecutor._convert_params_to_strings(params)
        
        assert result == {}
    
    def test_convert_params_to_strings_none_values(self):
        """Test converting parameters with None values."""
        params = {"page": 1, "name": None}
        
        result = SimpleToolExecutor._convert_params_to_strings(params)
        
        assert result == {"page": "1", "name": "None"}


class TestSimpleToolExecutorSanitize:
    """Tests for parameter sanitization (logging safety)."""
    
    def test_sanitize_parameters_mask_sensitive(self):
        """Test that sensitive parameters are masked."""
        params = {
            "username": "john",
            "password": "secret123",
            "api_key": "sk-12345",
            "token": "abc123"
        }
        
        result = SimpleToolExecutor._sanitize_parameters(params)
        
        assert result["username"] == "john"
        assert result["password"] == "***REDACTED***"
        assert result["api_key"] == "***REDACTED***"
        assert result["token"] == "***REDACTED***"
    
    def test_sanitize_parameters_case_insensitive(self):
        """Test that sensitive parameter detection is case-insensitive."""
        params = {
            "PASSWORD": "secret123",
            "Api_Key": "sk-12345",
            "TOKEN": "abc123"
        }
        
        result = SimpleToolExecutor._sanitize_parameters(params)
        
        assert result["PASSWORD"] == "***REDACTED***"
        assert result["Api_Key"] == "***REDACTED***"
        assert result["TOKEN"] == "***REDACTED***"


class TestSimpleToolExecutorExecute:
    """Tests for the main execute method."""
    
    @pytest.mark.asyncio
    async def test_execute_success(self):
        """Test successful execution of a simple tool."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="GET"
        )
        executor = SimpleToolExecutor()
        
        # Mock HTTPClientService.execute()
        mock_response = HTTPResponseSpec(
            status_code=200,
            headers={"Content-Type": "application/json"},
            body={"users": []},
            execution_time_ms=125.5
        )
        
        with patch.object(executor.http_client, 'execute', return_value=mock_response):
            result = await executor.execute(spec, {"page": 1})
        
        assert result.status_code == 200
        assert result.body == {"users": []}
        assert result.execution_time_ms == 125.5
    
    @pytest.mark.asyncio
    async def test_execute_with_api_key(self):
        """Test execution with API key injection."""
        spec = SimpleToolSpec(
            url="https://api.example.com/data",
            method="GET",
            api_key="sk-12345",
            api_key_header="X-API-Key"
        )
        executor = SimpleToolExecutor()
        
        mock_response = HTTPResponseSpec(
            status_code=200,
            headers={"Content-Type": "application/json"},
            body={"data": "test"},
            execution_time_ms=100.0
        )
        
        with patch.object(executor.http_client, 'execute', return_value=mock_response) as mock_execute:
            result = await executor.execute(spec, {})
        
        # Verify that HTTPClientService.execute was called
        mock_execute.assert_called_once()
        
        # Verify the HTTPRequestSpec passed to HTTPClientService had the api_key injected
        call_args = mock_execute.call_args
        http_spec = call_args[0][0]
        assert http_spec.headers == {"X-API-Key": "sk-12345"}
    
    @pytest.mark.asyncio
    async def test_execute_post_with_body(self):
        """Test execution of POST request with body parameters."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="POST"
        )
        executor = SimpleToolExecutor()
        
        mock_response = HTTPResponseSpec(
            status_code=201,
            headers={"Content-Type": "application/json"},
            body={"id": 123, "name": "John"},
            execution_time_ms=200.0
        )
        
        params = {"name": "John", "email": "john@example.com"}
        
        with patch.object(executor.http_client, 'execute', return_value=mock_response) as mock_execute:
            result = await executor.execute(spec, params)
        
        # Verify the HTTPRequestSpec had params in body, not query_params
        call_args = mock_execute.call_args
        http_spec = call_args[0][0]
        assert http_spec.body == params
        assert http_spec.query_params is None
    
    @pytest.mark.asyncio
    async def test_execute_get_with_query_params(self):
        """Test execution of GET request with query parameters."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="GET"
        )
        executor = SimpleToolExecutor()
        
        mock_response = HTTPResponseSpec(
            status_code=200,
            headers={"Content-Type": "application/json"},
            body={"users": []},
            execution_time_ms=150.0
        )
        
        params = {"page": 1, "limit": 10}
        
        with patch.object(executor.http_client, 'execute', return_value=mock_response) as mock_execute:
            result = await executor.execute(spec, params)
        
        # Verify the HTTPRequestSpec had params in query_params, not body
        call_args = mock_execute.call_args
        http_spec = call_args[0][0]
        assert http_spec.query_params == {"page": "1", "limit": "10"}
        assert http_spec.body is None
    
    @pytest.mark.asyncio
    async def test_execute_error_handling(self):
        """Test that execute properly handles and propagates errors."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="GET"
        )
        executor = SimpleToolExecutor()
        
        # Mock HTTPClientService.execute() to raise an exception
        with patch.object(executor.http_client, 'execute', side_effect=Exception("Connection failed")):
            with pytest.raises(Exception) as exc_info:
                await executor.execute(spec, {})
        
        assert "Connection failed" in str(exc_info.value)


class TestIntegration:
    """Integration tests for SimpleToolSpec and SimpleToolExecutor together."""
    
    def test_simple_tool_spec_to_executor_workflow(self):
        """Test the full workflow from spec creation to executor initialization."""
        spec = SimpleToolSpec(
            url="https://api.example.com/data",
            method="POST",
            headers={"Accept": "application/json"},
            api_key="sk-12345",
            api_key_header="Authorization"
        )
        
        executor = SimpleToolExecutor()
        
        # Verify spec and executor are properly initialized
        assert spec.url == "https://api.example.com/data"
        assert executor is not None
        assert executor.http_client is not None
    
    @pytest.mark.asyncio
    async def test_end_to_end_get_request(self):
        """Test end-to-end GET request workflow."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="GET"
        )
        executor = SimpleToolExecutor()
        
        mock_response = HTTPResponseSpec(
            status_code=200,
            headers={"Content-Type": "application/json"},
            body={"count": 42, "users": []},
            execution_time_ms=123.45
        )
        
        with patch.object(executor.http_client, 'execute', return_value=mock_response):
            result = await executor.execute(spec, {"page": 1, "limit": 20})
        
        assert result.status_code == 200
        assert result.body["count"] == 42
        assert result.execution_time_ms == 123.45
    
    @pytest.mark.asyncio
    async def test_end_to_end_post_request(self):
        """Test end-to-end POST request workflow."""
        spec = SimpleToolSpec(
            url="https://api.example.com/users",
            method="POST",
            headers={"Content-Type": "application/json"}
        )
        executor = SimpleToolExecutor()
        
        mock_response = HTTPResponseSpec(
            status_code=201,
            headers={"Content-Type": "application/json", "Location": "/users/123"},
            body={"id": 123, "name": "Alice", "created": True},
            execution_time_ms=234.56
        )
        
        params = {"name": "Alice", "email": "alice@example.com"}
        
        with patch.object(executor.http_client, 'execute', return_value=mock_response):
            result = await executor.execute(spec, params)
        
        assert result.status_code == 201
        assert result.body["id"] == 123
        assert result.headers["Location"] == "/users/123"

