/**
 * AI Council API Service
 * Handles communication with the deliberation backend on port 3003
 */

const API_BASE = 'http://localhost:3003';

export interface ApiCouncilor {
  id: number;
  name: string;
  role: string;
  category: string;
  color: string;
  emoji: string;
}

export interface ApiMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface SubmitResponse {
  sessionId: string;
  motion: string;
  mode: string;
  councilorCount: number;
}

export interface GatewayStatus {
  connected: boolean;
  gateway?: { status: string };
  error?: string;
}

export async function checkGatewayHealth(): Promise<GatewayStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/gateway/health`, { signal: AbortSignal.timeout(3000) });
    return res.json();
  } catch (e: any) {
    return { connected: false, error: e.message };
  }
}

export async function getCouncilors(): Promise<ApiCouncilor[]> {
  const res = await fetch(`${API_BASE}/api/councilors`);
  if (!res.ok) throw new Error(`Failed to fetch councilors: ${res.status}`);
  return res.json();
}

export async function getModes(): Promise<ApiMode[]> {
  const res = await fetch(`${API_BASE}/api/modes`);
  if (!res.ok) throw new Error(`Failed to fetch modes: ${res.status}`);
  return res.json();
}

export async function submitMotion(
  motion: string,
  mode: string,
  councilorIds: number[]
): Promise<SubmitResponse> {
  const res = await fetch(`${API_BASE}/api/deliberate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motion, mode, councilors: councilorIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export type SSEEvent =
  | { type: 'connected' | 'status' | 'system' | 'typing_start' | 'typing_end' | 'done'; [key: string]: any }
  | { type: 'councilor_start' | 'councilor_end'; councilor: string; [key: string]: any }
  | { type: 'token'; councilor: string; token: string; content: string }
  | { type: 'consensus'; score: number }
  | { type: 'error'; message: string };

export type SSEEventHandler = (event: SSEEvent) => void;

export function streamDeliberation(
  sessionId: string,
  onEvent: SSEEventHandler,
  onError?: (err: Error) => void
): () => void {
  const url = `${API_BASE}/api/deliberate/stream?sessionId=${encodeURIComponent(sessionId)}`;
  let aborted = false;

  const es = new EventSource(url);

  es.onmessage = (e) => {
    if (aborted) return;
    try {
      const data = JSON.parse(e.data) as SSEEvent;
      onEvent(data);
      if (data.type === 'done' || data.type === 'error') {
        es.close();
      }
    } catch (err) {
      console.warn('[SSE] Parse error:', err);
    }
  };

  es.onerror = (e) => {
    if (aborted) return;
    es.close();
    onError?.(new Error('SSE connection error'));
  };

  return () => {
    aborted = true;
    es.close();
  };
}
