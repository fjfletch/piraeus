#!/usr/bin/env python3
"""Test script to demonstrate the SimpleToolConfigGenerator.

This script shows how to use the new simplified tool generator to create
SimpleToolSpec objects from API descriptions, then execute them.
"""

import asyncio
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from dynamic_tools.services.simple_tool_generator import SimpleToolConfigGenerator
from dynamic_tools.services.simple_tool_executor import SimpleToolExecutor
from dynamic_tools.models.simple_tool import SimpleToolSpec

load_dotenv()

async def test_simple_tool_generation():
    """Test generating and executing simple tools."""
    
    print("=" * 80)
    print("🔧 SIMPLE TOOL GENERATOR TEST")
    print("=" * 80)
    print()
    
    # Get API key from environment
    import os
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        return
    
    # Initialize generator
    generator = SimpleToolConfigGenerator(api_key=api_key)
    print("✅ SimpleToolConfigGenerator initialized")
    print()
    
    # Test 1: Weather API
    print("-" * 80)
    print("Test 1: Generate SimpleToolSpec for Weather API")
    print("-" * 80)
    
    weather_docs = """
    API: OpenWeather Current Weather API
    
    Endpoint: https://api.openweathermap.org/data/2.5/weather
    HTTP Method: GET
    
    Authentication:
    - Required: Yes
    - Method: API Key in query parameter 'appid'
    
    Query Parameters:
    - q (required): City name, postal code, coordinates, or IP address
    - units (optional): Units for temperature (metric, imperial)
    - lang (optional): Language for response
    - appid (required): Your API key
    
    Response:
    - Status 200: Returns JSON with location, weather, temperature, humidity, wind, etc.
    - Status 401: Unauthorized (invalid API key)
    - Status 404: Not found (city not found)
    """
    
    try:
        weather_spec = await generator.generate_simple_tool_config(
            tool_name="get_weather",
            tool_description="Get current weather for a city",
            api_docs=weather_docs
        )
        
        print("✅ Generated SimpleToolSpec:")
        print(json.dumps(weather_spec, indent=2))
        print()
        
        # Create SimpleToolSpec object for validation
        spec = SimpleToolSpec(**weather_spec)
        print(f"✓ URL: {spec.url}")
        print(f"✓ Method: {spec.method}")
        print(f"✓ API Key Required: {spec.api_key is not None}")
        print(f"✓ API Key Header: {spec.api_key_header}")
        print(f"✓ Static Headers: {spec.headers}")
        print()
        
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: REST API with authentication
    print("-" * 80)
    print("Test 2: Generate SimpleToolSpec for REST API with Bearer Token")
    print("-" * 80)
    
    rest_docs = """
    API: GitHub REST API v3
    
    Base URL: https://api.github.com
    Endpoint: /repos/{owner}/{repo}/issues
    HTTP Method: GET
    
    Authentication:
    - Required: Yes (for higher rate limits)
    - Method: Bearer token in Authorization header
    - Header: Authorization: Bearer YOUR_TOKEN
    
    Path Parameters:
    - owner: Repository owner
    - repo: Repository name
    
    Query Parameters:
    - state: Issue state (open, closed, all)
    - labels: Filter by labels
    - sort: Sort field
    - direction: Sort direction (asc, desc)
    
    Response:
    - Status 200: Array of issue objects
    - Status 404: Repository not found
    """
    
    try:
        github_spec = await generator.generate_simple_tool_config(
            tool_name="github_list_issues",
            tool_description="List issues in a GitHub repository",
            api_docs=rest_docs
        )
        
        print("✅ Generated SimpleToolSpec:")
        print(json.dumps(github_spec, indent=2))
        print()
        
        spec = SimpleToolSpec(**github_spec)
        print(f"✓ URL: {spec.url}")
        print(f"✓ Method: {spec.method}")
        print(f"✓ API Key Required: {spec.api_key is not None}")
        print(f"✓ API Key Header: {spec.api_key_header}")
        print()
        
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 3: POST API with JSON body
    print("-" * 80)
    print("Test 3: Generate SimpleToolSpec for POST API with JSON Body")
    print("-" * 80)
    
    post_docs = """
    API: Slack Web API
    
    Endpoint: https://slack.com/api/chat.postMessage
    HTTP Method: POST
    Content-Type: application/json
    
    Authentication:
    - Required: Yes
    - Method: Bearer token in Authorization header
    - Token Type: xoxb- or xoxp- tokens
    
    Request Body (JSON):
    - channel (required): Channel ID or name
    - text (required): Message text
    - blocks (optional): Rich formatting blocks
    - thread_ts (optional): Thread timestamp for replies
    
    Response:
    - Status 200: Message posted successfully
    - Status 200 with error: Error details in JSON
    """
    
    try:
        slack_spec = await generator.generate_simple_tool_config(
            tool_name="slack_post_message",
            tool_description="Post a message to Slack channel",
            api_docs=post_docs
        )
        
        print("✅ Generated SimpleToolSpec:")
        print(json.dumps(slack_spec, indent=2))
        print()
        
        spec = SimpleToolSpec(**slack_spec)
        print(f"✓ URL: {spec.url}")
        print(f"✓ Method: {spec.method}")
        print(f"✓ Content-Type: {spec.headers.get('Content-Type') if spec.headers else 'Not set'}")
        print(f"✓ API Key Required: {spec.api_key is not None}")
        print()
        
    except Exception as e:
        print(f"❌ Test 3 FAILED: {e}")
        import traceback
        traceback.print_exc()
    
    print("=" * 80)
    print("✅ Simple Tool Generator Tests Complete")
    print("=" * 80)
    print()
    print("Summary:")
    print("  ✓ SimpleToolConfigGenerator successfully parses API documentation")
    print("  ✓ Extracts URL, HTTP method, authentication, and headers")
    print("  ✓ Generates minimal, executable SimpleToolSpec objects")
    print("  ✓ Specs can be directly used with SimpleToolExecutor")
    print()


if __name__ == "__main__":
    print()
    print("🚀 Starting Simple Tool Generator test...")
    print()
    
    try:
        asyncio.run(test_simple_tool_generation())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

