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

// Intent-based source integration - different strategies per user action
function integrateSourcesForIntent(type: string, validSources: any[]): string {
  if (validSources.length === 0) return '';
  
  let sourceSection = '';
  
  switch (type) {
    case 'continue':
      // Seamless integration - weave naturally into continuation
      sourceSection = `\n\nBackground context from your research:\n`;
      validSources.forEach((source: any, index: number) => {
        const excerpt = source.content.substring(0, 400);
        sourceSection += `\n${source.name}: ${excerpt}${source.content.length > 400 ? '...' : ''}\n`;
      });
      sourceSection += `\nDraw from this context naturally as you continue writing, but don't explicitly reference it unless relevant.`;
      break;

    case 'improve':
      // Active integration - add evidence and support
      sourceSection = `\n\nSupporting evidence and references to strengthen the content:\n`;
      validSources.forEach((source: any, index: number) => {
        const excerpt = source.content.substring(0, 600);
        sourceSection += `\n${index + 1}. From "${source.name}": ${excerpt}${source.content.length > 600 ? '...' : ''}\n`;
      });
      sourceSection += `\nUse this evidence to support claims, add credibility, and strengthen arguments in the improved version.`;
      break;

    case 'expand':
      // Detail-focused integration - add specific facts and depth  
      sourceSection = `\n\nDetailed information for expansion:\n`;
      validSources.forEach((source: any, index: number) => {
        const excerpt = source.content.substring(0, 800);
        sourceSection += `\n${index + 1}. ${source.name} (${source.type}):\n${excerpt}${source.content.length > 800 ? '...' : ''}\n`;
      });
      sourceSection += `\nUse specific facts, examples, and details from these sources to expand the content with depth and richness.`;
      break;

    case 'rewrite':
      // Accuracy-focused integration - maintain source accuracy while changing style
      sourceSection = `\n\nOriginal source material to preserve accuracy:\n`;
      validSources.forEach((source: any, index: number) => {
        const excerpt = source.content.substring(0, 500);
        sourceSection += `\n${source.name}: ${excerpt}${source.content.length > 500 ? '...' : ''}\n`;
      });
      sourceSection += `\nWhen rewriting, ensure factual accuracy matches these sources while changing expression and style.`;
      break;

    case 'summarize':
      // Key-points integration - distill source essentials
      sourceSection = `\n\nSource material for comprehensive summarization:\n`;
      validSources.forEach((source: any, index: number) => {
        const excerpt = source.content.substring(0, 600);
        sourceSection += `\n${source.name}: ${excerpt}${source.content.length > 600 ? '...' : ''}\n`;
      });
      sourceSection += `\nDistill key points from both the original text and these sources into a cohesive summary.`;
      break;

    default:
      // Fallback to generic approach
      sourceSection = `\n\nReference Sources:\n`;
      validSources.forEach((source: any, index: number) => {
        const maxSourceLength = 3000;
        const sourceContent = source.content.length > maxSourceLength 
          ? source.content.substring(0, maxSourceLength) + '...'
          : source.content;
        sourceSection += `\n${index + 1}. ${source.name} (${source.type}):\n${sourceContent}\n`;
      });
      sourceSection += `\nPlease use these sources as reference material when generating content.`;
  }
  
  return sourceSection;
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
        systemPrompt = "You are a professional writer helping to continue content. Write a natural continuation that maintains the tone, style, and topic. If background context is provided, weave insights naturally without explicit citations.";
        userPrompt = `Please continue this content naturally and coherently:\n\n${content}`;
        break;

      case 'improve':
        systemPrompt = "You are a professional editor. Improve the given text while maintaining its core meaning. Focus on clarity, flow, grammar, and impact. Use supporting evidence when provided to strengthen claims and add credibility.";
        userPrompt = `Please improve this text:\n\n${content}`;
        break;

      case 'rewrite':
        systemPrompt = "You are a professional writer. Rewrite the given text to express the same ideas in a different way. Maintain the meaning while changing the structure and wording. Preserve factual accuracy from any source material provided.";
        userPrompt = `Please rewrite this text:\n\n${content}`;
        break;

      case 'expand':
        systemPrompt = "You are a professional writer. Expand the given text by adding more detail, examples, or depth while maintaining the original message and tone. Use specific facts and details from provided sources to enrich the content.";
        userPrompt = `Please expand this text with more detail:\n\n${content}`;
        break;

      case 'summarize':
        systemPrompt = "You are a professional editor. Summarize the given text into a concise version that captures the key points and main message. Include important insights from any additional source material provided.";
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

    // Add sources with intent-based integration
    if (sources && sources.length > 0) {
      console.log(`📚 Processing ${sources.length} source(s) for "${type}" operation...`);
      
      // Simple validation - just check for basic content
      const validSources = sources.filter((source: any) => {
        const hasContent = source.content && source.content.trim().length > 20;
        console.log(`📄 Source "${source.name}": ${hasContent ? 'VALID' : 'INVALID - too short'}`);
        return hasContent;
      });
      
      console.log(`✅ Using ${validSources.length}/${sources.length} valid sources with "${type}" integration strategy`);
      
      if (validSources.length > 0) {
        // Use intent-based source integration instead of generic approach
        const sourceIntegration = integrateSourcesForIntent(type, validSources);
        userPrompt += sourceIntegration;
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
