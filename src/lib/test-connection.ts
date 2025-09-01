// Test file to verify Supabase connection
import { supabase } from './supabase';
import { dbUtils } from './database';

export async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');

    // Test 1: Basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('documents')
      .select('count(*)', { count: 'exact', head: true });

    if (healthError) {
      throw new Error(`Database connection failed: ${healthError.message}`);
    }

    console.log('✅ Database connection successful');

    // Test 2: Get stats
    const stats = await dbUtils.getStats();
    console.log('📊 Database stats:', stats);

    // Test 3: Test storage connection
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();

    if (storageError) {
      throw new Error(`Storage connection failed: ${storageError.message}`);
    }

    const pdfBucket = buckets?.find(b => b.name === 'pdf-documents');
    if (!pdfBucket) {
      console.warn('⚠️ Warning: pdf-documents bucket not found. Please create it in Supabase Dashboard.');
    } else {
      console.log('✅ Storage bucket found');
    }

    return {
      success: true,
      message: 'All connections successful',
      stats,
      hasStorageBucket: !!pdfBucket
    };

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    };
  }
}
