# Requirements Document

## Introduction

This document specifies the requirements for an end-to-end MCP (Model Context Protocol) workflow integration that connects the frontend, tool registry, LLM orchestration, and API execution layers. The system enables users to submit natural language instructions along with tool configurations, have an LLM intelligently select and configure the appropriate tool, execute the API call, and optionally format the response for human consumption.

## Glossary

- **MCP Workflow System**: The complete end-to-end system that processes user requests through tool selection, API execution, and response formatting
- **Tool Configuration**: A ToolConfig object that defines an API endpoint, authentication, input/output schemas, and field mappings
- **Tool Registry**: The ToolRegistry component that stores and manages available tool configurations
- **LLM Orchestrator**: The AIOrchestrator component that interfaces with OpenAI to select tools and generate API specifications
- **HTTP Client Service**: The HTTPClientService component that executes HTTP requests based on specifications
- **Prompt Service**: The PromptService component that manages multi-stage LLM prompting
- **Workflow Request**: An HTTP POST request from the frontend containing user instructions, tool identifiers, and optional formatting preferences
- **Raw API Response**: The unformatted JSON response returned from the executed API call
- **Formatted Response**: An LLM-generated human-readable interpretation of the raw API response

## Requirements

### Requirement 1: Tool Registration and Retrieval

**User Story:** As a developer, I want to register tool configurations and retrieve them by identifier, so that the MCP workflow can access available tools for execution.

#### Acceptance Criteria

1. WHEN a tool configuration is submitted via the existing tool ingestion endpoint, THE MCP Workflow System SHALL store the tool in the Tool Registry with a unique identifier
2. WHEN the MCP workflow requests tools by identifier list, THE Tool Registry SHALL return all matching ToolConfig objects
3. IF a requested tool identifier does not exist in the Tool Registry, THEN THE MCP Workflow System SHALL include an error message indicating which tools were not found
4. THE Tool Registry SHALL maintain tool configurations with all required fields including name, description, API configuration, input schema, output schema, and field mappings

### Requirement 2: Workflow Endpoint Creation

**User Story:** As a frontend developer, I want to submit a workflow request with user instructions and tool identifiers, so that the system can execute the complete MCP workflow and return results.

#### Acceptance Criteria

1. THE MCP Workflow System SHALL expose a POST endpoint at "/workflow" that accepts workflow requests
2. THE workflow request SHALL include a "user_instructions" field containing the natural language task description
3. THE workflow request SHALL include a "tool_ids" field containing a list of tool identifiers to make available for selection
4. THE workflow request SHALL include an optional "format_response" boolean field that defaults to false
5. THE workflow request SHALL include an optional "response_format_instructions" field for customizing response formatting when format_response is true

### Requirement 3: Tool Context Preparation

**User Story:** As a system integrator, I want the workflow to retrieve and format tool configurations as context for the LLM, so that the LLM can understand available tools and select the appropriate one.

#### Acceptance Criteria

1. WHEN the workflow receives tool identifiers, THE MCP Workflow System SHALL retrieve all corresponding ToolConfig objects from the Tool Registry
2. THE MCP Workflow System SHALL convert each ToolConfig into a structured text description including the tool name, description, API endpoint, required parameters, and expected output format
3. THE MCP Workflow System SHALL concatenate all tool descriptions into a single context string for LLM consumption
4. IF any tool identifiers are invalid, THEN THE MCP Workflow System SHALL return an error response listing the invalid identifiers

### Requirement 4: LLM Tool Selection and API Specification Generation

**User Story:** As a system architect, I want the LLM to analyze user instructions and available tools to generate a complete HTTP request specification, so that the system can execute the correct API call.

#### Acceptance Criteria

1. THE MCP Workflow System SHALL provide the user instructions and tool context to the Prompt Service using the MCP prompt mode
2. THE Prompt Service SHALL instruct the LLM to select the most appropriate tool from the available tools based on the user instructions
3. THE Prompt Service SHALL instruct the LLM to extract required parameters from the user instructions and map them to the selected tool's input schema
4. THE LLM SHALL generate an HTTPRequestSpec object containing the method, URL, headers, query parameters, and request body
5. THE HTTPRequestSpec SHALL be validated against the HTTPRequestSpec Pydantic model before proceeding to execution

