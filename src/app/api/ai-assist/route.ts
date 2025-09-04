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

    // Add sources if available
    if (sources && sources.length > 0) {
      console.log(`📚 Processing ${sources.length} source(s)...`);
      
      // Simple validation - just check for basic content
      const validSources = sources.filter((source: any) => {
        const hasContent = source.content && source.content.trim().length > 20;
        console.log(`📄 Source "${source.name}": ${hasContent ? 'VALID' : 'INVALID - too short'}`);
        return hasContent;
      });
      
      console.log(`✅ Using ${validSources.length}/${sources.length} valid sources`);
      
      if (validSources.length > 0) {
        const totalSourcesLength = validSources.reduce((sum: number, s: any) => sum + s.content.length, 0);
        
        if (totalSourcesLength > 10000) {
          console.log(`📚 Large sources detected (${totalSourcesLength} chars), using summarized version`);
          userPrompt += `\n\nReference Sources (summarized):\n`;
          validSources.forEach((source: any, index: number) => {
            const preview = source.content.substring(0, 300);
            userPrompt += `\n${index + 1}. ${source.name} (${source.type}): ${preview}${source.content.length > 300 ? '...' : ''}\n`;
          });
        } else {
          userPrompt += `\n\nReference Sources:\n`;
          validSources.forEach((source: any, index: number) => {
            const maxSourceLength = 3000;
            const sourceContent = source.content.length > maxSourceLength 
              ? source.content.substring(0, maxSourceLength) + '...'
              : source.content;
            userPrompt += `\n${index + 1}. ${source.name} (${source.type}):\n${sourceContent}\n`;
          });
        }
        userPrompt += `\nPlease use these sources as reference material when generating content.`;
      }
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

    // Generate title suggestion if this is a significant content update
    let suggestedTitle = null;
    if ((type === 'continue' && result.length > 300) || (context && context.length + result.length > 500)) {
      try {
        console.log('🏷️ Generating title suggestion...');
        
        const titlePrompt = `Based on this content, suggest a concise, descriptive title (maximum 8 words):

CONTENT:
${type === 'continue' ? context + '\n\n' + result : context}

Instructions:
- Return ONLY the title, no quotes or formatting
- Make it engaging and descriptive
- Keep it under 8 words
- Focus on the main topic or theme`;

        const titleResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Use faster model for title generation
          messages: [
            { role: 'system', content: 'You are a professional editor who creates engaging, concise titles.' },
            { role: 'user', content: titlePrompt }
          ],
          max_tokens: 50,
          temperature: 0.7,
        });

        const title = titleResponse.choices[0]?.message?.content?.trim();
        if (title && title.length > 0 && title.length < 100) {
          suggestedTitle = title.replace(/^["']|["']$/g, ''); // Remove quotes if present
          console.log(`✅ Title suggested: "${suggestedTitle}"`);
        }
      } catch (titleError) {
        console.log('⚠️ Title generation failed, skipping:', titleError);
      }
    }

    return NextResponse.json({
      success: true,
      content: result.trim(),
      type,
      suggestedTitle,
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
