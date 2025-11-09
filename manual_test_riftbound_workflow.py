#!/usr/bin/env python3
"""
Manual Test Script for MCP Workflow with Riftbound API

This script demonstrates the complete MCP workflow using the real Riftbound
Top Decks API. It will:
1. Register tools for the Riftbound API (cards and decks endpoints)
2. Execute workflow requests with natural language instructions
3. Show both raw API responses and LLM-formatted responses

Requirements:
- OpenAI API key set in environment (OPENAI_API_KEY)
- Backend server running on localhost:8000
"""

import asyncio
import httpx
import json
from typing import Optional


# Configuration
BASE_URL = "http://localhost:8000"
RIFTBOUND_API_BASE = "https://riftbound-top-decks-api-git-main-stevenabouchedids-projects.vercel.app"


class RiftboundWorkflowTester:
    """Test harness for Riftbound API workflow."""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def register_riftbound_cards_tool(self):
        """Register the Riftbound cards API tool."""
        print("\n" + "="*80)
        print("STEP 1: Registering Riftbound Cards Tool")
        print("="*80)
        
        tool_config = {
            "name": "get_riftbound_cards",
            "description": "Get cards from the Riftbound card game API. Returns a list of all available cards with their properties including name, type, rarity, domain, energy, power, might, and description.",
            "version": 1,
            "enabled": True,
            "api": {
                "base_url": f"{RIFTBOUND_API_BASE}/api/cards",
                "path": "",
                "method": "GET",
                "headers": {},
                "params": {},
                "auth": {
                    "method": "none"
                },
                "timeout": 30.0
            },
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": []
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "cards": {
                        "type": "array",
                        "description": "List of cards"
                    }
                }
            },
            "mapping": {
                "input_to_params": {},
                "input_to_body": {},
                "response_to_output": {}
            },
            "tags": ["riftbound", "cards", "game"]
        }
        
        # Note: In a real implementation, you would POST this to a tool registration endpoint
        # For now, we'll just show what would be registered
        print(f"Tool Config: {json.dumps(tool_config, indent=2)}")
        print("\n✓ Tool configuration prepared (would be registered via API)")
        return "get_riftbound_cards"
    
    async def register_riftbound_decks_tool(self):
        """Register the Riftbound decks API tool."""
        print("\n" + "="*80)
        print("STEP 2: Registering Riftbound Decks Tool")
        print("="*80)
        
        tool_config = {
            "name": "get_riftbound_decks",
            "description": "Get deck lists from the Riftbound card game API. Returns a list of player decks with their legend, owner, size, and metadata.",
            "version": 1,
            "enabled": True,
            "api": {
                "base_url": f"{RIFTBOUND_API_BASE}/api/decks",
                "path": "",
                "method": "GET",
                "headers": {},
                "params": {},
                "auth": {
                    "method": "none"
                },
                "timeout": 30.0
            },
            "input_schema": {
                "type": "object",
                "properties": {},
                "required": []
            },
            "output_schema": {
                "type": "object",
                "properties": {
                    "decks": {
                        "type": "array",
                        "description": "List of decks"
                    }
                }
            },
            "mapping": {
                "input_to_params": {},
                "input_to_body": {},
                "response_to_output": {}
            },
            "tags": ["riftbound", "decks", "game"]
        }
        
        print(f"Tool Config: {json.dumps(tool_config, indent=2)}")
        print("\n✓ Tool configuration prepared (would be registered via API)")
        return "get_riftbound_decks"
    
    async def test_workflow_cards_simple(self):
        """Test workflow: Get 5 random Fury cards (simplified - just get cards)."""
        print("\n" + "="*80)
        print("TEST 1: Get Riftbound Cards (No Formatting)")
        print("="*80)
        
        workflow_request = {
            "user_instructions": "Get all cards from the Riftbound API",
            "tool_ids": ["get_riftbound_cards"],
            "format_response": False
        }
        
        print(f"\nWorkflow Request:")
        print(json.dumps(workflow_request, indent=2))
        
        try:
            print("\n[REAL CALL] Calling POST /workflow...")
            response = await self.client.post(
                f"{self.base_url}/workflow",
                json=workflow_request,
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print("\n✓ SUCCESS!")
                print(f"Status: {result.get('status')}")
                print(f"Selected Tool: {result.get('selected_tool')}")
                
                if result.get('http_spec'):
                    print(f"\nHTTP Spec Generated:")
                    print(f"  Method: {result['http_spec'].get('method')}")
                    print(f"  URL: {result['http_spec'].get('url')}")
                
                if result.get('raw_response'):
                    raw = result['raw_response']
                    print(f"\nAPI Response:")
                    print(f"  Status Code: {raw.get('status_code')}")
                    if isinstance(raw.get('body'), list):
                        print(f"  Cards Retrieved: {len(raw['body'])}")
                        print(f"  First Card: {raw['body'][0].get('name') if raw['body'] else 'N/A'}")
                    else:
                        print(f"  Body: {str(raw.get('body'))[:200]}...")
                
                return result
            else:
                print(f"\n✗ ERROR: Status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"\n✗ ERROR: {e}")
            print("Make sure:")
            print("  1. Backend is running (docker-compose up)")
            print("  2. Tools are registered in the system")
            print("  3. OPENAI_API_KEY is set")
    
    async def test_workflow_cards_with_formatting(self):
        """Test workflow: Get cards with LLM formatting to find Fury cards."""
        print("\n" + "="*80)
        print("TEST 2: Get 5 Random Fury Cards (With Formatting)")
        print("="*80)
        
        workflow_request = {
            "user_instructions": "Get all cards from the Riftbound API",
            "tool_ids": ["get_riftbound_cards"],
            "format_response": True,
            "response_format_instructions": "From the response, randomly select 5 cards that have 'Fury' as their domain. List each card's name, energy cost, power, might, and description in a clear, readable format."
        }
        
        print(f"\nWorkflow Request:")
        print(json.dumps(workflow_request, indent=2))
        
        try:
            print("\n[REAL CALL] Calling POST /workflow...")
            response = await self.client.post(
                f"{self.base_url}/workflow",
                json=workflow_request,
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print("\n✓ SUCCESS!")
                print(f"Status: {result.get('status')}")
                print(f"Selected Tool: {result.get('selected_tool')}")
                
                if result.get('formatted_response'):
                    print(f"\n📝 LLM Formatted Response:")
                    print("="*80)
                    print(result['formatted_response'])
                    print("="*80)
                
                if result.get('raw_response'):
                    raw = result['raw_response']
                    print(f"\n📊 Raw Data:")
                    print(f"  Status Code: {raw.get('status_code')}")
                    if isinstance(raw.get('body'), list):
                        print(f"  Total Cards: {len(raw['body'])}")
                
                return result
            else:
                print(f"\n✗ ERROR: Status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"\n✗ ERROR: {e}")
            print("This test requires OpenAI API key and tools to be registered.")
    
    async def test_workflow_decks(self):
        """Test workflow: Get deck information."""
        print("\n" + "="*80)
        print("TEST 3: Get Riftbound Decks (With Formatting)")
        print("="*80)
        
        workflow_request = {
            "user_instructions": "Get all decks from the Riftbound API",
            "tool_ids": ["get_riftbound_decks"],
            "format_response": True,
            "response_format_instructions": "Summarize the top 5 most recent decks, showing the deck name, legend used, owner, and deck size. Present it in a clean, easy-to-read format."
        }
        
        print(f"\nWorkflow Request:")
        print(json.dumps(workflow_request, indent=2))
        
        try:
            print("\n[REAL CALL] Calling POST /workflow...")
            response = await self.client.post(
                f"{self.base_url}/workflow",
                json=workflow_request,
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print("\n✓ SUCCESS!")
                print(f"Status: {result.get('status')}")
                print(f"Selected Tool: {result.get('selected_tool')}")
                
                if result.get('formatted_response'):
                    print(f"\n📝 LLM Formatted Response:")
                    print("="*80)
                    print(result['formatted_response'])
                    print("="*80)
                
                return result
            else:
                print(f"\n✗ ERROR: Status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"\n✗ ERROR: {e}")
    
    async def test_workflow_multi_tool(self):
        """Test workflow: LLM chooses between cards and decks."""
        print("\n" + "="*80)
        print("TEST 4: Multi-Tool Selection (LLM Chooses)")
        print("="*80)
        
        workflow_request = {
            "user_instructions": "Show me information about Riftbound deck lists",
            "tool_ids": ["get_riftbound_cards", "get_riftbound_decks"],
            "format_response": True,
            "response_format_instructions": "Give me a brief summary of what you found."
        }
        
        print(f"\nWorkflow Request:")
        print(json.dumps(workflow_request, indent=2))
        
        try:
            print("\n[REAL CALL] Calling POST /workflow...")
            print("LLM will choose between 2 tools based on user intent...")
            
            response = await self.client.post(
                f"{self.base_url}/workflow",
                json=workflow_request,
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print("\n✓ SUCCESS!")
                print(f"Status: {result.get('status')}")
                print(f"\n🤖 LLM Selected Tool: {result.get('selected_tool')}")
                print("   (Expected: get_riftbound_decks based on 'deck lists' in instruction)")
                
                if result.get('formatted_response'):
                    print(f"\n📝 LLM Formatted Response:")
                    print("="*80)
                    print(result['formatted_response'])
                    print("="*80)
                
                return result
            else:
                print(f"\n✗ ERROR: Status {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"\n✗ ERROR: {e}")
    
    async def test_direct_api_call(self):
        """Make a direct API call to verify the API works."""
        print("\n" + "="*80)
        print("BONUS: Direct API Call (Verification)")
        print("="*80)
        
        print(f"\nCalling: {RIFTBOUND_API_BASE}/api/cards")
        
        try:
            response = await self.client.get(f"{RIFTBOUND_API_BASE}/api/cards")
            cards = response.json()
            
            # Filter for Fury cards
            fury_cards = [c for c in cards if c.get("domain") == "Fury"]
            
            print(f"\n✓ API Response:")
            print(f"  - Total cards: {len(cards)}")
            print(f"  - Fury cards: {len(fury_cards)}")
            
            # Show 3 random Fury cards
            import random
            sample_cards = random.sample(fury_cards, min(3, len(fury_cards)))
            
            print(f"\n  Sample Fury Cards:")
            for card in sample_cards:
                print(f"    - {card['name']} (Energy: {card['energy']}, Might: {card['might']})")
            
            return True
        except Exception as e:
            print(f"\n✗ Error: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all test scenarios."""
        print("\n" + "#"*80)
        print("# RIFTBOUND MCP WORKFLOW MANUAL TEST SUITE (REAL CALLS)")
        print("#"*80)
        print("\n⚠️  WARNING: This test makes REAL API calls!")
        print("   - Calls OpenAI API (costs ~$0.01-0.05 total)")
        print("   - Calls Riftbound API (free)")
        print("   - Requires backend server running on localhost:8000")
        print("   - Requires OPENAI_API_KEY set in backend/.env")
        print("   - Requires tools to be registered in the system")
        print("\nPress Ctrl+C to cancel...")
        print("\nStarting tests in 3 seconds...")
        import asyncio
        await asyncio.sleep(3)
        
        # Register tools
        await self.register_riftbound_cards_tool()
        await self.register_riftbound_decks_tool()
        
        # Run test scenarios
        await self.test_workflow_cards_simple()
        await self.test_workflow_cards_with_formatting()
        await self.test_workflow_decks()
        await self.test_workflow_multi_tool()
        
        # Bonus: Direct API call
        await self.test_direct_api_call()
        
        print("\n" + "#"*80)
        print("# TEST SUITE COMPLETE")
        print("#"*80)
        print("\nTo execute these workflows for real:")
        print(f"  curl -X POST {BASE_URL}/workflow \\")
        print("    -H 'Content-Type: application/json' \\")
        print("    -d '{")
        print('      "user_instructions": "Get 5 random Fury cards",')
        print('      "tool_ids": ["get_riftbound_cards"],')
        print('      "format_response": true')
        print("    }'")


async def main():
    """Main entry point."""
    tester = RiftboundWorkflowTester()
    try:
        await tester.run_all_tests()
    finally:
        await tester.close()


if __name__ == "__main__":
    asyncio.run(main())