### Requirement 5: API Execution

**User Story:** As a workflow orchestrator, I want to execute the LLM-generated HTTP request specification, so that I can obtain the raw API response data.

#### Acceptance Criteria

1. WHEN the MCP Workflow System receives a valid HTTPRequestSpec, THE HTTP Client Service SHALL execute the HTTP request
2. THE HTTP Client Service SHALL return an HTTPResponseSpec containing the status code, response body, headers, and execution time
3. IF the HTTP request fails due to network errors or timeouts, THEN THE MCP Workflow System SHALL capture the error and include it in the workflow response
4. THE MCP Workflow System SHALL preserve the raw API response body for inclusion in the final workflow response

### Requirement 6: Optional Response Formatting

**User Story:** As an end user, I want the option to receive a human-readable formatted response in addition to raw JSON, so that I can easily understand the API results without parsing JSON.

#### Acceptance Criteria

1. WHEN the workflow request includes "format_response" set to true, THE MCP Workflow System SHALL send the raw API response to the Prompt Service for formatting
2. THE Prompt Service SHALL use normal prompt mode to generate a human-readable interpretation of the raw API response
3. WHEN "response_format_instructions" are provided, THE Prompt Service SHALL incorporate those instructions into the formatting prompt
4. WHEN "format_response" is false or omitted, THE MCP Workflow System SHALL skip the formatting step and return only the raw response
5. THE formatted response SHALL be included in the workflow response as a separate field from the raw response

### Requirement 7: Workflow Response Structure

**User Story:** As a frontend developer, I want to receive a comprehensive workflow response containing all execution details, so that I can display results and debug issues.

#### Acceptance Criteria

1. THE MCP Workflow System SHALL return a workflow response containing a "status" field with values "success" or "error"
2. WHEN status is "success", THE workflow response SHALL include a "selected_tool" field containing the name of the tool selected by the LLM
3. WHEN status is "success", THE workflow response SHALL include a "http_spec" field containing the generated HTTPRequestSpec as a dictionary
4. WHEN status is "success", THE workflow response SHALL include a "raw_response" field containing the HTTPResponseSpec as a dictionary
5. WHEN status is "success" and format_response is true, THE workflow response SHALL include a "formatted_response" field containing the LLM-formatted text
6. WHEN status is "error", THE workflow response SHALL include an "error" field containing a descriptive error message
7. WHEN status is "error", THE workflow response SHALL include an "error_stage" field indicating which stage of the workflow failed (e.g., "tool_retrieval", "llm_selection", "api_execution", "response_formatting")

### Requirement 8: Error Handling and Resilience

**User Story:** As a system administrator, I want comprehensive error handling throughout the workflow, so that failures are gracefully handled and reported to users.

#### Acceptance Criteria

1. IF tool retrieval fails, THEN THE MCP Workflow System SHALL return an error response with error_stage set to "tool_retrieval"
2. IF LLM tool selection fails or times out, THEN THE MCP Workflow System SHALL return an error response with error_stage set to "llm_selection"
3. IF API execution fails, THEN THE MCP Workflow System SHALL return an error response with error_stage set to "api_execution" and include the HTTP error details
4. IF response formatting fails, THEN THE MCP Workflow System SHALL return a success response with the raw response but include a warning about formatting failure
5. THE MCP Workflow System SHALL log all errors with sufficient context for debugging including request details and error stack traces

### Requirement 9: Integration with Existing Components

**User Story:** As a developer, I want the workflow to leverage existing services and components, so that we maintain consistency and avoid code duplication.

#### Acceptance Criteria

1. THE MCP Workflow System SHALL use the existing ToolRegistry for tool storage and retrieval
2. THE MCP Workflow System SHALL use the existing PromptService for all LLM interactions
3. THE MCP Workflow System SHALL use the existing HTTPClientService for API execution
4. THE MCP Workflow System SHALL use existing Pydantic models (HTTPRequestSpec, HTTPResponseSpec, ToolConfig) for data validation
5. THE MCP Workflow System SHALL follow the existing logging patterns using loguru
