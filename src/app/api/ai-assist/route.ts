import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { queryRAG } from '@/lib/rag';

/**
 * RAG-powered AI Assist API
 * Uses Langchain for intelligent document retrieval and content generation
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * RAG-powered AI assistant for content writing
 * This endpoint now uses Langchain RAG to automatically retrieve relevant content
 */
export async function POST(request: NextRequest) {
  try {
    const { type, content, context, prompt } = await request.json();

    // Validate request
    if (!type) {
      return NextResponse.json(
        { error: 'Action type is required' },
        { status: 400 }
      );
    }

    if (!content && type !== 'continue') {
      return NextResponse.json(
        { error: 'Content is required for this operation' },
        { status: 400 }
      );
    }

    console.log(`🚀 RAG-powered AI Assist - Type: ${type}, Content: ${content?.length || 0} chars`);

    // Create RAG query based on the action type and content
    const ragQuery = await createRAGQuery(content, context, type, prompt);
    
    console.log(`🔍 RAG Query: "${ragQuery.substring(0, 150)}..."`);

    try {
      // Query the RAG system for relevant content and generate response
      const ragResponse = await queryRAG(ragQuery);

      console.log(`✅ RAG retrieved ${ragResponse.sourceDocuments?.length || 0} relevant chunks`);

      // Generate title suggestion if this is a significant update
      let suggestedTitle = null;
      if ((type === 'continue' && ragResponse.text.length > 300) || 
          (context && (context.length + ragResponse.text.length) > 500)) {
        try {
          console.log('🏷️ Generating title suggestion...');
          const titleContent = type === 'continue' 
            ? (context || '') + '\n\n' + ragResponse.text 
            : context || ragResponse.text;
          
          suggestedTitle = await generateTitleFromContent(titleContent);
        } catch (titleError) {
          console.log('⚠️ Title generation failed:', titleError);
        }
      }

      // Format source information for frontend
      const sourcesUsed = ragResponse.sourceDocuments?.map(doc => ({
        name: doc.metadata.sourceName,
        type: doc.metadata.sourceType,
        chunkIndex: doc.metadata.chunkIndex,
        totalChunks: doc.metadata.totalChunks,
        relevance: 'high' // RAG pre-filters for relevance
      })) || [];

      return NextResponse.json({
        success: true,
        content: ragResponse.text.trim(),
        type,
        suggestedTitle,
        sourcesUsed: ragResponse.sources || [],
        sourceDetails: sourcesUsed,
        ragEnabled: true,
        chunksUsed: ragResponse.sourceDocuments?.length || 0
      });

    } catch (ragError) {
      console.log('⚠️ RAG system unavailable, falling back to basic AI...');
      
      // Fallback to basic AI response without RAG
      const fallbackResponse = await generateFallbackResponse(type, content, context, prompt);
      
      return NextResponse.json({
        success: true,
        content: fallbackResponse.content,
        type,
        suggestedTitle: fallbackResponse.suggestedTitle,
        fallback: true,
        warning: 'RAG system temporarily unavailable - using basic AI response'
      });
    }

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

/**
 * Create optimized RAG query based on action type and content
 */
async function createRAGQuery(
  content: string, 
  context: string, 
  type: string, 
  prompt?: string
): Promise<string> {
  const combinedContent = `${content || ''}\n\n${context || ''}`.trim();
  
  const baseQueries = {
    continue: `Continue writing this content naturally and coherently, maintaining the same style and tone: "${combinedContent.substring(0, 800)}..."`,
    improve: `Improve this content by enhancing clarity, structure, and impact while preserving the core message: "${combinedContent.substring(0, 800)}..."`,
    expand: `Expand this content with additional relevant details, examples, and supporting information: "${combinedContent.substring(0, 800)}..."`,
    rewrite: `Rewrite this content to express the same ideas in a fresh, engaging way: "${combinedContent.substring(0, 800)}..."`,
    summarize: `Summarize the key points and main ideas from this content: "${combinedContent.substring(0, 800)}..."`
  };

  let query = baseQueries[type as keyof typeof baseQueries] || 
              `Help with this content writing task: "${combinedContent.substring(0, 800)}..."`;

  // Add custom prompt if provided
  if (prompt) {
    query += `\n\nAdditional instructions: ${prompt}`;
  }

  return query;
}

/**
 * Generate title from content using OpenAI
 */
async function generateTitleFromContent(content: string): Promise<string> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a concise, engaging title (3-8 words) that captures the main topic. Return only the title, no quotes.'
        },
        {
          role: 'user',
          content: content.substring(0, 1500) // Limit for token efficiency
        }
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim()?.replace(/^["']|["']$/g, '') || '';
  } catch (error) {
    console.error('Title generation error:', error);
    return '';
  }
}

/**
 * Fallback AI response when RAG is unavailable
 */
async function generateFallbackResponse(
  type: string, 
  content: string, 
  context: string, 
  prompt?: string
): Promise<{ content: string; suggestedTitle?: string }> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompts = {
      continue: 'Continue writing naturally, maintaining the style and flow.',
      improve: 'Improve the clarity, structure, and impact of the text.',
      expand: 'Add relevant details and depth to expand the content.',
      rewrite: 'Rewrite to express the same ideas in a fresh way.',
      summarize: 'Create a concise summary of the key points.'
    };

    const systemPrompt = systemPrompts[type as keyof typeof systemPrompts] || 'Assist with this content writing task.';
    
    let userPrompt = content || '';
    if (context && context !== content) {
      userPrompt += `\n\nContext: ${context}`;
    }
    if (prompt) {
      userPrompt += `\n\nInstructions: ${prompt}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: type === 'continue' ? 800 : 600,
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content?.trim() || 'Unable to generate response.';

    // Generate title if appropriate
    let suggestedTitle = '';
    if (type === 'continue' && result.length > 300) {
      suggestedTitle = await generateTitleFromContent((content || '') + ' ' + result);
    }

    return { content: result, suggestedTitle };
  } catch (error) {
    console.error('Fallback response error:', error);
    return { content: 'Unable to generate response at this time.' };
  }
}