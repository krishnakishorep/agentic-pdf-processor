import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { createWorker } from 'tesseract.js';

// Helper function to clean extracted text and remove binary/garbled characters
function cleanExtractedText(text: string): string {
  if (!text || text.length === 0) return '';
  
  try {
    // Remove non-printable characters, but keep basic punctuation and letters
    let cleanText = text
      // Keep only printable ASCII characters, spaces, and common unicode letters
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, ' ')
      // Remove sequences of special characters that look like encoding issues
      .replace(/[^\w\s\.\,\!\?\-\:\;\(\)\[\]\{\}\"\'\/\\&@#\$%\^*+=<>~`|]/g, ' ')
      // Remove single characters surrounded by spaces (common in garbled text)
      .replace(/\s[^\w\s]\s/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim();
    
    // If the text contains too many short "words" (likely garbled), filter them out
    const words = cleanText.split(' ').filter(word => {
      // Keep words that are:
      // - Length > 2 OR
      // - Common short words OR  
      // - Numbers OR
      // - Single letters that are likely meaningful (A, I, etc.)
      return word.length > 2 || 
             /^(a|an|at|be|by|do|go|he|if|in|is|it|me|my|no|of|on|or|so|to|up|us|we|I|A)$/i.test(word) ||
             /^\d+$/.test(word) ||
             /^[a-zA-Z]$/.test(word);
    });
    
    // If we filtered out too many words, the original text was likely garbled
    const filteredText = words.join(' ');
    const wordsKeptRatio = words.length / Math.max(cleanText.split(' ').length, 1);
    
    // If we kept less than 30% of words, the text is likely too garbled to use
    if (wordsKeptRatio < 0.3 && filteredText.length < 100) {
      console.log('⚠️ Text appears to be heavily garbled, filtering out');
      return '';
    }
    
    return filteredText;
    
  } catch (error) {
    console.log('❌ Text cleaning failed:', error);
    return '';
  }
}

// Helper function to extract text from PDF buffer using basic string extraction
async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  try {
    // Simple text extraction from PDF binary data
    const pdfString = buffer.toString('binary');
    const rawText = extractBasicTextFromPDFString(pdfString);
    return cleanExtractedText(rawText);
  } catch (error) {
    console.log('Buffer extraction failed:', error);
    return '';
  }
}

// Helper function to extract basic text from PDF string data
function extractBasicTextFromPDFString(pdfString: string): string {
  try {
    // Look for text objects in PDF structure
    const textMatches = [];
    
    // Find text between parentheses (basic PDF text objects)
    const parenRegex = /\(([^)]+)\)/g;
    let match;
    while ((match = parenRegex.exec(pdfString)) !== null) {
      if (match[1] && match[1].length > 1) {
        textMatches.push(match[1]);
      }
    }
    
    // Find text between square brackets
    const bracketRegex = /\[([^\]]+)\]/g;
    while ((match = bracketRegex.exec(pdfString)) !== null) {
      if (match[1] && match[1].length > 1 && !match[1].includes('/')) {
        textMatches.push(match[1]);
      }
    }
    
    // Find stream text content (more advanced)
    const streamRegex = /stream[\s\n\r]+(.*?)[\s\n\r]+endstream/gm;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      if (match[1]) {
        // Extract readable text from stream
        const streamText = match[1].replace(/[^\x20-\x7E]/g, ' ').trim();
        if (streamText.length > 10) {
          textMatches.push(streamText);
        }
      }
    }
    
    // Combine and clean up text
    let extractedText = textMatches.join(' ');
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanExtractedText(extractedText);
  } catch (error) {
    console.log('String extraction failed:', error);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Handle URL processing
    if (contentType?.includes('application/json')) {
      const { type, url } = await request.json();
      
      if (type === 'url') {
        return await processUrl(url);
      }
      
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }
    
    // Handle file processing
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('type') as string;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      if (type === 'pdf') {
        return await processPdf(file);
      } else if (type === 'screenshot') {
        return await processScreenshot(file);
      }
      
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Source processing error:', error);
    
    // More specific error handling
    let errorMessage = 'Processing failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.message.includes('Invalid URL') || 
          error.message.includes('Invalid file type') || 
          error.message.includes('file too large')) {
        statusCode = 400; // Bad Request
      } else if (error.message.includes('timeout') || 
                 error.message.includes('network')) {
        statusCode = 408; // Request Timeout
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        success: false 
      },
      { status: statusCode }
    );
  }
}

