import OpenAI from 'openai';
import pdfParse from 'pdf-parse';
import { downloadFile } from './supabase';
import { emitDocumentEvent } from './document-events';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface PDFAnalysisResult {
  documentType: string;
  confidence: number;
  summary: string;
  keyEntities: string[];
  pageCount: number;
  wordCount: number;
  insights: string[];
}

export class PDFProcessor {
  /**
   * Extract text from PDF file stored in Supabase
   */
  async extractTextFromPDF(filePath: string): Promise<{
    text: string;
    pageCount: number;
    wordCount: number;
  }> {
    try {
      console.log(`📄 Extracting text from: ${filePath}`);
      
      // Download PDF from Supabase Storage
      const fileBlob = await downloadFile(filePath);
      
      // Convert Blob to Buffer for pdf-parse
      const arrayBuffer = await fileBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Extract text using pdf-parse
      const data = await pdfParse(buffer);
      
      const text = data.text.trim();
      const pageCount = data.numpages;
      const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
      
      console.log(`✅ Real text extracted: ${text.length} characters, ${wordCount} words, ${pageCount} pages`);
      
      if (!text || text.length < 10) {
        throw new Error('PDF contains no extractable text. This might be a scanned document or image-based PDF.');
      }
      
      return {
        text,
        pageCount,
        wordCount
      };
      
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze PDF content using OpenAI
   */
  async analyzePDFContent(text: string, pageCount: number): Promise<PDFAnalysisResult> {
    try {
      console.log('🧠 Analyzing PDF content with OpenAI...');
      console.log(`📊 Input stats: ${text.length} characters, ${pageCount} pages`);
      
      // Truncate text if too long (OpenAI has token limits)
      const maxLength = 12000; // ~3000 tokens
      const truncatedText = text.length > maxLength 
        ? text.substring(0, maxLength) + '...[truncated]' 
        : text;
      
      if (text.length > maxLength) {
        console.log(`✂️ Text truncated from ${text.length} to ${truncatedText.length} characters`);
      }
      
      console.log('📝 Preparing OpenAI prompt...');
      
      const prompt = `Analyze this PDF document and provide a structured analysis:

DOCUMENT CONTENT:
${truncatedText}

Please provide a JSON response with the following structure:
{
  "documentType": "contract|invoice|report|research|legal|form|presentation|manual|other",
  "confidence": 0.95,
  "summary": "Brief 2-3 sentence summary of the document",
  "keyEntities": ["entity1", "entity2", "entity3"],
  "insights": ["key insight 1", "key insight 2", "key insight 3"]
}

INSTRUCTIONS:
- documentType: Choose the most appropriate category
- confidence: Score from 0-1 indicating how confident you are in the classification
- summary: Concise overview of the main content and purpose
- keyEntities: Important names, dates, companies, amounts, or concepts mentioned
- insights: 2-3 actionable insights or notable observations about the document

Respond with valid JSON only, no other text.`;

      console.log('🚀 Sending request to OpenAI...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are a document analysis expert. Analyze documents and return structured JSON responses only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Low temperature for consistent results
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      console.log('📨 OpenAI response received');
      console.log(`🔢 Token usage: ${response.usage?.total_tokens || 'unknown'} tokens`);

      const analysisText = response.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw new Error('OpenAI returned empty response');
      }

      console.log('📋 Raw OpenAI response:', analysisText.substring(0, 200) + '...');

      // Parse the JSON response
      const analysis = JSON.parse(analysisText);
      
      console.log('✅ OpenAI analysis complete:', {
        type: analysis.documentType,
        confidence: analysis.confidence,
        summary: analysis.summary?.substring(0, 100) + '...',
        entitiesCount: analysis.keyEntities?.length || 0,
        insightsCount: analysis.insights?.length || 0
      });

      return {
        documentType: analysis.documentType || 'unknown',
        confidence: analysis.confidence || 0.5,
        summary: analysis.summary || 'No summary available',
        keyEntities: analysis.keyEntities || [],
        insights: analysis.insights || [],
        pageCount,
        wordCount: text.split(/\s+/).length
      };

    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error);
      console.error('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack'
      });
      
      // Fallback analysis if OpenAI fails
      const fallbackResult = {
        documentType: 'unknown',
        confidence: 0.0,
        summary: 'Analysis failed - unable to process document content',
        keyEntities: [],
        insights: ['Document analysis failed due to processing error'],
        pageCount,
        wordCount: text.split(/\s+/).length
      };
      
      console.log('🔄 Returning fallback analysis result:', fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Complete processing pipeline: Extract + Analyze
   */
  async processDocument(filePath: string, documentId?: string): Promise<PDFAnalysisResult> {
    console.log(`🚀 Starting document processing pipeline for: ${filePath}`);
    
    // Step 1: Extract text
    const { text, pageCount, wordCount } = await this.extractTextFromPDF(filePath);
    
    if (!text || text.length < 50) {
      throw new Error('Document appears to be empty or contains insufficient text for analysis');
    }
    
    // Emit analyzing event if documentId is provided
    if (documentId) {
      emitDocumentEvent.analyzing(documentId, 'Starting AI analysis...');
    }
    
    // Step 2: Analyze with OpenAI
    const analysis = await this.analyzePDFContent(text, pageCount);
    
    console.log('✅ Document processing pipeline complete');
    
    return analysis;
  }
}

// Export singleton instance
export const pdfProcessor = new PDFProcessor();
