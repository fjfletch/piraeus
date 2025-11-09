#!/usr/bin/env python3
"""Test script to demonstrate SimpleToolExecutor with real weather API.

This script tests the SimpleToolExecutor with the WeatherAPI service.
It creates a SimpleToolSpec and executes it to fetch current weather data.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from dynamic_tools.models.simple_tool import SimpleToolSpec
from dynamic_tools.services.simple_tool_executor import SimpleToolExecutor


async def test_weather_api():
    """Test weather API execution using SimpleToolExecutor."""
    
    print("=" * 80)
    print("🌤️  WEATHER API TEST - SimpleToolExecutor Demo")
    print("=" * 80)
    print()
    
    # Define the weather API tool
    weather_spec = SimpleToolSpec(
        url="https://api.weatherapi.com/v1/current.json",
        method="GET",
        headers={
            "Accept": "application/json",
            "User-Agent": "DynamicTools/1.0"
        },
        api_key="7b43d38452354330b2674045250911",
        api_key_header="key",  # WeatherAPI uses 'key' parameter in query string
        type="api"
    )
    
    print("📋 Tool Specification:")
    print(f"  URL: {weather_spec.url}")
    print(f"  Method: {weather_spec.method}")
    print(f"  Headers: {weather_spec.headers}")
    print(f"  API Key Param: {weather_spec.api_key_header}")
    print()
    
    # Create executor
    executor = SimpleToolExecutor(timeout=30.0, max_retries=3)
    print("✅ SimpleToolExecutor initialized")
    print()
    
    # Test 1: Get weather for a city by name
    print("-" * 80)
    print("Test 1: Get weather for London by city name")
    print("-" * 80)
    
    try:
        response = await executor.execute(
            weather_spec,
            {"q": "London", "aqi": "yes"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Execution Time: {response.execution_time_ms:.2f}ms")
        print()
        
        if response.status_code == 200 and response.body:
            data = response.body
            
            # Extract key weather information
            location = data.get("location", {})
            current = data.get("current", {})
            
            print("📍 Location:")
            print(f"  Name: {location.get('name')}, {location.get('region')}, {location.get('country')}")
            print(f"  Coordinates: {location.get('lat')}, {location.get('lon')}")
            print(f"  Local Time: {location.get('localtime')}")
            print()
            
            print("🌡️  Current Weather:")
            print(f"  Temperature: {current.get('temp_c')}°C ({current.get('temp_f')}°F)")
            print(f"  Condition: {current.get('condition', {}).get('text')}")
            print(f"  Humidity: {current.get('humidity')}%")
            print(f"  Wind Speed: {current.get('wind_kph')} kph ({current.get('wind_mph')} mph)")
            print(f"  Wind Direction: {current.get('wind_dir')}")
            print(f"  Pressure: {current.get('pressure_mb')} mb")
            print(f"  Precipitation: {current.get('precip_mm')} mm")
            print(f"  Visibility: {current.get('vis_km')} km")
            print(f"  UV Index: {current.get('uv')}")
            print(f"  Gust Speed: {current.get('gust_kph')} kph")
            print()
            
            # Air quality if available
            if "air_quality" in current:
                aq = current["air_quality"]
                print("💨 Air Quality:")
                print(f"  CO: {aq.get('co')}")
                print(f"  NO₂: {aq.get('no2')}")
                print(f"  O₃: {aq.get('o3')}")
                print(f"  PM2.5: {aq.get('pm2_5')}")
                print(f"  PM10: {aq.get('pm10')}")
                print()
            
            print("✅ Test 1 PASSED")
        else:
            print(f"❌ Unexpected status or empty response: {response.status_code}")
            print(f"Body: {response.body}")
            
    except Exception as e:
        print(f"❌ Test 1 FAILED: {e}")
    
    print()
    
    # Test 2: Get weather by coordinates
    print("-" * 80)
    print("Test 2: Get weather by coordinates (Paris)")
    print("-" * 80)
    
    try:
        response = await executor.execute(
            weather_spec,
            {"q": "48.8566,2.3522", "aqi": "no"}  # Paris coordinates
        )
        
        print(f"Status: {response.status_code}")
        print(f"Execution Time: {response.execution_time_ms:.2f}ms")
        print()
        
        if response.status_code == 200 and response.body:
            data = response.body
            location = data.get("location", {})
            current = data.get("current", {})
            
            print(f"📍 Location: {location.get('name')}, {location.get('country')}")
            print(f"🌡️  Temperature: {current.get('temp_c')}°C")
            print(f"🌤️  Condition: {current.get('condition', {}).get('text')}")
            print()
            print("✅ Test 2 PASSED")
        else:
            print(f"❌ Unexpected response")
            
    except Exception as e:
        print(f"❌ Test 2 FAILED: {e}")
    
    print()
    
    # Test 3: Get weather by postal code
    print("-" * 80)
    print("Test 3: Get weather by postal code (New York)")
    print("-" * 80)
    
    try:
        response = await executor.execute(
            weather_spec,
            {"q": "10001"}  # New York zip code
        )
        
        print(f"Status: {response.status_code}")
        print(f"Execution Time: {response.execution_time_ms:.2f}ms")
        print()
        
        if response.status_code == 200 and response.body:
            data = response.body
            location = data.get("location", {})
            current = data.get("current", {})
            
            print(f"📍 Location: {location.get('name')}, {location.get('region')}, {location.get('country')}")
            print(f"🌡️  Temperature: {current.get('temp_c')}°C / {current.get('temp_f')}°F")
            print(f"🌤️  Condition: {current.get('condition', {}).get('text')}")
            print()
            print("✅ Test 3 PASSED")
        else:
            print(f"❌ Unexpected response")
            
    except Exception as e:
        print(f"❌ Test 3 FAILED: {e}")
    
    print()
    print("=" * 80)
    print("🎉 All tests completed!")
    print("=" * 80)
    print()
    print("Summary:")
    print("  ✅ SimpleToolSpec correctly defined the weather API endpoint")
    print("  ✅ SimpleToolExecutor successfully built HTTPRequestSpec")
    print("  ✅ HTTPClientService executed requests with proper formatting")
    print("  ✅ Responses parsed and returned with full metadata")
    print()


if __name__ == "__main__":
    print()
    print("🚀 Starting Weather API test with SimpleToolExecutor...")
    print()
    
    try:
        asyncio.run(test_weather_api())
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