async function processUrl(url: string) {
  console.log('🌐 Processing URL:', url);
  
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format. Please provide a valid URL starting with http:// or https://');
    }
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Launch puppeteer browser with robust configuration and timeout
    const browser = await Promise.race([
      puppeteer.launch({
        headless: true,
        timeout: 30000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Browser launch timeout')), 30000)
      )
    ]);
    
    let page;
    
    try {
      page = await browser.newPage();
      
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1200, height: 800 });
      
      // Set extra headers to appear more like a real browser
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      });
      
      // Navigate to URL with timeout and retries
      console.log(`🔍 Loading webpage: ${url}`);
      let navigationSuccess = false;
      
      // Try multiple navigation strategies
      try {
        console.log(`📍 Trying domcontentloaded strategy...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        navigationSuccess = true;
      } catch (navError1: any) {
        console.log(`⚠️ domcontentloaded failed:`, navError1?.message);
        try {
          console.log(`📍 Trying load strategy...`);
          await page.goto(url, { waitUntil: 'load', timeout: 20000 });
          navigationSuccess = true;
        } catch (navError2: any) {
          console.log(`⚠️ load failed:`, navError2?.message);
          try {
            console.log(`📍 Trying networkidle2 strategy...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            navigationSuccess = true;
          } catch (navError3: any) {
            throw new Error(`Failed to load webpage after 3 attempts: ${navError3?.message || 'Unknown error'}`);
          }
        }
      }
      
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get page content
      const htmlContent = await page.content();
      
      await page.close();
      await browser.close();
      
      // Parse with cheerio for better text extraction
      const $ = cheerio.load(htmlContent);
      
      // Remove script and style elements
      $('script, style, nav, header, footer, aside').remove();
      
      // Extract title
      const title = $('title').text().trim() || 
                    $('h1').first().text().trim() || 
                    'Web Content';
      
      // Extract main content
      let content = '';
      
      // Try to find main content area
      const mainSelectors = [
        'main', 
        '[role="main"]', 
        '.content', 
        '.main-content', 
        '.article-content',
        'article',
        '.post-content',
        '.entry-content'
      ];
      
      let mainContent = null;
      for (const selector of mainSelectors) {
        mainContent = $(selector).first();
        if (mainContent.length > 0) break;
      }
      
      if (mainContent && mainContent.length > 0) {
        content = mainContent.text().replace(/\s+/g, ' ').trim();
      } else {
        // Fallback to body content
        content = $('body').text().replace(/\s+/g, ' ').trim();
      }
      
      // Clean up content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      
      // Limit content length
      if (content.length > 10000) {
        content = content.substring(0, 10000) + '...';
      }
      
      // More lenient content check
      if (!content || content.length < 50) {
        // Try alternative extraction methods
        console.log('🔄 Trying alternative content extraction...');
        
        // Try getting text from paragraphs, divs, and spans
        const textElements = $('p, div, span').map(function() {
          return $(this).text().trim();
        }).get().filter(text => text.length > 10);
        
        if (textElements.length > 0) {
          content = textElements.join(' ').replace(/\s+/g, ' ').trim();
          if (content.length > 10000) {
            content = content.substring(0, 10000) + '...';
          }
        }
        
        if (!content || content.length < 30) {
          throw new Error('Could not extract meaningful content from the webpage. The page might require JavaScript, have restricted access, or be mostly visual content.');
        }
      }
      
      console.log(`✅ URL processed - Title: "${title}", Content: ${content.length} characters`);
      
      return NextResponse.json({
        success: true,
        title,
        content,
        url,
        type: 'url'
      });
      
    } catch (error) {
      try {
        if (page) await page.close();
      } catch (closeError) {
        console.warn('Warning: Could not close page:', closeError);
      }
      try {
        await browser.close();
      } catch (closeError) {
        console.warn('Warning: Could not close browser:', closeError);
      }
      throw error;
    }
    
  } catch (error) {
    console.error('❌ URL processing failed:', error);
    throw new Error(`Failed to process URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processPdf(file: File) {
  console.log('📄 Processing PDF:', file.name);
  
  try {
    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }
    
    // Validate file size (20MB limit for PDFs)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('PDF file too large. Please upload a PDF under 20MB.');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('🔍 Starting PDF text extraction using pdf-lib...');
    
    try {
      // Use pdf-lib which is already in dependencies and more reliable
      const { PDFDocument } = await import('pdf-lib');
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(buffer);
      const pages = pdfDoc.getPages();
      const numPages = pages.length;
      
      console.log(`📄 PDF loaded: ${numPages} pages`);
      
      // For pdf-lib, we need to extract text differently since it's primarily for PDF creation
      // Let's try a simpler approach using the buffer directly with a custom text extractor
      const content = await extractTextFromPDFBuffer(buffer);
      
      if (!content || content.length < 30) {
        throw new Error('Could not extract text from PDF. This PDF might be image-based, scanned, or password-protected. Try using OCR on screenshots instead.');
      }
      
      console.log(`✅ PDF text extracted: ${content.length} characters`);
      
      return NextResponse.json({
        success: true,
        content: content.substring(0, 15000) + (content.length > 15000 ? '...' : ''),
        pages: numPages,
        type: 'pdf'
      });
      
    } catch (pdfLibError) {
      console.log('⚠️ pdf-lib extraction failed, trying alternative method...', pdfLibError);
      
      // Fallback: Simple text extraction attempt
      const textContent = buffer.toString('utf8');
      const rawExtractedText = extractBasicTextFromPDFString(textContent);
      const extractedText = cleanExtractedText(rawExtractedText);
      
      if (extractedText && extractedText.length >= 30) {
        console.log('✅ Fallback text extraction successful');
        
        return NextResponse.json({
          success: true,
          content: extractedText.substring(0, 15000) + (extractedText.length > 15000 ? '...' : ''),
          pages: 1, // Unknown page count
          type: 'pdf'
        });
      }
      
      // If we still don't have good text, provide a helpful message
      const fallbackContent = `PDF Document: ${file.name}

This PDF has been uploaded but text extraction was not successful. This could happen if:
- The PDF contains mainly images or scanned content
- The PDF is password protected or encrypted  
- The PDF uses non-standard text encoding

The document is still available as a source, but no preview text can be displayed. You can reference this document in your content generation requests.`;

      console.log('⚠️ PDF text extraction failed, using fallback message');
      
      return NextResponse.json({
        success: true,
        content: fallbackContent,
        pages: 1,
        type: 'pdf'
      });
    }

    
  } catch (error) {
    console.error('❌ PDF processing failed:', error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function processScreenshot(file: File) {
  console.log('📷 Processing screenshot:', file.name);
  
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.');
    }
    
    // Validate file size (10MB limit for images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Image file too large. Please upload an image under 10MB.');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Initialize Tesseract worker with error handling
    const worker = await createWorker('eng');
    
    try {
      console.log('🔍 Starting OCR processing...');
      const { data: { text } } = await worker.recognize(buffer);
      
      let content = text.trim();
      
      if (!content || content.length < 10) {
        throw new Error('Could not extract text from image or image contains no readable text');
      }
      
      // Clean up OCR content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s\.\,\!\?\-\:\;\(\)]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Limit content length
      if (content.length > 8000) {
        content = content.substring(0, 8000) + '...';
      }
      
      console.log(`✅ Screenshot processed - Content: ${content.length} characters`);
      
      return NextResponse.json({
        success: true,
        content,
        type: 'screenshot'
      });
      
    } finally {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.warn('⚠️ Warning: Failed to terminate OCR worker:', terminateError);
      }
    }
    
  } catch (error) {
    console.error('❌ Screenshot processing failed:', error);
    throw new Error(`Failed to process screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}