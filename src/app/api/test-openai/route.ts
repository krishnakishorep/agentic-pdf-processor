import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        message: 'Please add OPENAI_API_KEY to your .env.local file'
      }, { status: 500 });
    }
    
    if (!apiKey.startsWith('sk-')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid OpenAI API key format',
        message: 'OpenAI API key should start with "sk-"'
      }, { status: 500 });
    }
    
    console.log('🧪 Testing OpenAI connection...');
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });
    
    // Simple test call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: 'Test message. Please respond with: {"status": "working", "message": "OpenAI connection successful"}'
        }
      ],
      max_tokens: 100,
      temperature: 0,
      response_format: { type: 'json_object' }
    });
    
    const result = response.choices[0]?.message?.content;
    
    if (!result) {
      throw new Error('Empty response from OpenAI');
    }
    
    const parsedResult = JSON.parse(result);
    
    console.log('✅ OpenAI test successful');
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI connection working',
      apiKeyConfigured: true,
      testResponse: parsedResult
    });
    
  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'OpenAI test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      apiKeyConfigured: !!process.env.OPENAI_API_KEY
    }, { status: 500 });
  }
}
