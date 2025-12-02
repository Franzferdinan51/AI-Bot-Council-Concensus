import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

export interface WebSocketMessage {
  type: 'token' | 'vote' | 'status' | 'message' | 'error' | 'complete';
  sessionId: string;
  data: any;
  timestamp: number;
}

export interface ClientConnection {
  ws: WebSocket;
  sessionId?: string;
  clientId: string;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private sessionSubscriptions: Map<string, Set<string>> = new Map(); // sessionId -> Set of clientIds
  private httpServer: any = null;

  constructor(private port: number = 4001) {}

  initialize(): void {
    this.httpServer = createServer();
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateId();
      const connection: ClientConnection = { ws, clientId };
      this.clients.set(clientId, connection);

      console.log(`[WebSocket] Client connected: ${clientId}`);

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(connection, message);
        } catch (error) {
          console.error('[WebSocket] Invalid message format:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`[WebSocket] Client ${clientId} error:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'status',
        sessionId: '',
        data: { status: 'connected', clientId },
        timestamp: Date.now()
      });
    });

    this.httpServer.listen(this.port, () => {
      console.log(`[WebSocket] Server listening on port ${this.port}`);
    });
  }

  private handleMessage(connection: ClientConnection, message: any): void {
    switch (message.type) {
      case 'subscribe':
        this.subscribeToSession(connection.clientId, message.sessionId);
        break;
      case 'unsubscribe':
        this.unsubscribeFromSession(connection.clientId, message.sessionId);
        break;
      case 'ping':
        this.sendToClient(connection.clientId, {
          type: 'status',
          sessionId: '',
          data: { status: 'pong' },
          timestamp: Date.now()
        });
        break;
      default:
        console.log('[WebSocket] Unknown message type:', message.type);
    }
  }

  subscribeToSession(clientId: string, sessionId: string): void {
    if (!this.clients.has(clientId)) return;

    // Add client to session subscription
    if (!this.sessionSubscriptions.has(sessionId)) {
      this.sessionSubscriptions.set(sessionId, new Set());
    }
    this.sessionSubscriptions.get(sessionId)!.add(clientId);

    // Update connection with session ID
    const connection = this.clients.get(clientId);
    if (connection) {
      connection.sessionId = sessionId;
    }

    console.log(`[WebSocket] Client ${clientId} subscribed to session ${sessionId}`);
  }

  unsubscribeFromSession(clientId: string, sessionId: string): void {
    const subscriptions = this.sessionSubscriptions.get(sessionId);
    if (subscriptions) {
      subscriptions.delete(clientId);
      if (subscriptions.size === 0) {
        this.sessionSubscriptions.delete(sessionId);
      }
    }

    const connection = this.clients.get(clientId);
    if (connection) {
      connection.sessionId = undefined;
    }

    console.log(`[WebSocket] Client ${clientId} unsubscribed from session ${sessionId}`);
  }

  private handleDisconnect(clientId: string): void {
    const connection = this.clients.get(clientId);
    if (connection?.sessionId) {
      this.unsubscribeFromSession(clientId, connection.sessionId);
    }
    this.clients.delete(clientId);
    console.log(`[WebSocket] Client disconnected: ${clientId}`);
  }

  sendToSession(sessionId: string, message: Omit<WebSocketMessage, 'sessionId'>): void {
    const subscriptions = this.sessionSubscriptions.get(sessionId);
    if (!subscriptions) return;

    const fullMessage: WebSocketMessage = {
      ...message,
      sessionId,
      timestamp: Date.now()
    };

    subscriptions.forEach(clientId => {
      const connection = this.clients.get(clientId);
      if (connection?.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(fullMessage));
      }
    });
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    const connection = this.clients.get(clientId);
    if (connection?.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: Omit<WebSocketMessage, 'sessionId' | 'timestamp'>): void {
    const fullMessage: WebSocketMessage = {
      ...message,
      sessionId: '',
      timestamp: Date.now()
    };

    this.clients.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(fullMessage));
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getSessionCount(sessionId: string): number {
    return this.sessionSubscriptions.get(sessionId)?.size || 0;
  }

  private generateId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown(): void {
    this.clients.forEach(connection => {
      connection.ws.close();
    });
    this.clients.clear();
    this.sessionSubscriptions.clear();

    if (this.wss) {
      this.wss.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }

    console.log('[WebSocket] Server shutdown complete');
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
