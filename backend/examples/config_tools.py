"""Example of config-based dynamic tool registration."""

import asyncio
import json
from openai import AsyncOpenAI

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from dynamic_tools.models.tool_config import EXAMPLE_STOCK_QUOTE_CONFIG
from dynamic_tools.factory.tool_factory import ToolFactory
from dynamic_tools.core.registry import ToolRegistry
from dynamic_tools.core.orchestrator import AIOrchestrator


async def main():
    """Demonstrate config-based tool registration and usage."""
    
    print("=" * 70)
    print("Config-Based Dynamic Tool System Example")
    print("=" * 70)
    
    # Step 1: Load tool from configuration
    print("\n1. Creating tool from JSON config...")
    print(f"   Config: {EXAMPLE_STOCK_QUOTE_CONFIG['name']}")
    
    # Create tool from config
    tool = ToolFactory.create_from_dict(EXAMPLE_STOCK_QUOTE_CONFIG)
    print(f"   ✓ Created: {tool.name}")
    print(f"   ✓ Description: {tool.description}")
    
    # Step 2: Register tool
    print("\n2. Registering tool...")
    registry = ToolRegistry()
    registry.register(tool)
    print(f"   ✓ Registered tools: {registry.list_tools()}")
    
    # Step 3: Get OpenAI-formatted tool definition
    print("\n3. OpenAI tool format:")
    openai_tools = registry.get_openai_tools()
    print(f"   {json.dumps(openai_tools[0], indent=2)}")
    
    # Step 4: Execute tool manually (without OpenAI)
    print("\n4. Testing manual tool execution...")
    from dynamic_tools.core.executor import ToolExecutor
    executor = ToolExecutor(registry)
    
    result = await executor.execute(
        tool_name="get_stock_quote",
        arguments={"symbol": "IBM"}
    )
    
    print(f"   ✓ Success: {result.success}")
    print(f"   ✓ Execution time: {result.execution_time_ms:.2f}ms")
    if result.success:
        print(f"   ✓ Data: {result.data}")
    
    # Step 5: Use with AI Orchestrator (if OpenAI key available)
    if os.getenv("OPENAI_API_KEY"):
        print("\n5. Testing with AI Orchestrator...")
        
        client = AsyncOpenAI()
        orchestrator = AIOrchestrator(
            client=client,
            registry=registry,
            model="gpt-4o-mini"
        )
        
        # The AI can now call this config-based tool!
        print("   Note: Config-based tool is now available to OpenAI")
        print(f"   Available tools: {orchestrator.get_available_tools()}")
    else:
        print("\n5. Skipping AI Orchestrator test (OPENAI_API_KEY not set)")
    
    # Step 6: Show how to save/load from file
    print("\n6. Saving config to file...")
    config_file = "/tmp/stock_quote_tool.json"
    with open(config_file, 'w') as f:
        json.dump(EXAMPLE_STOCK_QUOTE_CONFIG, f, indent=2)
    print(f"   ✓ Saved to: {config_file}")
    
    # Load from file
    print("\n7. Loading tool from file...")
    tool_from_file = ToolFactory.create_from_json_file(config_file)
    print(f"   ✓ Loaded: {tool_from_file.name}")
    
    print("\n" + "=" * 70)
    print("✅ Config-based dynamic tools working!")
    print("=" * 70)
    print("\nKey Points:")
    print("  • Tools defined in JSON/config (no code required)")
    print("  • Automatically converts to OpenAI tool format")
    print("  • Works with existing ToolRegistry & AIOrchestrator")
    print("  • Can be stored in Supabase catalog.tool_versions table")
    print("  • UI can create these configs → instant tool availability")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())

