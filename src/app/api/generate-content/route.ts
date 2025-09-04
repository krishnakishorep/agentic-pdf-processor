import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Embedding-based source relevance detection (copied from ai-assist)
async function getContentEmbedding(content: string, openaiClient: OpenAI): Promise<number[]> {
  try {
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: content.substring(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.log('⚠️ Embedding generation failed:', error);
    return [];
  }
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0) return 0;
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

async function filterRelevantSourcesForGeneration(
  prompt: string, 
  sources: any[], 
  openaiClient: OpenAI
): Promise<{
  relevantSources: any[],
  relevanceMessage: string
}> {
  if (sources.length === 0) {
    return { relevantSources: [], relevanceMessage: '' };
  }

  console.log('🔍 Analyzing source relevance for content generation...');

  if (prompt.length < 20) {
    console.log('⚠️ Insufficient prompt for relevance analysis, using all sources');
    return { relevantSources: sources, relevanceMessage: '' };
  }

  try {
    // Get embedding for user's prompt
    const promptEmbedding = await getContentEmbedding(prompt, openaiClient);
    
    if (promptEmbedding.length === 0) {
      console.log('⚠️ Prompt embedding failed, using all sources');
      return { relevantSources: sources, relevanceMessage: '' };
    }

    // Get embeddings for all sources and calculate similarity scores
    const sourceAnalysis = await Promise.all(
      sources.map(async (source: any) => {
        const sourceEmbedding = await getContentEmbedding(source.content, openaiClient);
        const similarity = calculateCosineSimilarity(promptEmbedding, sourceEmbedding);
        
        console.log(`📄 Source "${source.name}": similarity ${Math.round(similarity * 100)}%`);
        
        return {
          source,
          similarity,
          isRelevant: similarity > 0.75
        };
      })
    );

    const relevantSources = sourceAnalysis
      .filter(item => item.isRelevant)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.source);

    const unrelatedSources = sourceAnalysis.filter(item => !item.isRelevant);
    const hasUnrelatedSources = unrelatedSources.length > 0;

    let relevanceMessage = '';
    
    // Only show relevance messages if there are multiple sources
    if (sources.length > 1) {
      if (hasUnrelatedSources && relevantSources.length > 0) {
        const unrelatedNames = unrelatedSources.map(item => item.source.name).join(', ');
        relevanceMessage = `Note: Some sources (${unrelatedNames}) appear unrelated to your prompt. I'll focus on the most relevant sources but will do my best to incorporate useful information from all materials when appropriate.`;
      } else if (hasUnrelatedSources && relevantSources.length === 0) {
        relevanceMessage = `Note: The provided sources appear to be unrelated to your prompt. I'll do my best to create helpful content and will try to find any useful connections where possible.`;
      }
    }

    console.log(`✅ Relevance analysis complete: ${relevantSources.length}/${sources.length} relevant sources`);

    return {
      relevantSources: relevantSources.length > 0 ? relevantSources : sources,
      relevanceMessage
    };

  } catch (error) {
    console.log('❌ Relevance analysis failed:', error);
    return { relevantSources: sources, relevanceMessage: '' };
  }
}

// Intent-based source integration for content generation
function integrateSourcesForGeneration(relevantSources: any[]): string {
  if (relevantSources.length === 0) return '';
  
  // For initial content generation, use a comprehensive approach
  let sourceSection = `\n\nReference Sources for comprehensive content creation:\n`;
  
  relevantSources.forEach((source: any, index: number) => {
    const excerpt = source.content.substring(0, 1000); // More generous for initial generation
    sourceSection += `\n${index + 1}. ${source.name} (${source.type}):\n${excerpt}${source.content.length > 1000 ? '...' : ''}\n`;
  });
  
  sourceSection += `\nUse these sources to create well-researched, factually accurate content. Integrate insights naturally and cite specific examples or data points where relevant.`;
  
  return sourceSection;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, sources = [] } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Generating initial content for prompt:', prompt, 'with', sources.length, 'sources');

    // Generate title first (using faster model for simple task)
    const titleCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional editor. Generate a compelling, concise title for content based on the user\'s request. Return only the title, no quotes or extra formatting.'
        },
        {
          role: 'user',
          content: `Create a title for content about: "${prompt}"`
        }
      ],
      max_tokens: 50,
      temperature: 0.7
    });

    const title = titleCompletion.choices[0]?.message?.content?.trim() || 'AI Generated Content';

    // Use intelligent source filtering and integration
    let relevanceMessage = '';
    let sourcesContent = '';
    
    if (sources.length > 0) {
      // Basic validation - filter out sources that are too short
      const validSources = sources.filter((source: any) => {
        const hasContent = source.content && source.content.trim().length > 20;
        if (!hasContent) {
          console.log(`📄 Source "${source.name}": INVALID - too short`);
        }
        return hasContent;
      });

      if (validSources.length > 0) {
        // Use embedding-based relevance detection
        const relevanceAnalysis = await filterRelevantSourcesForGeneration(prompt, validSources, openai);
        const { relevantSources, relevanceMessage: relevanceMsg } = relevanceAnalysis;
        
        relevanceMessage = relevanceMsg;
        
        console.log(`✅ Using ${relevantSources.length}/${validSources.length} relevant sources for content generation`);
        
        if (relevantSources.length > 0) {
          // Use intelligent source integration
          sourcesContent = integrateSourcesForGeneration(relevantSources);
        }
      }
    }

    // Smart model selection based on content size
    const totalContentLength = prompt.length + title.length + sourcesContent.length;
    const estimatedTokens = Math.ceil(totalContentLength / 4);
    
    let model = 'gpt-4';
    if (estimatedTokens > 7000) {
      console.log('🔄 Using GPT-4 Turbo for large content generation...');
      model = 'gpt-4-turbo-preview';
    }

    const contentCompletion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional content writer. Create well-structured, engaging content based on the user's request. When reference sources are provided, integrate insights naturally and use specific examples or data points to support your content.

Format guidelines:
- Use markdown formatting for headers, lists, and emphasis
- Create clear sections with ## headers
- Include an engaging introduction
- Provide valuable, detailed content
- Add actionable insights where relevant
- End with a strong conclusion
- Keep the tone professional but engaging

The content should be substantial but not overwhelming - aim for 400-800 words.`
        },
        {
          role: 'user',
          content: `Create content for: "${prompt}"\n\nTitle: ${title}${sourcesContent}`
        }
      ],
      max_tokens: model === 'gpt-4-turbo-preview' ? 1500 : 1200,
      temperature: 0.7
    });

    const content = contentCompletion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    console.log(`✅ Content generated - Title: "${title}", Content: ${content.length} characters`);

    return NextResponse.json({
      success: true,
      title,
      content: content.trim(),
      relevanceMessage: relevanceMessage || undefined, // Include relevance message if present
      usage: {
        title_tokens: titleCompletion.usage?.total_tokens || 0,
        content_tokens: contentCompletion.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('❌ Content generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Content generation failed',
        success: false 
      },
      { status: 500 }
    );
  }
}
