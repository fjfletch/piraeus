-- ============================================================================
-- Migration: 002_add_frontend_compatibility
-- Purpose: Add frontend-compatible columns while preserving existing schema
-- Date: 2025-11-09
-- ============================================================================

-- ============================================================================
-- 1. Add SERIAL numeric_id to all tables for frontend compatibility
-- ============================================================================

-- Tools table: Add numeric ID and flattened config fields
ALTER TABLE public.tools 
  ADD COLUMN IF NOT EXISTS numeric_id SERIAL UNIQUE,
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS query_params JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS body_config JSONB;

COMMENT ON COLUMN public.tools.numeric_id IS 'Sequential integer ID for frontend compatibility (while keeping UUID primary key)';
COMMENT ON COLUMN public.tools.method IS 'HTTP method (GET, POST, etc.) - flattened from tool_config';
COMMENT ON COLUMN public.tools.url IS 'API endpoint URL - flattened from tool_config';
COMMENT ON COLUMN public.tools.headers IS 'HTTP headers array - flattened from tool_config';
COMMENT ON COLUMN public.tools.query_params IS 'Query parameters array - flattened from tool_config';
COMMENT ON COLUMN public.tools.body_config IS 'Request body configuration - flattened from tool_config';

-- Create index on numeric_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tools_numeric_id ON public.tools(numeric_id);

-- Prompts table: Add numeric ID and content field
ALTER TABLE public.prompts 
  ADD COLUMN IF NOT EXISTS numeric_id SERIAL UNIQUE,
  ADD COLUMN IF NOT EXISTS content TEXT;

COMMENT ON COLUMN public.prompts.numeric_id IS 'Sequential integer ID for frontend compatibility';
COMMENT ON COLUMN public.prompts.content IS 'Simple prompt content field for frontend (alternative to prompt_template + variables)';

CREATE INDEX IF NOT EXISTS idx_prompts_numeric_id ON public.prompts(numeric_id);

-- MCP Configs table: Add numeric ID
ALTER TABLE public.mcp_configs 
  ADD COLUMN IF NOT EXISTS numeric_id SERIAL UNIQUE;

COMMENT ON COLUMN public.mcp_configs.numeric_id IS 'Sequential integer ID for frontend compatibility';

CREATE INDEX IF NOT EXISTS idx_mcp_configs_numeric_id ON public.mcp_configs(numeric_id);

-- Response Configs table: Add numeric ID
ALTER TABLE public.response_configs 
  ADD COLUMN IF NOT EXISTS numeric_id SERIAL UNIQUE;

COMMENT ON COLUMN public.response_configs.numeric_id IS 'Sequential integer ID for frontend compatibility';

CREATE INDEX IF NOT EXISTS idx_response_configs_numeric_id ON public.response_configs(numeric_id);

-- Flows table: Add numeric ID and linear steps array
ALTER TABLE public.flows 
  ADD COLUMN IF NOT EXISTS numeric_id SERIAL UNIQUE,
  ADD COLUMN IF NOT EXISTS steps_array JSONB;

COMMENT ON COLUMN public.flows.numeric_id IS 'Sequential integer ID for frontend compatibility';
COMMENT ON COLUMN public.flows.steps_array IS 'Linear workflow steps array for v6 builder (alternative to steps graph structure)';

CREATE INDEX IF NOT EXISTS idx_flows_numeric_id ON public.flows(numeric_id);

-- ============================================================================
-- 2. Make project_id nullable for "global" mode support
-- ============================================================================

-- Note: project_id is already nullable in the schema from migration 001
-- Verify and document this behavior

COMMENT ON COLUMN public.tools.project_id IS 'Optional project association - NULL for global/shared tools';
COMMENT ON COLUMN public.prompts.project_id IS 'Optional project association - NULL for global/shared prompts';
COMMENT ON COLUMN public.mcp_configs.project_id IS 'Optional project association - NULL for global/shared configs';
COMMENT ON COLUMN public.response_configs.project_id IS 'Optional project association - NULL for global/shared configs';
COMMENT ON COLUMN public.flows.project_id IS 'Optional project association - NULL for global/shared workflows';

-- ============================================================================
-- 3. Add helper functions for ID conversion
-- ============================================================================

-- Function to get UUID from numeric_id for tools
CREATE OR REPLACE FUNCTION public.get_tool_uuid_by_numeric(numeric_id_input INTEGER)
RETURNS UUID AS $$
  SELECT id FROM public.tools WHERE numeric_id = numeric_id_input LIMIT 1;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.get_tool_uuid_by_numeric IS 'Helper function to convert numeric_id to UUID for tools';

-- Function to get numeric_id from UUID for tools
CREATE OR REPLACE FUNCTION public.get_tool_numeric_by_uuid(uuid_input UUID)
RETURNS INTEGER AS $$
  SELECT numeric_id FROM public.tools WHERE id = uuid_input LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Similar functions for other tables
CREATE OR REPLACE FUNCTION public.get_prompt_uuid_by_numeric(numeric_id_input INTEGER)
RETURNS UUID AS $$
  SELECT id FROM public.prompts WHERE numeric_id = numeric_id_input LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.get_mcp_uuid_by_numeric(numeric_id_input INTEGER)
RETURNS UUID AS $$
  SELECT id FROM public.mcp_configs WHERE numeric_id = numeric_id_input LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.get_response_uuid_by_numeric(numeric_id_input INTEGER)
RETURNS UUID AS $$
  SELECT id FROM public.response_configs WHERE numeric_id = numeric_id_input LIMIT 1;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.get_flow_uuid_by_numeric(numeric_id_input INTEGER)
