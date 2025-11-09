"""Flow Constructor Service for executing saved flows with dynamic tool and prompt retrieval."""

from typing import Any, Dict, List, Optional
from uuid import UUID
import json

from loguru import logger
from openai import AsyncOpenAI

from ..core.orchestrator import AIOrchestrator
from ..core.registry import ToolRegistry
from ..config.settings import Settings
from .supabase_service import get_supabase_service


class FlowConstructorService:
    """Service for constructing and executing flows from Supabase.
    
    Flows are sequences of orchestrator calls where:
    - Each step has associated prompts and tools (retrieved by ID)
    - Steps can reference previous step outputs
    - Results are chained through the flow
    """

    def __init__(self, settings: Settings):
        """Initialize Flow Constructor Service.
        
        Args:
            settings: Application settings with API keys
        """
        self.settings = settings
        self.db = get_supabase_service()
        logger.info("FlowConstructorService initialized")

    async def execute_flow(
        self,
        flow_id: str,
        initial_input: str,
        initial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a saved flow from Supabase.
        
        Args:
            flow_id: Unique identifier of the flow (from flows table)
            initial_input: Initial user input for the first step
            initial_context: Optional context to pass through steps
            
        Returns:
            Dict with:
            - status: "success" or "error"
            - result: Final output
            - steps_executed: Number of steps completed
            - step_outputs: Dict of outputs from each step
            - error: Error message if failed
        """
        try:
            logger.info(f"Starting flow execution: {flow_id}")
            
            # Retrieve flow definition from Supabase
            flow = await self.db.get_flow(flow_id)
            
            if not flow:
                raise ValueError(f"Flow '{flow_id}' not found in database")
            
            logger.info(f"Retrieved flow: {flow.get('name')} with {len(flow.get('steps', []))} steps")
            
            # Initialize context for passing data between steps
            context = initial_context or {}
            context["step_0_output"] = initial_input
            step_outputs = {}
            steps = flow.get("steps", [])
            
            # Execute each step in the flow using orchestration primitive
            for step_num, step_config in enumerate(steps, 1):
                step_type = step_config.get("type", "orchestrate")
                logger.info(f"Executing step {step_num}/{len(steps)}: {step_type}")
                
                try:
                    # Get step input (can reference previous outputs)
                    step_input = self._resolve_input(
                        step_config.get("inputs", initial_input),
                        context
                    )
                    
                    # All steps use orchestration primitive
                    output = await self._execute_orchestration_step(
                        step_config, step_input, context, step_type
                    )
                    
                    # Store step output in context
                    step_key = f"step_{step_num}_output"
                    context[step_key] = output
                    step_outputs[step_key] = output
                    logger.info(f"Step {step_num} completed successfully")
                    
                except Exception as e:
                    logger.error(f"Step {step_num} failed: {e}")
                    raise
            
            # Return final result
            final_output = step_outputs.get(f"step_{len(steps)}_output", context.get("step_0_output"))
            
            logger.info(f"Flow execution completed: {flow_id}")
            return {
                "status": "success",
                "result": final_output,
                "steps_executed": len(steps),
                "step_outputs": step_outputs,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Flow execution failed: {e}")
            return {
                "status": "error",
                "result": None,
                "steps_executed": 0,
                "step_outputs": {},
                "error": str(e)
            }

    async def _execute_orchestration_step(
        self,
        step_config: Dict[str, Any],
        step_input: str,
        context: Dict[str, Any],
        step_type: str = "orchestrate"
    ) -> Dict[str, Any]:
        """Execute a step using the orchestration primitive (AIOrchestrator).
        
        Supports two types:
        - "orchestrate": LLM with tools (tool_ids required)
        - "prompt": LLM only (prompt_id required, no tools)
        
        Args:
            step_config: Step configuration:
              - For orchestrate: {"type": "orchestrate", "tool_ids": [...], "prompt_id": "..."}
              - For prompt: {"type": "prompt", "prompt_id": "..."}
            step_input: Input for this step
            context: Current flow context
            step_type: Type of step ("orchestrate" or "prompt")
            
        Returns:
            Orchestration result with LLM output and optional tool calls
        """
        # Retrieve tools if orchestrate type
        tools = []
        if step_type == "orchestrate":
            tool_ids = step_config.get("tool_ids", [])
            
            for tool_id in tool_ids:
                tool = await self.db.get_tool(tool_id)
                if tool:
                    # Convert to Responses API format
                    api_tool = {
                        "type": "function",
                        "name": tool.get("name"),
                        "description": tool.get("description", ""),
                        "parameters": tool.get("tool_config", {}).get("input_schema", {})
                    }
                    tools.append(api_tool)
            
            logger.info(f"Orchestrating with {len(tools)} tools")
        else:
            logger.info("Running LLM without tools")
        
        # Retrieve prompt if provided
        prompt = None
        prompt_id = step_config.get("prompt_id")
        if prompt_id:
            prompt = await self.db.get_prompt(prompt_id)
            logger.info(f"Using prompt: {prompt.get('name') if prompt else 'unknown'}")
        
        # Build instructions combining user prompt + context
        instructions = None
        if prompt:
            instructions = prompt.get("prompt_template", "")
            
            # Append context information from previous steps
            context_info = self._build_context_info(context)
            if context_info:
                instructions += f"\n\n{context_info}"
        else:
            # If no prompt provided, create context-only instructions
            context_info = self._build_context_info(context)
            if context_info:
                instructions = context_info
        
        # Initialize orchestrator
        client = AsyncOpenAI(api_key=self.settings.openai_api_key)
        registry = ToolRegistry()
        
        orchestrator = AIOrchestrator(
            client=client,
            registry=registry,
            model=self.settings.llm_model,
            max_tool_iterations=5
        )
        
        # Run orchestration with or without tools
        result = await orchestrator.run(
            input=step_input,
            instructions=instructions,
            additional_tools=tools if tools else None
        )
        
        return result

    def _build_context_info(self, context: Dict[str, Any]) -> str:
        """Build a formatted string of context information from previous steps.
        
        Args:
            context: Flow context with step outputs
            
        Returns:
            Formatted string with previous step results, or empty string if no context
        """
        context_items = []
        
        # Extract step outputs (excluding step_0 which is initial input)
        for key in sorted(context.keys()):
            if key.startswith("step_") and key.endswith("_output") and key != "step_0_output":
                step_num = key.replace("step_", "").replace("_output", "")
                value = context[key]
                
                # Format the value nicely
                if isinstance(value, dict):
                    value_str = json.dumps(value, indent=2)
                elif isinstance(value, list):
                    value_str = json.dumps(value, indent=2)
                else:
                    value_str = str(value)
                
                context_items.append(f"Step {step_num} Output:\n{value_str}")
        
        if context_items:
            return "Previous step results:\n\n" + "\n\n".join(context_items)
        
        return ""

    def _resolve_input(
        self,
        input_spec: Any,
        context: Dict[str, Any]
    ) -> Any:
        """Resolve step input, replacing references to previous outputs.
        
        Supports:
        - Literal strings/values
        - References like "${step_1_output}" or "${step_1_output.field}"
        - Direct pass-through of context values
        
        Args:
            input_spec: Input specification (string, dict, etc)
            context: Flow context with step outputs
            
        Returns:
            Resolved input value
        """
        if isinstance(input_spec, str):
            # Check for ${reference} pattern
            if input_spec.startswith("${") and input_spec.endswith("}"):
                ref = input_spec[2:-1]
                
                # Handle dot notation (e.g., step_1_output.weather)
                if "." in ref:
                    step_ref, field_ref = ref.split(".", 1)
                    value = context.get(step_ref)
                    if isinstance(value, dict):
                        return value.get(field_ref)
                    return value
                
                return context.get(ref, input_spec)
            
            return input_spec
        
        elif isinstance(input_spec, dict):
            # Recursively resolve dict values
            return {
                k: self._resolve_input(v, context)
                for k, v in input_spec.items()
            }
        
        elif isinstance(input_spec, list):
            # Recursively resolve list items
            return [
                self._resolve_input(item, context)
                for item in input_spec
            ]
        
        # Return as-is for other types
        return input_spec


# Global service instance
_flow_constructor_service: Optional[FlowConstructorService] = None


def get_flow_constructor_service(settings: Settings) -> FlowConstructorService:
    """Get or create the global Flow Constructor Service instance.
    
    Args:
        settings: Application settings
        
    Returns:
        FlowConstructorService instance
    """
    global _flow_constructor_service
    if _flow_constructor_service is None:
        _flow_constructor_service = FlowConstructorService(settings)
    return _flow_constructor_service

