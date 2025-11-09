"""Simple tool examples using the dynamic tools system."""

import asyncio
import httpx
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from dotenv import load_dotenv
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from dynamic_tools.decorators import tool
from dynamic_tools.core.registry import ToolRegistry
from dynamic_tools.core.orchestrator import AIOrchestrator

load_dotenv()

# Pydantic models for stock data
class StockQuoteInput(BaseModel):
    """Input parameters for stock quote lookup."""
    symbol: str = Field(description="Stock ticker symbol (e.g., IBM, AAPL, MSFT)")


class StockQuoteOutput(BaseModel):
    """Stock quote information."""
    symbol: str = Field(description="Stock ticker symbol")
    price: float = Field(description="Current stock price")
    change: float = Field(description="Price change")
    change_percent: str = Field(description="Percentage change")
    volume: int = Field(description="Trading volume")
    latest_trading_day: str = Field(description="Latest trading day")


# Define a tool using the @tool decorator
@tool(
    name="get_stock_quote",
    description="Get real-time stock quote for a given ticker symbol using Alpha Vantage API"
)
async def get_stock_quote(input: StockQuoteInput) -> StockQuoteOutput:
    """Fetch stock quote from Alpha Vantage API.
    
    Args:
        input: StockQuoteInput with ticker symbol
        
    Returns:
        StockQuoteOutput with current stock data
    """
    # Alpha Vantage API endpoint
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={input.symbol}&apikey={api_key}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        
        if "Global Quote" not in data:
            raise ValueError(f"Could not fetch data for symbol {input.symbol}")
        
        quote = data["Global Quote"]
        
        return StockQuoteOutput(
            symbol=quote.get("01. symbol", input.symbol),
            price=float(quote.get("05. price", 0)),
            change=float(quote.get("09. change", 0)),
            change_percent=quote.get("10. change percent", "0%"),
            volume=int(quote.get("06. volume", 0)),
            latest_trading_day=quote.get("07. latest trading day", "Unknown"),
        )


async def main():
    """Test the stock quote tool."""
    print("=" * 60)
    print("Dynamic Tools System - Stock Quote Example")
    print("=" * 60)
    
    # Step 1: Create registry and register tool
    print("\n1. Registering tool...")
    registry = ToolRegistry()
    registry.register(get_stock_quote)
    print(f"   ✓ Registered tools: {registry.list_tools()}")
    
    # Step 2: Test manual tool execution
    print("\n2. Testing manual tool execution...")
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
    else:
        print(f"   ✗ Error: {result.error}")
    
    # Step 3: Test with AI Orchestrator (requires OpenAI API key)
    if os.getenv("OPENAI_API_KEY"):
        print("\n3. Testing with AI Orchestrator...")
        
        client = AsyncOpenAI()
        orchestrator = AIOrchestrator(
            client=client,
            registry=registry,
            model="gpt-4o-mini"
        )
        
        print(f"   ✓ Orchestrator initialized with {len(orchestrator.get_available_tools())} tools")
        
        # Step 4a: Manual tool execution (baseline test)
        print("\n4a. Manual tool execution (human specifies tool and params)...")
        manual_result = await orchestrator.execute_tool_manually(
            tool_name="get_stock_quote",
            arguments={"symbol": "AAPL"}
        )
        
        if manual_result.success:
            print(f"   ✓ AAPL stock data: {manual_result.data}")
        else:
            print(f"   ✗ Error: {manual_result.error}")
        
        # Step 4b: AI-driven tool selection (LLM chooses the tool)
        print("\n4b. AI-driven tool selection (LLM decides what to do)...")
        print("   Query: 'What is the current stock price of Microsoft (MSFT)?'")
        print("   (The LLM will decide whether to use the tool and what parameters to use)")
        
        try:
            ai_result = await orchestrator.run(
                input="What is the current stock price of Microsoft (MSFT)?",
                instructions="You have access to tools. Use the get_stock_quote tool to answer questions about stock prices."
            )
            
            # Check if tools were executed
            if isinstance(ai_result, dict) and 'tool_results' in ai_result:
                print(f"   ✓ LLM chose to use tool: {ai_result['tool_results'][0]['tool_name']}")
                print(f"   ✓ Tool execution successful: {ai_result['tool_results'][0]['result'].success}")
                if ai_result['tool_results'][0]['result'].success:
                    print(f"   ✓ Stock data: {ai_result['tool_results'][0]['result'].data}")
                else:
                    print(f"   ✗ Error: {ai_result['tool_results'][0]['result'].error}")
            else:
                print(f"   ✓ AI Response (no tools used): {ai_result}")
        except Exception as e:
            print(f"   ✗ Error during AI tool selection: {str(e)}")
            print("   Note: This may fail if the Responses API doesn't support tool calling yet")
    else:
        print("\n3. Skipping AI Orchestrator test (OPENAI_API_KEY not set)")
    
    print("\n" + "=" * 60)
    print("Example completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
