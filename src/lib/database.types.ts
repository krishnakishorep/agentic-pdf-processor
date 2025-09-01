// Database types for Supabase (generated from schema)
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          filename: string;
          file_path: string;
          file_size: number;
          mime_type: string | null;
          status: 'uploaded' | 'processing' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          file_path: string;
          file_size: number;
          mime_type?: string | null;
          status?: 'uploaded' | 'processing' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string | null;
          status?: 'uploaded' | 'processing' | 'completed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
      };
      document_analysis: {
        Row: {
          id: string;
          document_id: string;
          document_type: string | null;
          page_count: number | null;
          text_content: string | null;
          metadata: any | null; // JSONB
          analysis_status: 'pending' | 'processing' | 'completed' | 'failed';
          confidence_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          document_type?: string | null;
          page_count?: number | null;
          text_content?: string | null;
          metadata?: any | null;
          analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
          confidence_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          document_type?: string | null;
          page_count?: number | null;
          text_content?: string | null;
          metadata?: any | null;
          analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
          confidence_score?: number | null;
          created_at?: string;
        };
      };
      extracted_data: {
        Row: {
          id: string;
          document_id: string;
          data_type: string;
          structured_data: any; // JSONB
          confidence_score: number | null;
          extraction_method: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          data_type: string;
          structured_data: any;
          confidence_score?: number | null;
          extraction_method?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          data_type?: string;
          structured_data?: any;
          confidence_score?: number | null;
          extraction_method?: string | null;
          created_at?: string;
        };
      };
      agent_tasks: {
        Row: {
          id: string;
          document_id: string;
          agent_type: string;
          task_type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          input_data: any | null; // JSONB
          output_data: any | null; // JSONB
          error_message: string | null;
          processing_duration_ms: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          agent_type: string;
          task_type: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          input_data?: any | null;
          output_data?: any | null;
          error_message?: string | null;
          processing_duration_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          agent_type?: string;
          task_type?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          input_data?: any | null;
          output_data?: any | null;
          error_message?: string | null;
          processing_duration_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      generated_content: {
        Row: {
          id: string;
          document_id: string;
          content_type: 'summary' | 'comparison' | 'action_items' | 'presentation' | 'custom';
          content_data: any; // JSONB
          generation_prompt: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          content_type: 'summary' | 'comparison' | 'action_items' | 'presentation' | 'custom';
          content_data: any;
          generation_prompt?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          content_type?: 'summary' | 'comparison' | 'action_items' | 'presentation' | 'custom';
          content_data?: any;
          generation_prompt?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
export type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export type DocumentAnalysis = Database['public']['Tables']['document_analysis']['Row'];
export type DocumentAnalysisInsert = Database['public']['Tables']['document_analysis']['Insert'];
export type DocumentAnalysisUpdate = Database['public']['Tables']['document_analysis']['Update'];

export type ExtractedData = Database['public']['Tables']['extracted_data']['Row'];
export type ExtractedDataInsert = Database['public']['Tables']['extracted_data']['Insert'];

export type AgentTask = Database['public']['Tables']['agent_tasks']['Row'];
export type AgentTaskInsert = Database['public']['Tables']['agent_tasks']['Insert'];
export type AgentTaskUpdate = Database['public']['Tables']['agent_tasks']['Update'];

export type GeneratedContent = Database['public']['Tables']['generated_content']['Row'];
export type GeneratedContentInsert = Database['public']['Tables']['generated_content']['Insert'];

// Helper types for common operations
export interface ProcessedDocument extends Document {
  analysis?: DocumentAnalysis;
  extractedData?: ExtractedData[];
  generatedContent?: GeneratedContent[];
  tasks?: AgentTask[];
}

export interface DocumentWithAnalysis extends Document {
  document_analysis: DocumentAnalysis[];
}
