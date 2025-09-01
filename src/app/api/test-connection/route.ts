import { NextResponse } from 'next/server';
import { testSupabaseConnection } from '@/lib/test-connection';

export async function GET() {
  try {
    const result = await testSupabaseConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        stats: result.stats,
        hasStorageBucket: result.hasStorageBucket
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          error: result.error
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
