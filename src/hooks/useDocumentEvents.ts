import { useEffect, useState, useCallback, useRef } from 'react';

export interface DocumentEvent {
  documentId: string;
  status: 'uploaded' | 'processing' | 'analyzing' | 'completed' | 'failed';
  message: string;
  progress?: number;
  data?: any;
  timestamp: string;
}

export interface SSEMessage {
  type: 'connected' | 'status' | 'heartbeat';
  documentId?: string;
  status?: DocumentEvent['status'];
  message?: string;
  progress?: number;
  data?: any;
  timestamp: string;
}

interface UseDocumentEventsOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

interface UseDocumentEventsReturn {
  isConnected: boolean;
  lastEvent: DocumentEvent | null;
  error: string | null;
  connectionAttempts: number;
  connect: () => void;
  disconnect: () => void;
}

/**
 * React hook to listen to real-time document processing events via Server-Sent Events
 */
export function useDocumentEvents(
  documentId: string | null,
  options: UseDocumentEventsOptions = {}
): UseDocumentEventsReturn {
  const {
    autoReconnect = true,
    maxReconnectAttempts = 3,
    reconnectDelay = 2000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DocumentEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    setError(null);
  }, []);

  const connect = useCallback(() => {
    if (!documentId || eventSourceRef.current) {
      return;
    }

    console.log(`🔌 Connecting to SSE for document: ${documentId}`);
    setError(null);

    const eventSource = new EventSource(`/api/document-events/${documentId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`✅ SSE Connected to document: ${documentId}`);
      setIsConnected(true);
      setConnectionAttempts(0);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      console.log(`🔍 RAW SSE Message received for ${documentId}:`, event.data);
      try {
        const message: SSEMessage = JSON.parse(event.data);
        console.log(`🔍 PARSED SSE Message:`, message);
        
        if (message.type === 'status' && message.documentId === documentId) {
          const documentEvent: DocumentEvent = {
            documentId: message.documentId,
            status: message.status!,
            message: message.message || '',
            progress: message.progress,
            data: message.data,
            timestamp: message.timestamp
          };
          
          console.log(`📨 SSE Event received [${documentId}]:`, documentEvent.status, documentEvent.message);
          setLastEvent(documentEvent);
        } else if (message.type === 'connected') {
          console.log(`🔗 SSE Connection confirmed for: ${documentId}`);
        } else if (message.type === 'heartbeat') {
          console.log(`💓 SSE Heartbeat received for: ${documentId}`);
        } else {
          console.log(`🤔 Unknown SSE message type:`, message.type, message);
        }
      } catch (err) {
        console.error('❌ SSE Message parsing error:', err, 'Raw data:', event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.error(`❌ SSE Connection error for document ${documentId}:`, err);
      console.error(`❌ SSE ReadyState:`, eventSource.readyState);
      setIsConnected(false);
      
      if (eventSource.readyState === EventSource.CLOSED) {
        setError('Connection closed');
        
        // Auto-reconnect logic
        if (autoReconnect && connectionAttempts < maxReconnectAttempts) {
          const newAttempts = connectionAttempts + 1;
          setConnectionAttempts(newAttempts);
          setError(`Reconnecting... (attempt ${newAttempts}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            disconnect();
            connect();
          }, reconnectDelay);
        } else {
          setError('Connection failed. Max reconnection attempts reached.');
        }
      }
    };
  }, [documentId, autoReconnect, maxReconnectAttempts, reconnectDelay, connectionAttempts, disconnect]);

  // Auto-connect when documentId changes
  useEffect(() => {
    if (documentId) {
      connect();
    } else {
      disconnect();
    }

    return disconnect;
  }, [documentId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastEvent,
    error,
    connectionAttempts,
    connect,
    disconnect
  };
}
