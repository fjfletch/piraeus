"""Enums for dynamic tools."""

from enum import Enum


class AuthMethod(str, Enum):
    """Authentication methods for API tools."""
    NONE = "none"
    API_KEY_HEADER = "api_key_header"
    API_KEY_QUERY = "api_key_query"
    BEARER = "bearer"
    OAUTH2 = "oauth2"


class HttpMethod(str, Enum):
    """HTTP methods."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"

