// OpenClaw Gateway API - AI Council WebUI
// Routes through OpenClaw gateway at ws://localhost:18789

const GATEWAY_URL = 'ws://localhost:18789';
const GATEWAY_HTTP = 'http://localhost:18789';

export interface GatewayMessage {
  type: string;
  id?: string;
  params?: Record<string, unknown>;
  data?: unknown;
}

export class CouncilGateway {
  private ws: WebSocket | null = null;
  private pendingRequests: Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }> = new Map();
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private messageId = 0;

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(GATEWAY_URL);

        this.ws.onopen = () => {
          console.log('[CouncilGateway] Connected to OpenClaw gateway');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as GatewayMessage;
            
            // Handle response to a pending request
            if (msg.id && this.pendingRequests.has(msg.id)) {
              const { resolve } = this.pendingRequests.get(msg.id)!;
              this.pendingRequests.delete(msg.id);
              resolve(msg.data);
            }

            // Notify listeners
            if (msg.type && this.listeners.has(msg.type)) {
              this.listeners.get(msg.type)!.forEach(cb => cb(msg.data));
            }
          } catch (e) {
            console.error('[CouncilGateway] Failed to parse message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[CouncilGateway] WebSocket error:', error);
          reject(new Error('Gateway connection failed'));
        };

        this.ws.onclose = () => {
          console.log('[CouncilGateway] Gateway disconnected');
          this.ws = null;
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  async sendRequest<T = unknown>(type: string, params?: Record<string, unknown>): Promise<T> {
    await this.connect();
    
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Not connected'));
        return;
      }

      const id = `req_${++this.messageId}`;
      this.pendingRequests.set(id, { resolve: resolve as (v: unknown) => void, reject });

      const msg: GatewayMessage = { type, id, params };
      this.ws.send(JSON.stringify(msg));

      // Timeout after 60s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 60000);
    });
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const gateway = new CouncilGateway();

// AI Council API - Uses OpenClaw gateway for deliberation
export class CouncilAI {
  private model: string;

  constructor(model: string = 'minimax/MiniMax-M2.7') {
    this.model = model;
  }

  // Stream deliberation response from a councilor
  async *deliberate(
    councilor: { name: string; role: string; personality: string; specialty: string },
    motion: string,
    mode: string,
    context: string
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = `You are ${councilor.name}, a ${councilor.role} councilor in the AI Council Chamber.
    
Personality: ${councilor.personality}
Specialty: ${councilor.specialty}

You are in a ${mode} deliberation about the following motion:
"${motion}"

${context}

Provide a thoughtful, distinct perspective. Be direct and opinionated.`;

    try {
      // Try HTTP streaming first (more reliable)
      const response = await fetch(`${GATEWAY_HTTP}/api/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Provide your perspective on this motion.' }
          ],
          stream: true,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('[CouncilAI] Deliberation error:', e);
      // Fallback: yield a placeholder
      yield `[${councilor.name} is thinking...]`;
    }
  }
}

export const councilAI = new CouncilAI();
