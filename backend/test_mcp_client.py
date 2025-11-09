#!/usr/bin/env python3
"""Interactive MCP Client for testing the FastMCP server.

Usage:
    python test_mcp_client.py
    
This script connects to the MCP server and allows you to:
- List available tools
- Call tools (generate_tool_config, execute_http_request, etc.)
- List resources (registered tools)
- Test tool registration and management

Based on FastMCP testing patterns: https://gofastmcp.com/patterns/testing
"""

import asyncio
import json
from fastmcp.client import Client
from fastmcp.client.transports import FastMCPTransport

# Import the MCP server instance
from src.dynamic_tools.fastmcp_server import mcp


async def list_all_tools(client):
    """List all available tools from the MCP server."""
    print("\n=== Listing All Tools ===")
    tools = await client.list_tools()
    
    for tool in tools:
        print(f"\n📦 {tool.name}")
        print(f"   Description: {tool.description if hasattr(tool, 'description') else 'N/A'}")
        if hasattr(tool, 'inputSchema'):
            print(f"   Input Schema: {json.dumps(tool.inputSchema, indent=2)}")
    
    return tools


async def test_health_check(client):
    """Test the health_check tool."""
    print("\n=== Testing Health Check ===")
    result = await client.call_tool("health_check", {})
    print(f"Result: {result}")
    return result


async def test_generate_tool_config(client):
    """Test generating a tool config (registering a new tool)."""
    print("\n=== Testing Tool Registration (generate_tool_config) ===")
    
    # Example: Register a weather tool
    params = {
        "tool_name": "get_weather",
        "tool_description": "Get current weather information for a city",
        "api_docs": """
        Weather API Documentation:
        GET https://api.weatherapi.com/v1/current.json
        Query Parameters:
        - q: City name (required)
        - key: API key (required)
        Response: JSON with weather data including temperature, conditions, etc.
        """,
        "input_schema_description": "Takes a city name as input",
        "output_schema_description": "Returns weather data including temperature and conditions"
    }
    
    print(f"Registering tool with params:")
    print(json.dumps(params, indent=2))
    
    result = await client.call_tool("generate_tool_config", params)
    print(f"\n✅ Tool Config Generated:")
    
    # Extract data from CallToolResult
    if hasattr(result, 'data'):
        print(json.dumps(result.data, indent=2))
    elif hasattr(result, 'content'):
        print(f"Content: {result.content}")
    else:
        print(f"Result: {result}")
    
    return result


async def list_resources(client):
    """List all resources (registered tools)."""
    print("\n=== Listing Resources ===")
    resources = await client.list_resources()
    
    for resource in resources:
        print(f"\n📚 {resource.uri}")
        print(f"   Name: {resource.name if hasattr(resource, 'name') else 'N/A'}")
        print(f"   Description: {resource.description if hasattr(resource, 'description') else 'N/A'}")
    
    return resources


async def read_resource(client, uri):
    """Read a specific resource."""
    print(f"\n=== Reading Resource: {uri} ===")
    try:
        content = await client.read_resource(uri)
        print(f"Content: {content}")
        return content
    except Exception as e:
        print(f"Error reading resource: {e}")
        return None


async def list_prompts(client):
    """List all available prompts."""
    print("\n=== Listing Prompts ===")
    prompts = await client.list_prompts()
    
    for prompt in prompts:
        print(f"\n💭 {prompt.name}")
        print(f"   Description: {prompt.description if hasattr(prompt, 'description') else 'N/A'}")
    
    return prompts


async def interactive_menu():
    """Interactive menu for testing MCP server."""
    print("=" * 60)
    print("🚀 FastMCP Server Testing Client")
    print("=" * 60)
    print("\nConnecting to MCP server (in-memory transport)...")
    
    # Connect to the MCP server using in-memory transport
    # This follows the FastMCP testing pattern from https://gofastmcp.com/patterns/testing
    async with Client(transport=mcp) as client:
        print("✅ Connected to MCP server!\n")
        
        while True:
            print("\n" + "=" * 60)
            print("Available Actions:")
            print("1. List all tools")
            print("2. Test health check")
            print("3. Generate/Register a tool config")
            print("4. List resources")
            print("5. Read resource (tools://registered)")
            print("6. List prompts")
            print("7. Execute HTTP request")
            print("0. Exit")
            print("=" * 60)
            
            choice = input("\nEnter your choice (0-7): ").strip()
            
            try:
                if choice == "0":
                    print("\n👋 Goodbye!")
                    break
                elif choice == "1":
                    await list_all_tools(client)
                elif choice == "2":
                    await test_health_check(client)
                elif choice == "3":
                    await test_generate_tool_config(client)
                elif choice == "4":
                    await list_resources(client)
                elif choice == "5":
                    await read_resource(client, "tools://registered")
                elif choice == "6":
                    await list_prompts(client)
                elif choice == "7":
                    print("\n=== Execute HTTP Request ===")
                    url = input("Enter URL: ").strip()
                    method = input("Enter method (GET/POST/etc): ").strip().upper()
                    result = await client.call_tool("execute_http_request", {
                        "method": method,
                        "url": url
                    })
                    print(f"\nResult: {json.dumps(result, indent=2)}")
                else:
                    print("❌ Invalid choice. Please try again.")
                    
            except Exception as e:
                print(f"\n❌ Error: {e}")
                import traceback
                traceback.print_exc()
            
            input("\nPress Enter to continue...")


async def quick_test():
    """Run a quick automated test sequence."""
    print("=" * 60)
    print("🧪 Running Quick Automated Tests")
    print("=" * 60)
    
    try:
        # Use in-memory transport for testing (FastMCP pattern)
        async with Client(transport=mcp) as client:
            print("✅ Connected to MCP server!\n")
            
            # Test 1: List tools
            await list_all_tools(client)
            
            # Test 2: Health check
            await test_health_check(client)
            
            # Test 3: Generate a tool config (the main functionality!)
            await test_generate_tool_config(client)
            
            # Test 4: List resources
            await list_resources(client)
            
            # Test 5: Read registered tools
            await read_resource(client, "tools://registered")
            
            # Test 6: List prompts
            await list_prompts(client)
            
            print("\n" + "=" * 60)
            print("✅ All quick tests completed successfully!")
            print("=" * 60)
            
    except Exception as e:
        print(f"\n❌ Error during tests: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        asyncio.run(quick_test())
    else:
        asyncio.run(interactive_menu())

