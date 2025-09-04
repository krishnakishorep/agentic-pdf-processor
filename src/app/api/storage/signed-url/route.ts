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

    console.log(`🔗 Getting signed URL for: ${filePath}`);

    // Get signed URL from Supabase storage (works even if bucket is private)
    const { data, error } = await supabase.storage
      .from('pdf-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('❌ Failed to create signed URL:', error);
      return NextResponse.json(
        { 
          error: 'Failed to create signed URL',
          details: error.message 
        },
        { status: 500 }
      );
    }

    if (!data?.signedUrl) {
      return NextResponse.json(
        { error: 'Failed to generate signed URL' },
        { status: 500 }
      );
    }

    console.log(`✅ Signed URL created: ${data.signedUrl}`);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('❌ Error creating signed URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create signed URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
