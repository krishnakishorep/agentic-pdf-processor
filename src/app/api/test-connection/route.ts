import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple test to verify basic connections
 */
export async function GET() {
  try {
    console.log('🔍 Testing basic connections...');

    // Test 1: Supabase connection
    console.log('1️⃣ Testing Supabase connection...');
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Service Key: ${supabaseServiceKey ? '✅ Present' : '❌ Missing'}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test simple query
    const { data, error } = await supabase
      .from('documents_embeddings')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        error: `Supabase error: ${error.message}`,
        details: error
      });
    }

    console.log('✅ Supabase connection successful');

    // Test 2: OpenAI connection
    console.log('2️⃣ Testing OpenAI connection...');
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Test simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "test successful"' }],
      max_tokens: 10,
    });

    console.log('✅ OpenAI connection successful');

    return NextResponse.json({
      success: true,
      message: 'All connections working',
      tests: {
        supabase: '✅ Connected',
        openai: '✅ Connected',
        embeddingsTableExists: data !== null ? '✅ Table exists' : '❓ Table might not exist'
      },
      environment: {
        supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
        supabaseKey: supabaseServiceKey ? '✅ Set' : '❌ Missing',
        openaiKey: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'
      }
    });

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}