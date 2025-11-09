-- ============================================================================
-- Migration: Create Missing Tables for MCP Builder
-- Description: Adds projects, mcp_configs, and response_configs tables
-- Author: AI Assistant
-- Date: 2025-11-09
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: projects
-- Purpose: Top-level container for organizing tools, prompts, and workflows
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Could reference auth.users(id) if auth is set up
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- Add comment
COMMENT ON TABLE public.projects IS 'Top-level projects that contain tools, prompts, and workflows';

-- ============================================================================
-- Table: mcp_configs
-- Purpose: LLM configurations with model settings and selected tools
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mcp_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT DEFAULT 'gpt-4o-mini',
  temperature FLOAT DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
  system_prompt TEXT,
  instruction TEXT,
  selected_tool_ids UUID[] DEFAULT '{}', -- Array of tool IDs from tools table
  deployment_status TEXT DEFAULT 'not-deployed' CHECK (deployment_status IN ('not-deployed', 'deploying', 'deployed', 'failed')),
  deployment_url TEXT,
  deployed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcp_configs_project_id ON public.mcp_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_mcp_configs_deployment_status ON public.mcp_configs(deployment_status);

-- Add comment
COMMENT ON TABLE public.mcp_configs IS 'LLM configurations with model settings, prompts, and tool selections';

-- ============================================================================
-- Table: response_configs
-- Purpose: Response handler configurations for post-processing
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.response_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'raw-output' CHECK (type IN ('raw-output', 'llm-reprocess')),
  reprocess_instructions TEXT,
  error_handling TEXT DEFAULT 'pass-through' CHECK (error_handling IN ('pass-through', 'retry', 'fallback')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_response_configs_project_id ON public.response_configs(project_id);

-- Add comment
COMMENT ON TABLE public.response_configs IS 'Response handler configurations for processing API responses';

-- ============================================================================
-- Modify Existing Tables: Add project_id foreign keys
-- ============================================================================

-- Add project_id to tools table
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tools_project_id ON public.tools(project_id);

-- Add project_id to prompts table
ALTER TABLE public.prompts 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_prompts_project_id ON public.prompts(project_id);

-- Add project_id to flows table
ALTER TABLE public.flows 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_flows_project_id ON public.flows(project_id);

-- ============================================================================
-- Create default project for existing data
-- ============================================================================

INSERT INTO public.projects (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Project',
  'Automatically created project for existing tools and data'
)
ON CONFLICT (id) DO NOTHING;

-- Assign existing tools to default project
UPDATE public.tools
SET project_id = '00000000-0000-0000-0000-000000000001'
WHERE project_id IS NULL;

-- Assign existing prompts to default project
UPDATE public.prompts
SET project_id = '00000000-0000-0000-0000-000000000001'
WHERE project_id IS NULL;

-- Assign existing flows to default project
UPDATE public.flows
SET project_id = '00000000-0000-0000-0000-000000000001'
WHERE project_id IS NULL;

-- ============================================================================
-- Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic updated_at updates
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_configs_updated_at BEFORE UPDATE ON public.mcp_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_configs_updated_at BEFORE UPDATE ON public.response_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Enable Row Level Security (RLS) - Optional but recommended
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_configs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- Example: Allow all operations for authenticated users on their own projects
CREATE POLICY "Users can manage their own projects" ON public.projects
  FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their project's mcp configs" ON public.mcp_configs
  FOR ALL
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their project's response configs" ON public.response_configs
  FOR ALL
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Run these to verify the migration
/*
SELECT 'projects' as table_name, COUNT(*) as row_count FROM public.projects
UNION ALL
SELECT 'mcp_configs', COUNT(*) FROM public.mcp_configs
UNION ALL
SELECT 'response_configs', COUNT(*) FROM public.response_configs
UNION ALL
SELECT 'tools', COUNT(*) FROM public.tools
UNION ALL
SELECT 'prompts', COUNT(*) FROM public.prompts
UNION ALL
SELECT 'flows', COUNT(*) FROM public.flows;
*/

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

/*
-- To rollback this migration, run:

DROP TRIGGER IF EXISTS update_response_configs_updated_at ON public.response_configs;
DROP TRIGGER IF EXISTS update_mcp_configs_updated_at ON public.mcp_configs;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;

ALTER TABLE public.flows DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.prompts DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.tools DROP COLUMN IF EXISTS project_id;

DROP TABLE IF EXISTS public.response_configs;
DROP TABLE IF EXISTS public.mcp_configs;
DROP TABLE IF EXISTS public.projects;
*/

