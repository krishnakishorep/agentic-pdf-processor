import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    // Generate main content with smart model selection
    const totalSourcesLength = sources.reduce((sum: number, s: any) => sum + s.content.length, 0);
    const promptLength = prompt.length + title.length;
    const estimatedTokens = Math.ceil((promptLength + totalSourcesLength) / 4);
    
    let model = 'gpt-4';
    let sourcesContent = '';
    
    if (sources.length > 0) {
      if (estimatedTokens > 7000) {
        console.log('🔄 Using GPT-4 Turbo for large content generation...');
        model = 'gpt-4-turbo-preview';
        // Use full sources for turbo model
        sourcesContent = `\n\nReference Sources:\n${sources.map((source: any, index: number) => 
          `${index + 1}. ${source.name} (${source.type}):\n${source.content}`
        ).join('\n\n')}\n\nPlease use these sources as reference material when generating content.`;
      } else if (totalSourcesLength > 5000) {
        console.log('📚 Large sources, using summarized version for content generation...');
        // Truncate sources for regular GPT-4
        sourcesContent = `\n\nReference Sources (summarized):\n${sources.map((source: any, index: number) => {
          const preview = source.content.substring(0, 500);
          return `${index + 1}. ${source.name} (${source.type}):\n${preview}${source.content.length > 500 ? '...' : ''}`;
        }).join('\n\n')}\n\nPlease use these sources as reference material when generating content.`;
      } else {
        sourcesContent = `\n\nReference Sources:\n${sources.map((source: any, index: number) => 
          `${index + 1}. ${source.name} (${source.type}):\n${source.content}`
        ).join('\n\n')}\n\nPlease use these sources as reference material when generating content.`;
      }
    }

    const contentCompletion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional content writer. Create well-structured, engaging content based on the user's request. 

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
