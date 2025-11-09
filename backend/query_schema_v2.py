"""
Query Supabase Database Schema V2

This script uses the Supabase REST API to discover and inspect tables.
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
    print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Discovering Supabase Tables...\n")
print("="*80)

# Common table names to check based on the README
tables_to_check = {
    'identity': ['workspaces', 'profiles', 'memberships'],
    'secrets': ['secret_providers', 'secrets'],
    'catalog': ['tools', 'tool_versions', 'prompts', 'prompt_versions'],
    'orchestration': ['flows', 'flow_versions', 'runs', 'run_steps'],
    'registry': ['public_tools_v', 'public_prompts_v', 'public_flows_v'],
    'public': ['users', 'projects', 'integrations']  # Common public tables
}

discovered_tables = {}

for schema, table_list in tables_to_check.items():
    print(f"\n📦 Schema: {schema}")
    print("-" * 80)
    
    for table_name in table_list:
        try:
            # Try to query the table with limit 0 to get structure
            result = supabase.table(table_name).select('*').limit(0).execute()
            
            if result:
                print(f"  ✅ Found table: {table_name}")
                discovered_tables[table_name] = {
                    'schema': schema,
                    'exists': True
                }
                
                # Try to get a sample row to see column structure
                sample = supabase.table(table_name).select('*').limit(1).execute()
                if sample.data and len(sample.data) > 0:
                    columns = list(sample.data[0].keys())
                    print(f"     Columns: {', '.join(columns)}")
                    discovered_tables[table_name]['columns'] = columns
                else:
                    print(f"     (empty table - checking first insert to see structure)")
                    
        except Exception as e:
            error_str = str(e)
            if 'relation' in error_str.lower() and 'does not exist' in error_str.lower():
                print(f"  ❌ Table does not exist: {table_name}")
            elif 'permission denied' in error_str.lower():
                print(f"  🔒 Permission denied: {table_name} (exists but no access)")
                discovered_tables[table_name] = {
                    'schema': schema,
                    'exists': True,
                    'access': False
                }
            else:
                print(f"  ⚠️  Error querying {table_name}: {error_str[:100]}")

print("\n" + "="*80)
print("📊 SUMMARY")
print("="*80)
print(f"\n Total tables found: {len([t for t in discovered_tables.values() if t.get('exists')])}")
print(f"\nDiscovered Tables:")
for table_name, info in discovered_tables.items():
    if info.get('exists'):
        schema = info.get('schema', 'unknown')
        columns = info.get('columns', [])
        col_str = f" ({len(columns)} columns)" if columns else ""
        print(f"  • {schema}.{table_name}{col_str}")

print("\n" + "="*80)

# Save to JSON file for analysis
with open('/app/discovered_schema.json', 'w') as f:
    json.dump(discovered_tables, f, indent=2)

print("\n💾 Schema saved to: /app/discovered_schema.json")
print("="*80)

