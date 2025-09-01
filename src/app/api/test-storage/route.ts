import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🗂️ Testing storage bucket...');
    
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list storage buckets',
        details: bucketsError.message
      }, { status: 500 });
    }
    
    console.log('📋 Available buckets:', buckets?.map(b => b.name));
    
    // Test 2: Check if pdf-documents bucket exists
    const pdfBucket = buckets?.find(b => b.name === 'pdf-documents');
    
    if (!pdfBucket) {
      console.log('⚠️ pdf-documents bucket not found');
      return NextResponse.json({
        success: false,
        error: 'Storage bucket missing',
        message: 'pdf-documents bucket not found. Please create it in Supabase Dashboard.',
        availableBuckets: buckets?.map(b => b.name) || []
      });
    }
    
    // Test 3: Try to list files in the bucket (should be empty initially)
    const { data: files, error: filesError } = await supabase.storage
      .from('pdf-documents')
      .list('documents', { limit: 1 });
      
    if (filesError) {
      console.log('⚠️ Cannot access bucket contents:', filesError.message);
      return NextResponse.json({
        success: false,
        error: 'Cannot access bucket',
        details: filesError.message,
        bucketExists: true
      });
    }
    
    console.log('✅ Storage bucket accessible');
    
    return NextResponse.json({
      success: true,
      message: 'Storage bucket ready',
      bucketInfo: {
        name: pdfBucket.name,
        id: pdfBucket.id,
        public: pdfBucket.public,
        createdAt: pdfBucket.created_at
      },
      fileCount: files?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Storage test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
