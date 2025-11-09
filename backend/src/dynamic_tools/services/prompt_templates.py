"""Prompt templates for multi-stage LLM prompting."""

from typing import Optional


class PromptTemplates:
    """Centralized prompt template management for different modes."""
    
    @staticmethod
    def normal_mode_system_prompt() -> str:
        """System prompt for normal text response mode.
        
        Returns:
            System prompt instructing the LLM to provide helpful text responses
        """
        return """You are a helpful AI assistant. Provide clear, accurate, and concise responses to user questions.
Focus on being informative and easy to understand."""
    
    @staticmethod
    def mcp_mode_system_prompt() -> str:
        """System prompt for MCP (Model Context Protocol) mode.
        
        Returns:
            System prompt instructing the LLM to generate HTTP request specifications
        """
        return """You are an API integration assistant. Your task is to generate HTTP request specifications based on user instructions and API documentation.

Always respond with a valid HTTP request specification including:
- method: The HTTP method (GET, POST, PUT, DELETE, PATCH)
- url: The complete URL for the request
- headers: Any required headers as a dictionary
- query_params: URL query parameters as a dictionary (if applicable)
- body: Request body data (if applicable)

Be precise and follow the API documentation exactly."""
    
    @staticmethod
    def build_user_prompt(
        instructions: str,
        context: Optional[str] = None,
        api_docs: Optional[str] = None,
        response_format_prompt: Optional[str] = None
    ) -> str:
        """Build multi-stage user prompt from components.
        
        Args:
            instructions: Primary instruction or question (required)
            context: Additional contextual information (optional)
            api_docs: API documentation for MCP mode (optional)
            response_format_prompt: Response formatting instructions (optional)
            
        Returns:
            Formatted user prompt combining all stages
        """
        parts = []
        
        # Stage 1: Instructions (always included)
        parts.append(f"Instructions: {instructions}")
        
        # Stage 2: Context or API docs
        if context:
            parts.append(f"\nContext: {context}")
        
        if api_docs:
            parts.append(f"\nAPI Documentation:\n{api_docs}")
        
        # Stage 3: Response formatting (optional)
        if response_format_prompt:
            parts.append(f"\nResponse Format: {response_format_prompt}")
        
        return "\n".join(parts)
    
    @staticmethod
    def normal_mode_prompt(
        instructions: str,
        context: Optional[str] = None,
        response_format_prompt: Optional[str] = None
    ) -> tuple[str, str]:
        """Generate complete prompt for normal text response mode.
        
        Args:
            instructions: Primary instruction or question
            context: Additional contextual information
            response_format_prompt: Response formatting instructions
            
        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        system_prompt = PromptTemplates.normal_mode_system_prompt()
        user_prompt = PromptTemplates.build_user_prompt(
            instructions=instructions,
            context=context,
            response_format_prompt=response_format_prompt
        )
        return system_prompt, user_prompt
    
    @staticmethod
    def mcp_mode_prompt(
        instructions: str,
        api_docs: str,
        response_format_prompt: Optional[str] = None
    ) -> tuple[str, str]:
        """Generate complete prompt for MCP HTTP specification mode.
        
        Args:
            instructions: Instruction for what API call to make
            api_docs: API documentation or context
            response_format_prompt: Response formatting instructions
            
        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        system_prompt = PromptTemplates.mcp_mode_system_prompt()
        user_prompt = PromptTemplates.build_user_prompt(
            instructions=instructions,
            api_docs=api_docs,
            response_format_prompt=response_format_prompt
        )
        return system_prompt, user_prompt

