import os
import json
import httpx
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MCP_SERVER_URL = "https://adventurous-vision-production.up.railway.app/mcp"


def test_mcp_tool_basic():
    """
    Basic test: Query the MCP server to understand available tools.
    This tests that the MCP server is reachable and has tools.
    """
    print("=" * 80)
    print("TEST 1: Basic MCP Tool Discovery")
    print("=" * 80)
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not set. Please set it in .env or environment.")
        return False
    
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            json={
                "model": "gpt-4.1",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "dynamic_tools",
                        "server_url": MCP_SERVER_URL,
                        "require_approval": "never",  # For testing, approve automatically
                    }
                ],
                "input": "What tools are available in this MCP server? List them with their descriptions.",
            },
            timeout=30.0,
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Request successful!")
            print(f"\nResponse:")
            print(json.dumps(result, indent=2))
            
            # Extract the text response
            if "content" in result and len(result["content"]) > 0:
                print(f"\n📋 Model Response:")
                for item in result["content"]:
                    if item.get("type") == "text":
                        print(item.get("text", ""))
            
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_mcp_tool_health_check():
    """
    Test 2: Call the health_check tool specifically to verify MCP is working.
    """
    print("\n" + "=" * 80)
    print("TEST 2: Health Check Tool")
    print("=" * 80)
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not set.")
        return False
    
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            json={
                "model": "gpt-4.1",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "dynamic_tools",
                        "server_url": MCP_SERVER_URL,
                        "allowed_tools": ["health_check"],  # Limit to health_check only
                        "require_approval": "never",
                    }
                ],
                "input": "Call the health_check tool to verify the server is healthy.",
            },
            timeout=30.0,
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check request successful!")
            print(f"\nResponse:")
            print(json.dumps(result, indent=2))
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_mcp_tool_generate_config():
    """
    Test 3: Use the generate_tool_config tool to create a tool configuration.
    This demonstrates the core functionality of your MCP server.
    """
    print("\n" + "=" * 80)
    print("TEST 3: Generate Tool Config")
    print("=" * 80)
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not set.")
        return False
    
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            json={
                "model": "gpt-4.1",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "dynamic_tools",
                        "server_url": MCP_SERVER_URL,
                        "allowed_tools": ["generate_tool_config"],
                        "require_approval": "never",
                    }
                ],
                "input": """
Use the generate_tool_config tool to create a configuration for a weather API tool.

Provide these parameters:
- tool_name: "get_weather"
- tool_description: "Get current weather for a city using OpenWeatherMap API"
- api_docs: "GET https://api.openweathermap.org/data/2.5/weather?q={city}&units=metric&appid={api_key}"

Return the generated tool configuration.
                """,
            },
            timeout=60.0,  # Config generation might take longer
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Generate config request successful!")
            print(f"\nResponse:")
            print(json.dumps(result, indent=2))
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_mcp_tool_with_filtering():
    """
    Test 4: Demonstrate tool filtering with allowed_tools parameter.
    This shows how to limit which tools the model can access.
    """
    print("\n" + "=" * 80)
    print("TEST 4: Tool Filtering with allowed_tools")
    print("=" * 80)
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not set.")
        return False
    
    try:
        response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            json={
                "model": "gpt-4.1",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "dynamic_tools",
                        "server_url": MCP_SERVER_URL,
                        "allowed_tools": ["health_check", "execute_http_request"],
                        "require_approval": "never",
                    }
                ],
                "input": "Call the health_check tool and then execute a simple GET request to https://httpbin.org/get",
            },
            timeout=30.0,
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Filtered tools request successful!")
            print(f"\nResponse:")
            print(json.dumps(result, indent=2))
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_mcp_with_context_caching():
    """
    Test 5: Demonstrate context caching to reduce tokens on follow-up calls.
    This shows how to pass previous_response_id for efficiency.
    """
    print("\n" + "=" * 80)
    print("TEST 5: Context Caching (Follow-up Request)")
    print("=" * 80)
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not set.")
        return False
    
    try:
        # First request to establish context
        print("Making first request to establish MCP context...")
        first_response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            json={
                "model": "gpt-4.1",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "dynamic_tools",
                        "server_url": MCP_SERVER_URL,
                        "allowed_tools": ["health_check"],
                        "require_approval": "never",
                    }
                ],
                "input": "Is the MCP server healthy?",
                "store": True,  # Store this response for future use
            },
            timeout=30.0,
        )
        
        if first_response.status_code != 200:
            print(f"❌ First request failed: {first_response.text}")
            return False
        
        first_result = first_response.json()
        response_id = first_result.get("id")
        
        print(f"✅ First response successful (ID: {response_id})")
        print(f"Input tokens: {first_result.get('usage', {}).get('input_tokens')}")
        
        if not response_id:
            print("⚠️  No response ID returned - skipping follow-up test")
            return True
        
        # Follow-up request using previous_response_id for caching
        print(f"\nMaking follow-up request with previous_response_id for caching...")
        second_response = httpx.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            },
            json={
                "model": "gpt-4.1",
                "tools": [
                    {
                        "type": "mcp",
                        "server_label": "dynamic_tools",
                        "server_url": MCP_SERVER_URL,
                        "allowed_tools": ["health_check"],
                        "require_approval": "never",
                    }
                ],
                "input": "Tell me the status of the server again.",
                "previous_response_id": response_id,  # Reference cached context
            },
            timeout=30.0,
        )
        
        if second_response.status_code == 200:
            second_result = second_response.json()
            print(f"✅ Follow-up response successful!")
            print(f"Input tokens (with caching): {second_result.get('usage', {}).get('input_tokens')}")
            print(f"Cached tokens: {second_result.get('usage', {}).get('input_tokens_details', {}).get('cached_tokens', 0)}")
            return True
        else:
            print(f"❌ Follow-up request failed: {second_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def run_all_tests():
    """Run all tests and report results."""
    print("\n" + "🧪 OPENAI RESPONSES API - MCP SERVER TESTS 🧪".center(80))
    print("Server URL: " + MCP_SERVER_URL)
    print()
    
    tests = [
        ("Basic Tool Discovery", test_mcp_tool_basic),
        ("Health Check", test_mcp_tool_health_check),
        ("Generate Config", test_mcp_tool_generate_config),
        ("Tool Filtering", test_mcp_tool_with_filtering),
        ("Context Caching", test_mcp_with_context_caching),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n❌ Test '{test_name}' failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY".center(80))
    print("=" * 80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_flag in results.items():
        status = "✅ PASS" if passed_flag else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    return passed == total


if __name__ == "__main__":
    import sys
    
    print("\n📚 OpenAI Responses API - MCP Server Test Suite")
    print("Reference: https://cookbook.openai.com/examples/mcp/mcp_tool_guide\n")
    
    success = run_all_tests()
    sys.exit(0 if success else 1)

