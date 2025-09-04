import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log(`🔗 Getting public URL for: ${filePath}`);

    // Get public URL from Supabase storage
    const { data } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      console.error('❌ Failed to generate public URL - no data returned');
      return NextResponse.json(
        { error: 'Failed to generate public URL - no data returned' },
        { status: 500 }
      );
    }

    console.log(`✅ Public URL generated: ${data.publicUrl}`);

    // Test if the URL is actually accessible by making a HEAD request
    try {
      const testResponse = await fetch(data.publicUrl, { method: 'HEAD' });
      console.log(`🔍 URL accessibility test: ${testResponse.status} ${testResponse.statusText}`);
      
      if (!testResponse.ok) {
        console.error(`❌ Public URL not accessible: ${testResponse.status} - ${testResponse.statusText}`);
        
        // If 400/403, might be a bucket access issue
        if (testResponse.status === 400 || testResponse.status === 403) {
          return NextResponse.json({
            success: false,
            error: 'Storage bucket not public or file not accessible',
            publicUrl: data.publicUrl,
            statusCode: testResponse.status,
            statusText: testResponse.statusText
          });
        }
      }
    } catch (testError) {
      console.error('❌ URL accessibility test failed:', testError);
    }

    return NextResponse.json({
      success: true,
      publicUrl: data.publicUrl
    });

  } catch (error) {
    console.error('❌ Error generating public URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate public URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
