import { EventEmitter } from 'events';

export interface DocumentEvent {
  documentId: string;
  status: 'uploaded' | 'processing' | 'analyzing' | 'completed' | 'failed';
  message: string;
  progress?: number;
  data?: any;
  timestamp: string;
}

export type DocumentEventHandler = (event: DocumentEvent) => void;

// Global event bus for document processing events
class DocumentEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase max listeners to handle multiple concurrent document processing
    this.setMaxListeners(100);
  }

  // Emit a document event
  emitDocumentEvent(event: DocumentEvent) {
    console.log(`📡 SSE Event [${event.documentId}]: ${event.status} - ${event.message}`);
    console.log(`🔍 EMITTING to listeners - document:${event.documentId} and document:all`);
    console.log(`🔍 Document-specific listeners:`, this.listenerCount(`document:${event.documentId}`));
    console.log(`🔍 Global listeners:`, this.listenerCount('document:all'));
    this.emit(`document:${event.documentId}`, event);
    this.emit('document:all', event);
  }

  // Listen for events for a specific document
  onDocumentEvent(documentId: string, handler: DocumentEventHandler): () => void {
    this.on(`document:${documentId}`, handler);
    return () => this.off(`document:${documentId}`, handler);
  }

  // Listen for all document events
  onAllDocumentEvents(handler: DocumentEventHandler): () => void {
    this.on('document:all', handler);
    return () => this.off('document:all', handler);
  }
}

// Global singleton instance
export const documentEvents = new DocumentEventBus();

// Helper functions to emit common events
export const emitDocumentEvent = {
  uploaded: (documentId: string, filename: string) => {
    documentEvents.emitDocumentEvent({
      documentId,
      status: 'uploaded',
      message: `Document "${filename}" uploaded successfully`,
      progress: 25,
      timestamp: new Date().toISOString()
    });
  },

  processing: (documentId: string, message: string = 'Processing document...') => {
    documentEvents.emitDocumentEvent({
      documentId,
      status: 'processing',
      message,
      progress: 50,
      timestamp: new Date().toISOString()
    });
  },

  analyzing: (documentId: string, message: string = 'AI analysis in progress...') => {
    documentEvents.emitDocumentEvent({
      documentId,
      status: 'analyzing',
      message,
      progress: 75,
      timestamp: new Date().toISOString()
    });
  },

  completed: (documentId: string, data: any) => {
    documentEvents.emitDocumentEvent({
      documentId,
      status: 'completed',
      message: `Analysis complete: ${data.type} (${Math.round(data.confidence * 100)}% confidence)`,
      progress: 100,
      data,
      timestamp: new Date().toISOString()
    });
  },

  failed: (documentId: string, error: string) => {
    documentEvents.emitDocumentEvent({
      documentId,
      status: 'failed',
      message: `Processing failed: ${error}`,
      progress: 0,
      timestamp: new Date().toISOString()
    });
  }
};
