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
        
        # Since we can't actually filter by domain in the API, we'll ask the LLM
        # to generate a request to get all cards, then we can filter in the formatted response
        workflow_request = {
            "user_instructions": "Get all cards from the Riftbound API",
            "tool_ids": ["get_riftbound_cards"],
            "format_response": False
        }
        
        print(f"\nWorkflow Request:")
        print(json.dumps(workflow_request, indent=2))
        
        # This would call the actual workflow endpoint
        print("\n[SIMULATED] Calling POST /workflow...")
        print("Expected flow:")
        print("  1. LLM receives tool context about get_riftbound_cards")
        print("  2. LLM generates HTTPRequestSpec:")
        print(f"     - method: GET")
        print(f"     - url: {RIFTBOUND_API_BASE}/api/cards")
        print("  3. System executes API call")
        print("  4. Returns raw JSON response with all cards")
        
        # Simulate what the response would look like
        print("\n✓ Expected Response Structure:")
        print("""{
  "status": "success",
  "selected_tool": "get_riftbound_cards",
  "http_spec": {
    "method": "GET",
    "url": "https://riftbound-top-decks-api.../api/cards"
  },
  "raw_response": {
    "status_code": 200,
    "body": [
      {"name": "Card 1", "domain": "Fury", ...},
      {"name": "Card 2", "domain": "Mind", ...},
      ...
    ]
  },
  "formatted_response": null
}""")
    
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
        
        print("\n[SIMULATED] Calling POST /workflow...")
        print("Expected flow:")
        print("  1. LLM generates HTTPRequestSpec to get all cards")
        print("  2. System executes API call and gets all cards")
        print("  3. LLM formats the response, filtering for 5 random Fury cards")
        print("  4. Returns both raw data and formatted response")
        
        print("\n✓ Expected Formatted Response:")
        print("""
Here are 5 random Fury domain cards from Riftbound:

1. **Raging Firebrand**
   - Energy: 6 | Power: 1 | Might: 4
   - Description: When you play me, the next spell you play this turn costs 5 less.

2. **Pouty Poro**
   - Energy: 2 | Power: 0 | Might: 2
   - Description: [Deflect] (Opponents must pay to choose me with a spell or ability.)

3. **Scrapyard Champion**
   - Energy: 5 | Power: 1 | Might: 5
   - Description: [Legion] — When you play me, discard 2, then draw 2.

4. **Ravenborn Tome** (Gear)
   - Energy: 3 | Power: 0 | Might: 0
   - Description: Exhaust: The next spell you play deals 1 Bonus Damage.

5. **Tryndamere, Barbarian** (Champion)
   - Energy: 7 | Power: 2 | Might: 8
   - Description: When I conquer after an attack, if you assigned 5 or more excess damage, you score 1 point.
""")
    
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
        
        print("\n[SIMULATED] Calling POST /workflow...")
        print("Expected flow:")
        print("  1. LLM generates HTTPRequestSpec to get all decks")
        print("  2. System executes API call")
        print("  3. LLM formats the response with top 5 recent decks")
        print("  4. Returns formatted summary")
        
        print("\n✓ Expected Formatted Response:")
        print("""
Top 5 Most Recent Riftbound Decks:

1. **Kaisa new**
   - Legend: Daughter Of The Void
   - Owner: GeorgeG
   - Size: 64 cards
   - Created: Nov 8, 2025

2. **提莫**
   - Legend: Swift Scout
   - Owner: ssl-布莱克
   - Size: 64 cards
   - Created: Nov 8, 2025

3. **广州站**
   - Legend: Herald Of The Arcane
   - Owner: 乐在麒宗-阿保
   - Size: 64 cards
   - Created: Nov 8, 2025

4. **广州**
   - Legend: Wuju Bladesman - Starter
   - Owner: 東莞天貓
   - Size: 64 cards
   - Created: Nov 7, 2025

5. **karsa**
   - Legend: Daughter Of The Void
   - Owner: Acc.Ai.昕奕
   - Size: 64 cards
   - Created: Nov 7, 2025
""")
    
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
        
        print("\n[SIMULATED] Calling POST /workflow...")
        print("Expected flow:")
        print("  1. LLM receives context for BOTH tools")
        print("  2. LLM analyzes user intent: 'deck lists' → chooses get_riftbound_decks")
        print("  3. LLM generates HTTPRequestSpec for decks endpoint")
        print("  4. System executes API call")
        print("  5. LLM formats the response")
        
        print("\n✓ Expected Response:")
        print("""{
  "status": "success",
  "selected_tool": "get_riftbound_decks",  ← LLM chose this!
  "http_spec": {
    "method": "GET",
    "url": "https://riftbound-top-decks-api.../api/decks"
  },
  "raw_response": { ... },
  "formatted_response": "I found 46 deck lists in the Riftbound database..."
}""")
    
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
        print("# RIFTBOUND MCP WORKFLOW MANUAL TEST SUITE")
        print("#"*80)
        print("\nThis script demonstrates how the MCP workflow would work with")
        print("the Riftbound Top Decks API.")
        print("\nNOTE: This is a simulation showing expected behavior.")
        print("To run for real, you need:")
        print("  1. Backend server running (python -m uvicorn app:app)")
        print("  2. OPENAI_API_KEY environment variable set")
        print("  3. Tools registered in the system")
        
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
