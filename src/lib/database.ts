import { supabase } from './supabase';
import type { 
  Document, 
  DocumentInsert, 
  DocumentUpdate,
  DocumentAnalysis,
  DocumentAnalysisInsert,
  ExtractedData,
  ExtractedDataInsert,
  AgentTask,
  AgentTaskInsert,
  AgentTaskUpdate,
  GeneratedContent,
  GeneratedContentInsert,
  ProcessedDocument
} from './database.types';

// Document operations
export const documentDb = {
  // Create a new document record
  async create(document: DocumentInsert): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get document by ID
  async getById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Get document with full analysis data
  async getWithAnalysis(id: string): Promise<ProcessedDocument | null> {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        document_analysis (*),
        extracted_data (*),
        generated_content (*),
        agent_tasks (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      ...data,
      analysis: data.document_analysis?.[0] || undefined,
      extractedData: data.extracted_data || [],
      generatedContent: data.generated_content || [],
      tasks: data.agent_tasks || []
    };
  },

  // Get recent documents
  async getRecent(limit: number = 10): Promise<Document[]> {
    const { data, error } = await supabase
      .from('recent_documents') // Using the view we created
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Update document
  async update(id: string, updates: DocumentUpdate): Promise<Document> {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete document and all related data
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Document analysis operations
export const analysisDb = {
  // Create analysis record
  async create(analysis: DocumentAnalysisInsert): Promise<DocumentAnalysis> {
    const { data, error } = await supabase
      .from('document_analysis')
      .insert(analysis)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get analysis by document ID
  async getByDocumentId(documentId: string): Promise<DocumentAnalysis | null> {
    const { data, error } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  },

  // Update analysis
  async update(id: string, updates: Partial<DocumentAnalysis>): Promise<DocumentAnalysis> {
    const { data, error } = await supabase
      .from('document_analysis')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Extracted data operations
export const extractedDataDb = {
  // Create extracted data record
  async create(data: ExtractedDataInsert): Promise<ExtractedData> {
    const { data: result, error } = await supabase
      .from('extracted_data')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // Get extracted data by document ID
  async getByDocumentId(documentId: string): Promise<ExtractedData[]> {
    const { data, error } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get extracted data by type
  async getByType(documentId: string, dataType: string): Promise<ExtractedData | null> {
    const { data, error } = await supabase
      .from('extracted_data')
      .select('*')
      .eq('document_id', documentId)
      .eq('data_type', dataType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }
};

// Agent task operations
export const agentTaskDb = {
  // Create agent task
  async create(task: AgentTaskInsert): Promise<AgentTask> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update agent task
  async update(id: string, updates: AgentTaskUpdate): Promise<AgentTask> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get tasks by document ID
  async getByDocumentId(documentId: string): Promise<AgentTask[]> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get pending tasks
  async getPending(): Promise<AgentTask[]> {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// Generated content operations
export const generatedContentDb = {
  // Create generated content
  async create(content: GeneratedContentInsert): Promise<GeneratedContent> {
    const { data, error } = await supabase
      .from('generated_content')
      .insert(content)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get content by document ID
  async getByDocumentId(documentId: string): Promise<GeneratedContent[]> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get content by type
  async getByType(documentId: string, contentType: string): Promise<GeneratedContent | null> {
    const { data, error } = await supabase
      .from('generated_content')
      .select('*')
      .eq('document_id', documentId)
      .eq('content_type', contentType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }
};

// Utility functions
export const dbUtils = {
  // Get document statistics
  async getStats() {
    const [documentsResult, analysisResult, tasksResult] = await Promise.all([
      supabase.from('documents').select('status', { count: 'exact', head: true }),
      supabase.from('document_analysis').select('document_type', { count: 'exact', head: true }),
      supabase.from('agent_tasks').select('status', { count: 'exact', head: true })
    ]);

    return {
      totalDocuments: documentsResult.count || 0,
      totalAnalysis: analysisResult.count || 0,
      totalTasks: tasksResult.count || 0
    };
  },

  // Clean up old documents (for maintenance)
  async cleanupOldDocuments(daysOld: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('documents')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select();

    if (error) throw error;
    return data?.length || 0;
  }
};