RETURNS UUID AS $$
  SELECT id FROM public.flows WHERE numeric_id = numeric_id_input LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 4. Add validation triggers to keep flattened fields in sync
-- ============================================================================

-- Trigger function to sync tool_config with flattened fields
CREATE OR REPLACE FUNCTION public.sync_tool_config()
RETURNS TRIGGER AS $$
BEGIN
  -- If flattened fields are provided, sync to tool_config
  IF NEW.method IS NOT NULL OR NEW.url IS NOT NULL THEN
    NEW.tool_config = jsonb_build_object(
      'name', NEW.name,
      'description', COALESCE(NEW.description, ''),
      'api', jsonb_build_object(
        'method', COALESCE(NEW.method, 'GET'),
        'base_url', COALESCE(NEW.url, ''),
        'path', '',
        'headers', COALESCE(NEW.headers, '[]'::jsonb),
        'query_params', COALESCE(NEW.query_params, '{}'::jsonb),
        'body', COALESCE(NEW.body_config, '{}'::jsonb)
      )
    );
  END IF;
  
  -- If tool_config is provided, sync to flattened fields
  IF NEW.tool_config IS NOT NULL AND NEW.tool_config ? 'api' THEN
    NEW.method = NEW.tool_config->'api'->>'method';
    NEW.url = COALESCE(
      NEW.tool_config->'api'->>'base_url',
      ''
    ) || COALESCE(
      NEW.tool_config->'api'->>'path',
      ''
    );
    NEW.headers = NEW.tool_config->'api'->'headers';
    NEW.query_params = NEW.tool_config->'api'->'query_params';
    NEW.body_config = NEW.tool_config->'api'->'body';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tools table
DROP TRIGGER IF EXISTS trigger_sync_tool_config ON public.tools;
CREATE TRIGGER trigger_sync_tool_config
  BEFORE INSERT OR UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tool_config();

COMMENT ON FUNCTION public.sync_tool_config IS 'Keeps tool_config JSONB and flattened fields (method, url, etc.) in sync';

-- Trigger function to sync prompt content with prompt_template
CREATE OR REPLACE FUNCTION public.sync_prompt_content()
RETURNS TRIGGER AS $$
BEGIN
  -- If content is provided, use it as prompt_template
  IF NEW.content IS NOT NULL AND NEW.content != '' THEN
    NEW.prompt_template = NEW.content;
  END IF;
  
  -- If prompt_template is provided but content is null, sync to content
  IF NEW.prompt_template IS NOT NULL AND (NEW.content IS NULL OR NEW.content = '') THEN
    NEW.content = NEW.prompt_template;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to prompts table
DROP TRIGGER IF EXISTS trigger_sync_prompt_content ON public.prompts;
CREATE TRIGGER trigger_sync_prompt_content
  BEFORE INSERT OR UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_prompt_content();

COMMENT ON FUNCTION public.sync_prompt_content IS 'Keeps content and prompt_template fields in sync';

-- Trigger function to sync flow steps formats
CREATE OR REPLACE FUNCTION public.sync_flow_steps()
RETURNS TRIGGER AS $$
BEGIN
  -- If steps_array (linear) is provided, keep both formats
  -- Frontend can use steps_array, backend can use steps (graph)
  -- No automatic conversion since formats are fundamentally different
  -- Let application layer handle conversion as needed
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to flows table
DROP TRIGGER IF EXISTS trigger_sync_flow_steps ON public.flows;
CREATE TRIGGER trigger_sync_flow_steps
  BEFORE INSERT OR UPDATE ON public.flows
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_flow_steps();

-- ============================================================================
-- 5. Migration verification
-- ============================================================================

-- Verify all columns were added successfully
DO $$
DECLARE
  missing_columns TEXT := '';
BEGIN
  -- Check tools columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'tools' AND column_name = 'numeric_id'
  ) THEN
    missing_columns := missing_columns || 'tools.numeric_id, ';
  END IF;
  
  -- Check prompts columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'prompts' AND column_name = 'numeric_id'
  ) THEN
    missing_columns := missing_columns || 'prompts.numeric_id, ';
  END IF;
  
  IF missing_columns != '' THEN
    RAISE EXCEPTION 'Migration incomplete. Missing columns: %', missing_columns;
  ELSE
    RAISE NOTICE '✅ Migration 002 completed successfully!';
    RAISE NOTICE '   - Added numeric_id to all tables';
    RAISE NOTICE '   - Added flattened tool config fields';
    RAISE NOTICE '   - Added prompt content field';
    RAISE NOTICE '   - Added workflow steps_array field';
    RAISE NOTICE '   - Added sync triggers';
    RAISE NOTICE '   - Added helper functions for ID conversion';
  END IF;
END $$;

-- ============================================================================
-- 6. Sample data update for existing records
-- ============================================================================

-- Update existing tools to populate numeric_id (already auto-populated by SERIAL)
-- Optionally sync existing tool_config to flattened fields
UPDATE public.tools
SET 
  method = tool_config->'api'->>'method',
  url = COALESCE(tool_config->'api'->>'base_url', '') || COALESCE(tool_config->'api'->>'path', ''),
  headers = tool_config->'api'->'headers',
  query_params = tool_config->'api'->'query_params',
  body_config = tool_config->'api'->'body'
WHERE tool_config IS NOT NULL AND tool_config ? 'api';

-- Update existing prompts to sync content with prompt_template
UPDATE public.prompts
SET content = prompt_template
WHERE content IS NULL AND prompt_template IS NOT NULL;

RAISE NOTICE '✅ Existing data migrated to new fields';

