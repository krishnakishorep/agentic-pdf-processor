-- Agentic PDF Processor Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create documents table (main document storage)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  mime_type TEXT DEFAULT 'application/pdf',
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_analysis table (AI analysis results)
CREATE TABLE IF NOT EXISTS document_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  document_type TEXT, -- 'contract', 'invoice', 'report', 'research', 'legal', 'form', 'other'
  page_count INTEGER,
  text_content TEXT,
  metadata JSONB DEFAULT '{}',
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extracted_data table (structured data extraction results)
CREATE TABLE IF NOT EXISTS extracted_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- 'contract_data', 'invoice_data', 'entities', etc.
  structured_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  extraction_method TEXT, -- 'openai_gpt4', 'manual', 'regex', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_tasks table (track agent work)
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- 'document_analysis', 'data_extraction', 'content_generation', etc.
  task_type TEXT NOT NULL, -- specific task within agent
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  processing_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated_content table (AI-generated content)
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('summary', 'comparison', 'action_items', 'presentation', 'custom')),
  content_data JSONB NOT NULL,
  generation_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_analysis_document_id ON document_analysis(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_type ON document_analysis(document_type);
CREATE INDEX IF NOT EXISTS idx_document_analysis_status ON document_analysis(analysis_status);

CREATE INDEX IF NOT EXISTS idx_extracted_data_document_id ON extracted_data(document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_type ON extracted_data(data_type);
CREATE GIN INDEX IF NOT EXISTS idx_extracted_data_content ON extracted_data USING GIN (structured_data);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_document_id ON agent_tasks(document_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_type ON agent_tasks(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_content_document_id ON generated_content(document_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(content_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_tasks_updated_at 
    BEFORE UPDATE ON agent_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create useful views for common queries
CREATE OR REPLACE VIEW documents_with_analysis AS
SELECT 
    d.*,
    da.document_type,
    da.page_count,
    da.analysis_status,
    da.confidence_score,
    da.created_at as analysis_created_at
FROM documents d
LEFT JOIN document_analysis da ON d.id = da.document_id;

CREATE OR REPLACE VIEW recent_documents AS
SELECT 
    d.id,
    d.filename,
    d.status,
    d.created_at,
    da.document_type,
    da.analysis_status,
    CASE 
        WHEN da.analysis_status = 'completed' THEN 'Analysis complete'
        WHEN da.analysis_status = 'processing' THEN 'Analyzing...'
        WHEN da.analysis_status = 'failed' THEN 'Analysis failed'
        ELSE 'Uploaded'
    END as display_status
FROM documents d
LEFT JOIN document_analysis da ON d.id = da.document_id
ORDER BY d.created_at DESC
LIMIT 10;

-- Row Level Security (RLS) policies
-- Since we're not using auth, we'll make everything publicly readable
-- but you might want to restrict this in production
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no auth required for open platform)
CREATE POLICY "Public read access" ON documents FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON documents FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON document_analysis FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON document_analysis FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON document_analysis FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON extracted_data FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON extracted_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access" ON agent_tasks FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON agent_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON agent_tasks FOR UPDATE USING (true);

CREATE POLICY "Public read access" ON generated_content FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON generated_content FOR INSERT WITH CHECK (true);

-- Create storage bucket for PDF files (run this in Supabase Storage section)
-- Note: You'll need to create this bucket manually in Supabase Dashboard
-- Bucket name: 'pdf-documents'
-- Public access: Yes (for open platform)

-- Create ai_written_content table (AI assist responses)
CREATE TABLE IF NOT EXISTS ai_written_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,              -- AI-generated title
  content TEXT NOT NULL,            -- AI-generated content
  action TEXT NOT NULL,             -- 'continue'|'improve'|'expand'|'rewrite'|'generate'
  sources JSONB DEFAULT '[]',       -- Sources used for this response
  user_input TEXT,                  -- Original user input/context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for ai_written_content
ALTER TABLE ai_written_content ENABLE ROW LEVEL SECURITY;

-- Allow public access to ai_written_content
CREATE POLICY "Public read access" ON ai_written_content FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON ai_written_content FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON ai_written_content FOR UPDATE USING (true);

-- Create view for recent AI written content
CREATE OR REPLACE VIEW recent_ai_content AS
SELECT 
    id,
    title,
    LEFT(content, 100) || '...' as preview,  -- First 100 chars for preview
    action,
    sources,
    created_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
        WHEN created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - created_at) || ' hours ago'
        WHEN created_at > NOW() - INTERVAL '7 days' THEN EXTRACT(DAY FROM NOW() - created_at) || ' days ago'
        ELSE TO_CHAR(created_at, 'Mon DD, YYYY')
    END as time_ago
FROM ai_written_content
ORDER BY created_at DESC
LIMIT 10;

COMMENT ON TABLE documents IS 'Main table storing uploaded PDF documents';
COMMENT ON TABLE document_analysis IS 'AI analysis results for documents';
COMMENT ON TABLE extracted_data IS 'Structured data extracted from documents';
COMMENT ON TABLE agent_tasks IS 'Track individual agent processing tasks';
COMMENT ON TABLE generated_content IS 'AI-generated content from documents';
COMMENT ON TABLE ai_written_content IS 'AI assist responses and generated content';
