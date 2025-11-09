"""
Query Supabase Database Schema

This script connects to Supabase and retrieves the complete database schema
including all tables, columns, primary keys, and foreign key relationships.
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

print("🔍 Querying Supabase Database Schema...\n")

# Query to get all tables and columns with relationships
schema_query = """
SELECT 
    t.table_schema,
    t.table_name,
    json_agg(
        json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default,
            'is_primary_key', CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END,
            'foreign_key_table', fk.foreign_table_name,
            'foreign_key_column', fk.foreign_column_name
        ) ORDER BY c.ordinal_position
    ) as columns
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
LEFT JOIN (
    SELECT 
        ku.table_schema, 
        ku.table_name, 
        ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_schema = pk.table_schema 
    AND c.table_name = pk.table_name 
    AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT 
        ku.table_schema, 
        ku.table_name, 
        ku.column_name,
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_schema = fk.table_schema 
    AND c.table_name = fk.table_name 
    AND c.column_name = fk.column_name
WHERE t.table_type = 'BASE TABLE'
    AND t.table_schema NOT IN ('information_schema', 'pg_catalog')
GROUP BY t.table_schema, t.table_name
ORDER BY t.table_schema, t.table_name;
"""

try:
    # Execute the query using PostgREST (Supabase's API)
    # Note: We need to use rpc() for raw SQL queries
    result = supabase.rpc('exec_sql', {'query': schema_query}).execute()
    
    print("✅ Schema query executed successfully!\n")
    print("="*80)
    
    if result.data:
        for schema in result.data:
            schema_name = schema['table_schema']
            table_name = schema['table_name']
            columns = schema['columns']
            
            print(f"\n📦 {schema_name}.{table_name}")
            print("-" * 80)
            
            for col in columns:
                pk_marker = " 🔑" if col['is_primary_key'] else ""
                fk_marker = f" → {col['foreign_key_table']}.{col['foreign_key_column']}" if col['foreign_key_table'] else ""
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                
                print(f"  • {col['column_name']:<30} {col['data_type']:<20} {nullable:<10}{pk_marker}{fk_marker}")
    
    print("\n" + "="*80)
    print("✅ Schema retrieval complete!")
    
except Exception as e:
    # If RPC doesn't work, try using the REST API to query tables
    print(f"⚠️  RPC method failed: {e}")
    print("\nTrying alternative method...\n")
    
    try:
        # Get list of all schemas
        schemas_to_check = ['public', 'identity', 'secrets', 'catalog', 'orchestration', 'registry']
        
        print("="*80)
        print("SCHEMAS AND TABLES")
        print("="*80)
        
        for schema in schemas_to_check:
            print(f"\n📦 Schema: {schema}")
            print("-" * 80)
            
            try:
                # Try to query each common table pattern
                # This is a workaround since we can't do raw SQL without RPC
                result = supabase.table('_').select('*').limit(0).execute()
                print(f"  Note: Direct schema introspection requires RPC function")
                print(f"  Available via Supabase Dashboard → Database → Schema")
            except Exception as table_error:
                pass
        
        print("\n" + "="*80)
        print("ℹ️  For complete schema, please:")
        print("   1. Go to Supabase Dashboard")
        print("   2. Navigate to Database → Schema")
        print("   3. Or enable RPC function for schema queries")
        print("="*80)
        
    except Exception as e2:
        print(f"❌ Alternative method also failed: {e2}")
        print("\n💡 Recommendation:")
        print("   1. Check if SUPABASE_URL and SUPABASE_KEY are correct")
        print("   2. Verify network access to Supabase")
        print("   3. Use Supabase Dashboard to view schema")

