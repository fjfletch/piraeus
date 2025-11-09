"""Configuration management for LLM HTTP Service.

This module uses pydantic-settings to provide type-safe configuration
management with environment variable loading and validation.
"""

from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.
    
    All settings can be configured via environment variables or .env file.
    Environment variables take precedence over .env file values.
    
    Attributes:
        app_name: Application name
        app_version: Application version
        debug: Enable debug mode
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        openai_api_key: OpenAI API key for LLM integration
        claude_api_key: Optional Claude API key for future integration
        http_timeout: Default HTTP request timeout in seconds
        http_max_retries: Maximum number of retry attempts for failed HTTP requests
        llm_max_retries: Maximum number of retry attempts for failed LLM calls
        llm_model: OpenAI model to use (e.g., gpt-4o-mini)
    """
    
    # Application settings
    app_name: str = Field(
        default="LLM HTTP Service",
        description="Application name"
    )
    app_version: str = Field(
        default="0.1.0",
        description="Application version"
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode"
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level"
    )
    
    # API Keys
    openai_api_key: Optional[str] = Field(
        default=None,
        alias="OPENAI-SECRET",
        description="OpenAI API key (optional)"
    )
    claude_api_key: Optional[str] = Field(
        default=None,
        alias="CLAUDE-SECRET",
        description="Claude API key (optional)"
    )
    
    # Supabase settings
    supabase_url: str = Field(
        ...,
        description="Supabase project URL (required)"
    )
    supabase_key: str = Field(
        ...,
        description="Supabase API key (required)"
    )
    
    # HTTP Client settings
    http_timeout: float = Field(
        default=30.0,
        ge=1.0,
        le=300.0,
        description="HTTP request timeout in seconds"
    )
    http_max_retries: int = Field(
        default=3,
        ge=0,
        le=10,
        description="Maximum HTTP retry attempts"
    )
    
    # LLM settings
    llm_max_retries: int = Field(
        default=3,
        ge=0,
        le=10,
        description="Maximum LLM retry attempts"
    )
    llm_model: str = Field(
        default="gpt-4o-mini",
        description="OpenAI model to use"
    )
    
    # Server settings
    host: str = Field(
        default="0.0.0.0",
        description="Server host"
    )
    port: int = Field(
        default=8000,
        ge=1,
        le=65535,
        description="Server port"
    )
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level is one of the allowed values."""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v_upper = v.upper()
        if v_upper not in allowed_levels:
            raise ValueError(f"log_level must be one of {allowed_levels}")
        return v_upper
    
    @field_validator("openai_api_key")
    @classmethod
    def validate_openai_key(cls, v: Optional[str]) -> Optional[str]:
        """Validate OpenAI API key format."""
        if v is None:
            return v
        if len(v) < 20:
            raise ValueError("openai_api_key must be a valid API key (at least 20 characters)")
        if not v.startswith("sk-"):
            raise ValueError("openai_api_key must start with 'sk-'")
        return v


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create the global settings instance.
    
    This function implements a singleton pattern to ensure
    settings are loaded only once and reused throughout the application.
    
    Returns:
        Settings instance with loaded configuration
    """
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Convenience function for testing
def reset_settings() -> None:
    """Reset the global settings instance.
    
    This is primarily useful for testing to ensure a clean state.
    """
    global _settings
    _settings = None


