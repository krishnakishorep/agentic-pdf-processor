import { NextRequest, NextResponse } from 'next/server';
import { documentEvents, DocumentEvent } from '@/lib/document-events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  console.log(`🔌 SSE Connection requested for document: ${documentId}`);

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const initMessage = `data: ${JSON.stringify({
        type: 'connected',
        documentId,
        message: 'Connected to document events',
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      controller.enqueue(encoder.encode(initMessage));

      // Set up event listener for this document
      const cleanup = documentEvents.onDocumentEvent(documentId, (event: DocumentEvent) => {
        try {
          console.log(`🔍 SERVER: About to send SSE event [${documentId}]:`, event.status, event.message);
          const sseMessage = `data: ${JSON.stringify({
            type: 'status',
            ...event
          })}\n\n`;
          
          controller.enqueue(encoder.encode(sseMessage));
          console.log(`📤 SSE Sent [${documentId}]: ${event.status}`);
        } catch (error) {
          console.error('❌ SSE Send Error:', error);
        }
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          
          controller.enqueue(encoder.encode(heartbeatMessage));
        } catch (error) {
          console.error('❌ SSE Heartbeat Error:', error);
          clearInterval(heartbeat);
          cleanup();
        }
      }, 30000); // Every 30 seconds

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        console.log(`🔌 SSE Connection closed for document: ${documentId}`);
        clearInterval(heartbeat);
        cleanup();
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
        }
      });
    },

    cancel() {
      console.log(`🔌 SSE Stream cancelled for document: ${documentId}`);
    }
  });

  // Return SSE response
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
