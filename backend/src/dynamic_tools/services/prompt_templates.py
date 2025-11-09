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
    
    @staticmethod
    def workflow_tool_selection_prompt(
        instructions: str,
        tools_context: str
    ) -> tuple[str, str]:
        """Generate prompt for tool selection in workflow mode.
        
        This method creates a specialized prompt for the MCP workflow that
        instructs the LLM to:
        1. Analyze the available tools
        2. Select the most appropriate tool for the user's request
        3. Extract required parameters from the user instructions
        4. Generate a complete HTTPRequestSpec
        
        Args:
            instructions: User's natural language instructions
            tools_context: Formatted string describing available tools
            
        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        system_prompt = """You are an intelligent API orchestration assistant. Your task is to:

1. Analyze the available tools and their capabilities
2. Select the MOST APPROPRIATE tool based on the user's request
3. Extract required parameters from the user's instructions
4. Generate a complete and valid HTTP request specification

IMPORTANT GUIDELINES:
- Choose the tool that best matches the user's intent
- Extract parameter values directly from the user's instructions
- If a parameter is not explicitly provided, use reasonable defaults or omit optional parameters
- Generate the complete URL by combining the base URL with any required path parameters
- Include all necessary headers, query parameters, and request body as specified by the tool
- Ensure the HTTP method matches the tool's requirements
- For authentication, use placeholder values like "[API_KEY]" if not provided

Always respond with a valid HTTPRequestSpec that can be executed immediately."""

        user_prompt = f"""User Request: {instructions}

{tools_context}

Based on the user's request and the available tools above, generate a complete HTTP request specification that will accomplish the user's goal. Select the most appropriate tool and extract all necessary parameters from the user's request."""

        return system_prompt, user_prompt

