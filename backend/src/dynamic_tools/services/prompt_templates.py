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

🚨 **CRITICAL RULE - DO NOT HALLUCINATE URLs:**
- You MUST use the EXACT URLs provided in the API documentation
- DO NOT create, modify, or invent URLs based on patterns or assumptions
- DO NOT shorten or "clean up" URLs - use them EXACTLY as provided
- If the documentation shows "FULL URL TO USE: [URL]", use that EXACT URL
- If you see a base_url, use it EXACTLY - do not substitute with similar-looking domains

Always respond with a valid HTTP request specification including:
- method: The HTTP method EXACTLY as specified in the documentation
- url: The COMPLETE URL EXACTLY as provided (no modifications)
- headers: Any required headers as a dictionary
- query_params: URL query parameters as a dictionary (if applicable)
- body: Request body data (if applicable)

Be precise and follow the API documentation EXACTLY. When in doubt, copy the URL character-for-character."""
    
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

🚨 **CRITICAL ANTI-HALLUCINATION RULES:**
- **YOU MUST USE THE EXACT URLS PROVIDED IN THE TOOL DOCUMENTATION**
- Look for "FULL URL TO USE:" in the tool documentation and copy it EXACTLY
- DO NOT invent, modify, shorten, or "improve" URLs
- DO NOT substitute domains with similar-sounding ones (e.g., don't change vercel URLs to generic domains)
- DO NOT assume URL patterns - use ONLY what is explicitly provided
- Copy URLs character-for-character, including all subdomains and paths

IMPORTANT GUIDELINES:
- Choose the tool that best matches the user's intent
- Extract parameter values directly from the user's instructions
- If a parameter is not explicitly provided, use reasonable defaults or omit optional parameters
- Use the EXACT URL shown in "FULL URL TO USE:" - do not modify it in any way
- If query parameters are needed, add them to the query_params field (not in the URL)
- Include all necessary headers, query parameters, and request body as specified by the tool
- Ensure the HTTP method EXACTLY matches what's specified in the tool documentation
- For authentication, use placeholder values like "[API_KEY]" if not provided

Always respond with a valid HTTPRequestSpec that can be executed immediately."""

        user_prompt = f"""User Request: {instructions}

{tools_context}

Based on the user's request and the available tools above, generate a complete HTTP request specification that will accomplish the user's goal. Select the most appropriate tool and extract all necessary parameters from the user's request."""

        return system_prompt, user_prompt
    
    @staticmethod
    def strict_workflow_tool_selection_prompt(
        instructions: str,
        tools_context: str
    ) -> tuple[str, str]:
        """Ultra-strict prompt for tool selection with comprehensive validation.
        
        This prompt enforces:
        - Exact JSON output format
        - Anti-hallucination rules for URLs
        - Three status types: success, insufficient_info, no_suitable_tool
        - Parameter extraction with validation
        - Missing information detection
        - Multi-tool scenario handling
        
        Args:
            instructions: User's natural language instructions
            tools_context: Formatted string describing available tools
            
        Returns:
            Tuple of (system_prompt, user_prompt)
        """
        system_prompt = """You are a precision API orchestration assistant. Your ONLY job is to generate EXACT, VALID HTTP request specifications.

You MUST respond with ONLY valid JSON in this EXACT structure:

{
  "status": "success" | "insufficient_info" | "no_suitable_tool",
  "selected_tool": "exact tool name from documentation",
  "reasoning": "brief explanation of tool selection",
  "http_request": {
    "method": "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    "url": "EXACT url from documentation - DO NOT MODIFY",
    "headers": {"Header-Name": "header-value"},
    "query_params": {"param_name": "param_value"},
    "body": null | "string" | {}
  },
  "extracted_parameters": {"param_name": "value from user request"},
  "missing_information": ["list of missing required parameters"]
}

🚨 CRITICAL ANTI-HALLUCINATION RULES:
✅ USE EXACT URLs FROM DOCUMENTATION - Look for "FULL URL TO USE:" and copy CHARACTER-FOR-CHARACTER
✅ DO NOT modify, shorten, clean up, or "improve" URLs
✅ DO NOT substitute domains or remove subdomains
❌ FORBIDDEN: Creating URLs based on "what seems right"

🎯 TOOL SELECTION RULES:
1. READ ALL TOOLS: Analyze EVERY available tool carefully
2. PICK BEST MATCH: Choose tool most aligned to user request
3. MULTIPLE TOOLS NEEDED: Set status "no_suitable_tool" and explain
4. NO TOOL MATCHES: Set status "no_suitable_tool" and list capabilities
5. MISSING INFO: Set status "insufficient_info" and populate missing_information array

📝 PARAMETER EXTRACTION:
✅ Extract parameter values exactly as user provided
✅ Required + Missing → status "insufficient_info"
✅ Optional + Missing → Omit or use documented default
❌ DO NOT invent parameter values
❌ DO NOT use placeholders for required user parameters

✅ VALIDATION: Response must be valid JSON with exact status values. URL must be unmodified from documentation."""

        user_prompt = f"""USER REQUEST:
{instructions}

AVAILABLE TOOLS:
{tools_context}

TASK: Analyze the user request and available tools, then respond with ONLY valid JSON according to the format specified above."""

        return system_prompt, user_prompt

