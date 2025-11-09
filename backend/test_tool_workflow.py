#!/usr/bin/env python3
"""Test script for the complete tool generation and registration workflow.

This script demonstrates:
1. Generating a tool config from natural language API description (/generate-tool-config)
2. Registering the generated config in Supabase (/tools)
3. Retrieving the registered tool (/tools/{name})

Usage:
    uv run python test_tool_workflow.py
"""

import httpx
import json
import asyncio
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = 60.0  # Tool generation can be slow


class ToolWorkflowTester:
    """Test the complete tool generation and registration workflow."""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=TIMEOUT)

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

    async def test_health(self) -> bool:
        """Check if the service is healthy."""
        print("\n" + "=" * 80)
        print("1. HEALTH CHECK")
        print("=" * 80)
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("✅ Service is healthy!")
                print(json.dumps(response.json(), indent=2))
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

    async def generate_tool_config(
        self,
        tool_name: str,
        tool_description: str,
        api_docs: str
    ) -> Optional[dict]:
        """Generate a tool config from API documentation.

        Args:
            tool_name: Name for the tool
            tool_description: What the tool does
            api_docs: API documentation

        Returns:
            Generated tool config or None if failed
        """
        print("\n" + "=" * 80)
        print("2. GENERATE TOOL CONFIG")
        print("=" * 80)
        print(f"Tool Name: {tool_name}")
        print(f"Description: {tool_description}")
        print(f"API Docs:\n{api_docs[:200]}...\n")

        try:
            payload = {
                "tool_name": tool_name,
                "tool_description": tool_description,
                "api_docs": api_docs,
            }

            print("Sending request to /generate-tool-config...")
            response = await self.client.post(
                f"{self.base_url}/generate-tool-config",
                json=payload,
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("status") == "success":
                    tool_config = result.get("tool_config")
                    print(f"✅ Tool config generated successfully!")
                    print(f"\nGenerated config:\n{json.dumps(tool_config, indent=2)}")
                    return tool_config
                else:
                    error = result.get("error", "Unknown error")
                    print(f"❌ Generation failed: {error}")
                    return None
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    async def register_tool(self, tool_config: dict) -> Optional[dict]:
        """Register a tool in the database.

        Args:
            tool_config: Complete tool configuration

        Returns:
            Registered tool with id and timestamps, or None if failed
        """
        print("\n" + "=" * 80)
        print("3. REGISTER TOOL IN DATABASE")
        print("=" * 80)

        try:
            # Extract name and description from config
            tool_name = tool_config.get("name", "unknown")
            tool_description = tool_config.get("description", "")

            payload = {
                "name": tool_name,
                "description": tool_description,
                "tool_config": tool_config,
            }

            print(f"Registering tool: {tool_name}")
            print("Sending request to POST /tools...")

            response = await self.client.post(
                f"{self.base_url}/tools",
                json=payload,
            )

            if response.status_code == 201:
                registered_tool = response.json()
                print(f"✅ Tool registered successfully!")
                print(f"\nRegistered tool:\n{json.dumps(registered_tool, indent=2)}")
                return registered_tool
            else:
                print(f"❌ Registration failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    async def retrieve_tool(self, tool_name: str) -> Optional[dict]:
        """Retrieve a tool from the database.

        Args:
            tool_name: Name of the tool to retrieve

        Returns:
            Tool data or None if not found
        """
        print("\n" + "=" * 80)
        print("4. RETRIEVE TOOL FROM DATABASE")
        print("=" * 80)

        try:
            print(f"Retrieving tool: {tool_name}")
            print(f"Sending request to GET /tools/{tool_name}...")

            response = await self.client.get(f"{self.base_url}/tools/{tool_name}")

            if response.status_code == 200:
                retrieved_tool = response.json()
                print(f"✅ Tool retrieved successfully!")
                print(f"\nRetrieved tool:\n{json.dumps(retrieved_tool, indent=2)}")
                return retrieved_tool
            elif response.status_code == 404:
                print(f"❌ Tool not found: {tool_name}")
                return None
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    async def list_tools(self) -> Optional[dict]:
        """List all registered tools.

        Returns:
            List of tools with total count or None if failed
        """
        print("\n" + "=" * 80)
        print("5. LIST ALL TOOLS")
        print("=" * 80)

        try:
            print("Sending request to GET /tools...")

            response = await self.client.get(f"{self.base_url}/tools")

            if response.status_code == 200:
                result = response.json()
                tools_list = result.get("tools", [])
                total = result.get("total", 0)
                print(f"✅ Retrieved {len(tools_list)} tools (total: {total})")
                print(f"\nTools:\n{json.dumps(result, indent=2)}")
                return result
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"Response: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Error: {e}")
            return None


async def main():
    """Run the complete workflow test."""

    print("\n" + "=" * 80)
    print("TOOL GENERATION AND REGISTRATION WORKFLOW TEST")
    print("=" * 80)

    tester = ToolWorkflowTester()

    try:
        # 1. Check health
        if not await tester.test_health():
            print("\n❌ Service is not healthy. Exiting.")
            return

        # 2. Generate a tool config
        # Example: Weather API
        tool_name = "weather_tool"
        tool_description = "Get current weather information for a city"
        api_docs = """
        Weather API Documentation

        Base URL: https://api.openweathermap.org/data/2.5

        Endpoint: /weather

        Method: GET

        Parameters:
        - q (required): City name
        - units (optional): Temperature units (metric, imperial, standard). Default: kelvin
        - appid (required): API key

        Response:
        {
            "main": {
                "temp": 293.15,
                "feels_like": 291.52,
                "temp_min": 291.15,
                "temp_max": 295.15,
                "pressure": 1013,
                "humidity": 72
            },
            "weather": [
                {
                    "id": 803,
                    "main": "Clouds",
                    "description": "broken clouds"
                }
            ],
            "name": "London",
            "sys": {
                "country": "GB"
            }
        }

        Example: GET /weather?q=London&units=metric&appid=KEY
        """

        tool_config = await tester.generate_tool_config(
            tool_name=tool_name,
            tool_description=tool_description,
            api_docs=api_docs,
        )

        if not tool_config:
            print("\n❌ Failed to generate tool config. Exiting.")
            return

        # 3. Register the tool
        registered_tool = await tester.register_tool(tool_config)

        if not registered_tool:
            print("\n❌ Failed to register tool. Exiting.")
            return

        # 4. Retrieve the registered tool
        retrieved_tool = await tester.retrieve_tool(tool_name)

        if not retrieved_tool:
            print("\n❌ Failed to retrieve tool. Exiting.")
            return

        # 5. List all tools
        all_tools = await tester.list_tools()

        if not all_tools:
            print("\n❌ Failed to list tools. Exiting.")
            return

        # Summary
        print("\n" + "=" * 80)
        print("✅ WORKFLOW TEST COMPLETE")
        print("=" * 80)
        print("\nSummary:")
        print(f"✅ Health check passed")
        print(f"✅ Tool config generated: {tool_name}")
        print(f"✅ Tool registered in database")
        print(f"✅ Tool retrieved from database")
        print(f"✅ All tools listed ({all_tools['total']} total)")
        print("\n🎉 All basic primitives are working!")

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    finally:
        await tester.close()


if __name__ == "__main__":
    asyncio.run(main())

