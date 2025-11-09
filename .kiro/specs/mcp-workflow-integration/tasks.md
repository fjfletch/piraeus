# Implementation Plan

- [x] 1. Create workflow request and response models
  - Add WorkflowRequest and WorkflowResponse models to api_requests.py
  - Include all required fields: user_instructions, tool_ids, format_response, response_format_instructions
  - Add proper validation, field descriptions, and example schemas
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 2. Enhance ToolRegistry for batch retrieval
  - Add get_multiple() method to ToolRegistry class
  - Method should accept list of tool names and return tuple of (found_tools, missing_names)
  - Handle cases where some tools exist and others don't
  - _Requirements: 1.2, 3.1, 3.4_

- [x] 3. Create WorkflowOrchestrator service
  - [x] 3.1 Create workflow_orchestrator.py file with WorkflowOrchestrator class
    - Initialize with ToolRegistry, PromptService, and HTTPClientService dependencies
    - Set up logging with loguru
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x] 3.2 Implement _retrieve_tools helper method
    - Call ToolRegistry.get_multiple() with tool_ids
    - Return tuple of (found_tools, missing_ids)
    - Log retrieval results
    - _Requirements: 1.2, 3.1, 3.4_

  - [x] 3.3 Implement _format_tools_as_context helper method
    - Convert list of ToolConfig objects to structured text format
    - Include tool name, description, endpoint, parameters, and expected output
    - Use consistent formatting for LLM parsing
    - Handle authentication parameters by showing placeholder text
    - _Requirements: 3.2, 3.3_

  - [x] 3.4 Implement _extract_tool_name_from_spec helper method
    - Match HTTPRequestSpec URL against tool base_url patterns
    - Return the name of the matched tool
    - Handle cases where no match is found
    - _Requirements: 4.4_

  - [x] 3.5 Implement execute_workflow main orchestration method
    - Coordinate all workflow stages with proper error handling
    - Stage 1: Retrieve tools using _retrieve_tools, return error if any missing
    - Stage 2: Generate tool context using _format_tools_as_context
    - Stage 3: Call PromptService.prompt_mcp with instructions and tool context
    - Stage 4: Execute API call using HTTPClientService.execute
    - Stage 5: Optionally format response using PromptService.prompt_normal
    - Stage 6: Build and return WorkflowResponse with all data
    - Implement try-catch blocks for each stage with appropriate error_stage values
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Add workflow tool selection prompt template
  - Add workflow_tool_selection_prompt() static method to PromptTemplates class
  - Create system prompt that instructs LLM to analyze tools and select appropriate one
  - Include instructions for parameter extraction and HTTPRequestSpec generation
  - Return tuple of (system_prompt, user_prompt)
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Create workflow endpoint
  - Add /workflow POST endpoint to endpoints.py
  - Accept WorkflowRequest and return WorkflowResponse
  - Initialize WorkflowOrchestrator with required services (ToolRegistry, PromptService, HTTPClientService)
  - Call orchestrator.execute_workflow() and return result
  - Add proper endpoint metadata (summary, description, tags)
  - Handle dependency injection for Settings
  - _Requirements: 2.1, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Write unit tests for WorkflowOrchestrator
  - Create test_workflow_orchestrator.py
  - Test _retrieve_tools with valid and invalid tool IDs
  - Test _format_tools_as_context with various ToolConfig objects
  - Test _extract_tool_name_from_spec with matching and non-matching specs
  - Test execute_workflow with mocked dependencies for success and error paths
  - Mock ToolRegistry, PromptService, and HTTPClientService
  - _Requirements: All requirements (validation)_

- [x] 7. Write integration tests for workflow endpoint
  - Create test_workflow_integration.py
  - Test complete workflow with registered tools
  - Test with format_response=true and format_response=false
  - Test error scenarios: missing tools, LLM failures, API failures
  - Verify response structure matches WorkflowResponse model
  - Test with multiple tools to verify selection logic
  - _Requirements: All requirements (validation)_

- [x] 8. Add API documentation examples
  - Update endpoints.py with comprehensive examples in OpenAPI schema
  - Add example WorkflowRequest showing typical usage
  - Add example WorkflowResponse for success and error cases
  - Document all error_stage values and their meanings
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
