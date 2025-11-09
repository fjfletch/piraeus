"""Utility functions."""

from __future__ import annotations

import functools
from typing import Any, Callable, TypeVar
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from loguru import logger

from .core.base import ToolConfig, ToolExecutionError, ToolValidationError

F = TypeVar("F", bound=Callable[..., Any])


def with_retry(config: ToolConfig) -> Callable[[F], F]:
    """Decorator to add retry logic to tool execution.

    Args:
        config: ToolConfig with retry settings

    Returns:
        Decorated function with retry logic
    """

    def decorator(func: F) -> F:
        @retry(
            stop=stop_after_attempt(config.max_retries + 1),
            wait=wait_exponential(
                multiplier=config.retry_delay,
                max=config.retry_delay * (config.backoff_factor ** config.max_retries),
            ),
            retry=retry_if_exception_type((ToolExecutionError, ConnectionError, TimeoutError)),
            before_sleep=lambda retry_state: logger.warning(
                f"Retrying {func.__name__} (attempt {retry_state.attempt_number}/{config.max_retries + 1})"
            ),
        )
        @functools.wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            return await func(*args, **kwargs)

        @retry(
            stop=stop_after_attempt(config.max_retries + 1),
            wait=wait_exponential(
                multiplier=config.retry_delay,
                max=config.retry_delay * (config.backoff_factor ** config.max_retries),
            ),
            retry=retry_if_exception_type((ToolExecutionError, ConnectionError, TimeoutError)),
            before_sleep=lambda retry_state: logger.warning(
                f"Retrying {func.__name__} (attempt {retry_state.attempt_number}/{config.max_retries + 1})"
            ),
        )
        @functools.wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            return func(*args, **kwargs)

        # Return appropriate wrapper based on function type
        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper  # type: ignore
        else:
            return sync_wrapper  # type: ignore

    return decorator
