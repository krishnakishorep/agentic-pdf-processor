import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Helper function to truncate content to fit within token limits
function truncateContentForModel(content: string, maxTokens: number): string {
  const maxChars = maxTokens * 4; // Rough estimate: 4 chars per token
  
  if (content.length <= maxChars) {
    return content;
  }
  
  console.log(`🔧 Truncating content from ${content.length} to ~${maxChars} characters`);
  
  // Try to truncate at sentence boundaries
  const truncated = content.substring(0, maxChars);
  const lastSentence = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentence > maxChars * 0.8) {
    return truncated.substring(0, lastSentence + 1) + '\n\n[Content truncated to fit context limits]';
  }
  
  return truncated + '\n\n[Content truncated to fit context limits]';
}

// Helper function to summarize sources when they're too large
function summarizeSources(sources: any[]): string {
  if (!sources.length) return '';
  
  const summaries = sources.map((source, index) => {
    const preview = source.content.substring(0, 200);
    return `${index + 1}. ${source.name} (${source.type}): ${preview}${source.content.length > 200 ? '...' : ''}`;
  });
  
  return `Reference Sources (summarized):\n${summaries.join('\n\n')}`;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { type, content, context, sources = [], prompt } = await request.json();

    if (!content && type !== 'continue') {
      return NextResponse.json(
        { error: 'Content is required for this operation' },
        { status: 400 }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'continue':
        systemPrompt = "You are a professional writer helping to continue content. Write a natural continuation that maintains the tone, style, and topic of the existing content.";
        userPrompt = `Please continue this content naturally and coherently:\n\n${content}`;
        break;

      case 'improve':
        systemPrompt = "You are a professional editor. Improve the given text while maintaining its core meaning. Focus on clarity, flow, grammar, and impact.";
        userPrompt = `Please improve this text:\n\n${content}`;
        break;

      case 'rewrite':
        systemPrompt = "You are a professional writer. Rewrite the given text to express the same ideas in a different way. Maintain the meaning while changing the structure and wording.";
        userPrompt = `Please rewrite this text:\n\n${content}`;
        break;

      case 'expand':
        systemPrompt = "You are a professional writer. Expand the given text by adding more detail, examples, or depth while maintaining the original message and tone.";
        userPrompt = `Please expand this text with more detail:\n\n${content}`;
        break;

      case 'summarize':
        systemPrompt = "You are a professional editor. Summarize the given text into a concise version that captures the key points and main message.";
        userPrompt = `Please summarize this text:\n\n${content}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid assistance type' },
          { status: 400 }
        );
    }

    // Add context if available (except for continue type)
    if (context && type !== 'continue' && context !== content) {
      userPrompt += `\n\nContext (full document):\n${context}`;
    }

    // Add sources if available with smart truncation
    if (sources && sources.length > 0) {
      const totalSourcesLength = sources.reduce((sum: number, s: any) => sum + s.content.length, 0);
      
      if (totalSourcesLength > 8000) {
        console.log(`📚 Large sources detected (${totalSourcesLength} chars), using summarized version`);
        userPrompt += `\n\n${summarizeSources(sources)}`;
      } else {
        userPrompt += `\n\nReference Sources:\n`;
        sources.forEach((source: any, index: number) => {
          const maxSourceLength = 2000; // Limit each source
          const sourceContent = source.content.length > maxSourceLength 
            ? source.content.substring(0, maxSourceLength) + '...'
            : source.content;
          userPrompt += `\n${index + 1}. ${source.name} (${source.type}):\n${sourceContent}\n`;
        });
      }
      userPrompt += `\nPlease use these sources as reference material when generating content.`;
    }

    // Add custom prompt if provided
    if (prompt) {
      userPrompt += `\n\nAdditional instructions: ${prompt}`;
    }

    console.log(`🤖 AI Assist - Type: ${type}, Content length: ${content?.length || 0}, Sources: ${sources.length}`);

    // Calculate approximate token count (rough estimate: 4 chars = 1 token)
    const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    console.log(`📊 Estimated tokens: ${estimatedTokens}`);

    // Choose appropriate model based on content size
    let model = 'gpt-4';
    let maxTokens = type === 'continue' ? 800 : 500;

    if (estimatedTokens > 7000) {
      console.log('🔄 Switching to GPT-4 Turbo for large content...');
      model = 'gpt-4-turbo-preview';
      maxTokens = type === 'continue' ? 1000 : 600;
    } else if (estimatedTokens > 6000) {
      console.log('⚠️ Content is large, truncating sources...');
      // Truncate sources to fit within token limit
      userPrompt = truncateContentForModel(userPrompt, 6000);
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: type === 'improve' || type === 'summarize' ? 0.3 : 0.7,
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      throw new Error('No response from AI');
    }

    console.log(`✅ AI Assist complete - Generated ${result.length} characters`);

    return NextResponse.json({
      success: true,
      content: result.trim(),
      type,
      usage: completion.usage
    });

  } catch (error) {
    console.error('❌ AI Assist error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'AI assistance failed',
        success: false 
      },
      { status: 500 }
    );
  }
}
