import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';


// PDF text extraction using pdf-parse
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('📄 Extracting text using pdf-parse...');
    
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const text = data.text.trim(); // Simple cleanup
    
    console.log(`✅ Extracted ${text.length} characters from ${data.numpages} pages`);
    return text;
  } catch (error) {
    console.log('❌ pdf-parse extraction failed:', error);
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
    
    // Use proper PDF text extraction
    const extractedText = await extractTextFromPDF(buffer);
    
    if (!extractedText || extractedText.length < 20) {
      // Fallback message for PDFs that can't be processed
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
        type: 'pdf'
      });
    }
    
    console.log(`✅ PDF text extracted successfully: ${extractedText.length} characters`);
    
    return NextResponse.json({
      success: true,
      content: extractedText.length > 15000 ? extractedText.substring(0, 15000) + '...' : extractedText,
      type: 'pdf'
    });

    
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
    
    // Use OpenAI Vision API for reliable OCR processing
    try {
      console.log('🔍 Starting OCR processing with OpenAI Vision API...');
      
      const base64Image = buffer.toString('base64');
      const imageDataUrl = `data:${file.type};base64,${base64Image}`;
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured - cannot process screenshots');
      }
      
      const openai = await import('openai');
      const client = new openai.default({
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await client.chat.completions.create({
        model: "gpt-4o", // Updated to current vision model
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Extract all visible text from this image. Return only the text content without any descriptions, formatting, or commentary. If there's no readable text, respond with 'NO_TEXT_FOUND'." 
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1, // Low temperature for consistent text extraction
      });
      
      const extractedText = response.choices[0]?.message?.content?.trim();
      
      if (!extractedText || extractedText === 'NO_TEXT_FOUND' || extractedText.toLowerCase().includes('no text') || extractedText.toLowerCase().includes('cannot read')) {
        throw new Error('No readable text found in the image');
      }
      
      // Clean up the extracted text
      const cleanedContent = extractedText.replace(/\s+/g, ' ').trim();
      
      if (!cleanedContent || cleanedContent.length < 10) {
        throw new Error('Extracted text is too short or contains no meaningful content');
      }
      
      // Limit content length
      const finalContent = cleanedContent.length > 8000 
        ? cleanedContent.substring(0, 8000) + '...' 
        : cleanedContent;
      
      console.log(`✅ Screenshot OCR successful - Content: ${finalContent.length} characters`);
      
      return NextResponse.json({
        success: true,
        content: finalContent,
        type: 'screenshot'
      });
      
    } catch (ocrError: any) {
      console.error('❌ Screenshot OCR processing failed:', ocrError);
      
      // Provide a helpful fallback when OCR fails
      const fallbackContent = `Screenshot: ${file.name}

This screenshot has been uploaded but automatic text recognition (OCR) was not successful. This could happen if:
- The image has low resolution or poor quality text
- The text is too stylized or uses unusual fonts
- The image contains mainly graphics or non-text content
- No readable text is present in the image

The screenshot is still available as a source and can be referenced in your content generation requests by mentioning "${file.name}".

To improve OCR results, try:
- Using higher resolution images (minimum 300 DPI recommended)
- Ensuring text has good contrast with the background
- Cropping to focus on text areas
- Using standard fonts and avoiding decorative text
- Converting to PNG or JPEG format`;

      console.log('⚠️ OCR processing failed, using fallback message');
      
      return NextResponse.json({
        success: true,
        content: fallbackContent,
        type: 'screenshot'
      });
    }
    
  } catch (error) {
    console.error('❌ Screenshot processing failed:', error);
    throw new Error(`Failed to process screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}