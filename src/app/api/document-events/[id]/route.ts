import { NextRequest, NextResponse } from 'next/server';
import { documentEvents } from '@/lib/document-events';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const documentId = params.id;

  console.log(`🔌 SSE Connection requested for document: ${documentId}`);

  // Create readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  
  const customReadable = new ReadableStream({
    start(controller) {
      console.log(`✅ SSE Stream started for document: ${documentId}`);

      // Send initial connection confirmation
      const connectionMessage = `data: ${JSON.stringify({
        type: 'connected',
        documentId: documentId,
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(connectionMessage));

      // Set up event listener for this document
      const cleanup = documentEvents.onDocumentEvent(documentId, (event) => {
        console.log(`📡 SSE Sending event for ${documentId}:`, event.status);
        
        const message = `data: ${JSON.stringify({
          type: 'status',
          documentId: event.documentId,
          status: event.status,
          message: event.message,
          progress: event.progress,
          data: event.data,
          timestamp: event.timestamp
        })}\n\n`;
        
        try {
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.log('❌ SSE Controller error (client likely disconnected):', error);
          cleanup();
        }
      });

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            documentId: documentId,
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.log('❌ SSE Heartbeat error (client likely disconnected):', error);
          clearInterval(heartbeatInterval);
          cleanup();
        }
      }, 30000); // Every 30 seconds

      // Clean up on stream close
      return () => {
        console.log(`🔌 SSE Stream closed for document: ${documentId}`);
        clearInterval(heartbeatInterval);
        cleanup();
      };
    },
  });

  // Return SSE response
  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    },
  });
}
