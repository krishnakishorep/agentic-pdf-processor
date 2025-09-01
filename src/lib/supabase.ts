import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!');
  console.error('Please check your .env.local file:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL should be your Supabase project URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY should be your Supabase anon key');
  console.error('\nCurrent values:');
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'MISSING'}`);
  console.error(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[SET]' : 'MISSING'}`);
  
  throw new Error(
    'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file'
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No authentication needed for open platform
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Helper function to upload PDF files
export async function uploadPDF(file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { data, error } = await supabase.storage
    .from('pdf-documents')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  return {
    path: data.path,
    fileName: fileName,
    originalName: file.name,
    size: file.size
  };
}

// Helper function to get public URL for uploaded file
export function getPublicUrl(path: string) {
  const { data } = supabase.storage
    .from('pdf-documents')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Helper function to download file
export async function downloadFile(path: string) {
  const { data, error } = await supabase.storage
    .from('pdf-documents')
    .download(path);
    
  if (error) {
    throw error;
  }
  
  return data;
}
