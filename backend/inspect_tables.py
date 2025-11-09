"""
Inspect Supabase Tables in Detail

This script examines the structure of discovered tables.
"""

import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("="*80)
print("🔍 INSPECTING EXISTING TABLES")
print("="*80)

# ============================================================================
# Table 1: tools
# ============================================================================
print("\n📦 Table: tools")
print("-" * 80)

try:
    # Get a sample tool entry if it exists
    result = supabase.table('tools').select('*').limit(5).execute()
    
    if result.data and len(result.data) > 0:
        print(f"\n✅ Found {len(result.data)} tools in database")
        print("\n   Sample tool structure:")
        sample = result.data[0]
        for key, value in sample.items():
            value_preview = str(value)[:100] if value else "NULL"
            print(f"   • {key:<20} = {value_preview}")
            
        # Show the tool_config structure
        if 'tool_config' in sample and sample['tool_config']:
            print(f"\n   tool_config structure:")
            config = sample['tool_config']
            if isinstance(config, dict):
                for key in config.keys():
                    print(f"     - {key}")
    else:
        print("   ⚠️  No tools found (empty table)")
        print("   Expected columns: id, name, description, tool_config, created_at, updated_at")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

# ============================================================================
# Table 2: prompts
# ============================================================================
print("\n📦 Table: prompts")
print("-" * 80)

try:
    result = supabase.table('prompts').select('*').limit(5).execute()
    
    if result.data and len(result.data) > 0:
        print(f"\n✅ Found {len(result.data)} prompts")
        print("\n   Sample prompt structure:")
        sample = result.data[0]
        for key, value in sample.items():
            value_preview = str(value)[:100] if value else "NULL"
            print(f"   • {key:<20} = {value_preview}")
    else:
        print("   ⚠️  No prompts found (empty table)")
        print("   Attempting to query schema...")
        
        # Try to get schema by attempting an insert and catching the error
        try:
            result = supabase.table('prompts').insert({}).execute()
        except Exception as insert_error:
            error_msg = str(insert_error)
            if 'null value in column' in error_msg.lower():
                # Extract column name from error
                print(f"   Schema hint from error: {error_msg[:200]}")
                
except Exception as e:
    print(f"   ❌ Error: {e}")

# ============================================================================
# Table 3: flows
# ============================================================================
print("\n📦 Table: flows")
print("-" * 80)

try:
    result = supabase.table('flows').select('*').limit(5).execute()
    
    if result.data and len(result.data) > 0:
        print(f"\n✅ Found {len(result.data)} flows")
        print("\n   Sample flow structure:")
        sample = result.data[0]
        for key, value in sample.items():
            value_preview = str(value)[:100] if value else "NULL"
            print(f"   • {key:<20} = {value_preview}")
    else:
        print("   ⚠️  No flows found (empty table)")
        print("   Attempting to query schema...")
        
        # Try to get schema by attempting an insert and catching the error
        try:
            result = supabase.table('flows').insert({}).execute()
        except Exception as insert_error:
            error_msg = str(insert_error)
            if 'null value in column' in error_msg.lower():
                # Extract column name from error
                print(f"   Schema hint from error: {error_msg[:200]}")
                
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "="*80)
print("📋 ANALYSIS & RECOMMENDATIONS")
print("="*80)

print("""
Based on discovered tables, here's how we can map the backend requirements:

EXISTING TABLES:
1. ✅ tools (catalog schema)
   - Has: id, name, description, tool_config, created_at, updated_at
   - Maps to: Backend "Tools" requirement
   - tool_config is JSON - can store full ToolConfig

2. ✅ prompts (catalog schema)  
   - Empty/structure unknown
   - Maps to: Backend "Prompts" requirement
   
3. ✅ flows (orchestration schema)
   - Empty/structure unknown
   - Maps to: Backend "Workflows" requirement

MISSING TABLES (need to create):
- ❌ projects (or workspaces)
- ❌ mcp_configs (LLM configurations)
- ❌ response_configs (response handlers)

NEXT STEPS:
1. Inspect existing tools table data
2. Check if prompts/flows have correct schema
3. Create missing tables or map to existing structure
""")

print("="*80)

