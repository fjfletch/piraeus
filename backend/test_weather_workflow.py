#!/usr/bin/env python3
"""Test script to find and test weather tool from database."""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from src.dynamic_tools.config.settings import get_settings
from src.dynamic_tools.services.supabase_service import SupabaseService
from src.dynamic_tools.services.workflow_orchestrator import WorkflowOrchestrator
from src.dynamic_tools.services.prompt_service import PromptService
from src.dynamic_tools.services.http_client import HttpClientService
from src.dynamic_tools.core.registry import ToolRegistry
from src.dynamic_tools.factory.tool_factory import ToolFactory
from src.dynamic_tools.models.api_requests import WorkflowRequest
from loguru import logger


async def main():
    """Test weather workflow."""
    
    print("=" * 80)
    print("🌤️  WEATHER TOOL WORKFLOW TEST")
    print("=" * 80)
    
    # Load settings
    settings = get_settings()
    
    # Initialize database service
    print("\n📊 Connecting to database...")
    db = SupabaseService(
        supabase_url=settings.supabase_url,
        supabase_key=settings.supabase_key
    )
    
    # Get all tools from database
    print("\n🔍 Searching for weather tools in database...")
    all_tools = await db.get_tools()
    
    print(f"\n📋 Found {len(all_tools)} total tools in database")
    
    # Find weather-related tools
    weather_tools = [
        tool for tool in all_tools 
        if 'weather' in tool.name.lower() or 'weather' in (tool.description or '').lower()
    ]
    
    if not weather_tools:
        print("\n❌ No weather tools found in database!")
        print("\n💡 Available tools:")
        for tool in all_tools[:10]:  # Show first 10
            print(f"  - {tool.name}: {tool.description}")
        return
    
    print(f"\n✅ Found {len(weather_tools)} weather tool(s):")
    for tool in weather_tools:
        print(f"\n  📦 Tool: {tool.name}")
        print(f"     ID: {tool.id}")
        print(f"     Description: {tool.description}")
        print(f"     Method: {tool.method}")
        print(f"     URL: {tool.url}")
        if tool.query_params:
            print(f"     Query Params: {tool.query_params}")
    
    # Initialize workflow services
    print("\n🚀 Initializing workflow orchestrator...")
    
    # Create tool registry and register weather tools
    tool_registry = ToolRegistry()
    tool_factory = ToolFactory(registry=tool_registry)
    
    for tool_db in weather_tools:
        # Register tool in registry
        tool_obj = tool_factory.create_from_config(tool_db)
        print(f"   ✓ Registered: {tool_obj.name}")
    
    # Create services
    prompt_service = PromptService(
        openai_api_key=settings.openai_api_key,
        model=settings.llm_model
    )
    http_client = HttpClientService(
        timeout=settings.http_timeout,
        max_retries=settings.http_max_retries
    )
    
    # Create orchestrator
    orchestrator = WorkflowOrchestrator(
        tool_registry=tool_registry,
        prompt_service=prompt_service,
        http_client=http_client
    )
    
    # Test workflow with weather request
    print("\n" + "=" * 80)
    print("🧪 TESTING WORKFLOW")
    print("=" * 80)
    
    # Create tool_ids list from weather tools
    tool_names = [tool.name for tool in weather_tools]
    
    test_request = WorkflowRequest(
        user_instructions="What's the weather like in London?",
        tool_ids=tool_names,
        format_response=True,
        response_format_instructions="Format the weather information in a clear, user-friendly way"
    )
    
    print(f"\n📝 Request:")
    print(f"   Instructions: {test_request.user_instructions}")
    print(f"   Tools: {test_request.tool_ids}")
    print(f"   Format Response: {test_request.format_response}")
    
    print("\n⏳ Executing workflow...")
    print("-" * 80)
    
    try:
        response = await orchestrator.execute_workflow(test_request)
        
        print("\n" + "=" * 80)
        print("✅ WORKFLOW RESULT")
        print("=" * 80)
        
        print(f"\n🎯 Status: {response.status}")
        
        if response.status == "success":
            print(f"\n🔧 Selected Tool: {response.selected_tool}")
            
            if response.http_spec:
                print(f"\n📡 HTTP Request Generated:")
                print(f"   Method: {response.http_spec.get('method', 'N/A')}")
                print(f"   URL: {response.http_spec.get('url', 'N/A')}")
                if response.http_spec.get('query_params'):
                    print(f"   Query Params: {response.http_spec['query_params']}")
            
            if response.raw_response:
                print(f"\n🌐 API Response (first 500 chars):")
                response_str = str(response.raw_response)
                print(f"   {response_str[:500]}...")
            
            if response.formatted_response:
                print(f"\n💬 Formatted Response:")
                print(f"   {response.formatted_response}")
        
        else:
            print(f"\n❌ Error: {response.error}")
            print(f"   Stage: {response.error_stage}")
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"\n❌ WORKFLOW FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

