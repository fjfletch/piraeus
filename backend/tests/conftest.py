"""Pytest configuration and shared fixtures."""

import pytest
from fastapi.testclient import TestClient
from dynamic_tools.api.app import app


@pytest.fixture
def client():
    """FastAPI test client fixture.
    
    Returns:
        TestClient instance for testing endpoints
    """
    return TestClient(app)


@pytest.fixture
def mock_openai_response():
    """Mock OpenAI API response for testing.
    
    Returns:
        Dict representing a typical OpenAI response
    """
    return {
        "id": "resp_123",
        "object": "response",
        "created": 1234567890,
        "model": "gpt-4o-mini",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Test response"
                },
                "finish_reason": "stop"
            }
        ]
    }

