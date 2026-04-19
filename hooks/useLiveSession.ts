/**
 * useLiveSession — React hook for SSE live deliberation streaming
 * Connects to /api/events, subscribes to session events, maintains local state mirror
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LiveMessage {
    id: string;
    author: string;
    authorType: string;
    content: string;
    roleLabel?: string;
    color?: string;
    thinking?: string;
    timestamp?: number;
    voteData?: any;
    predictionData?: any;
}

export interface LiveCouncilor {
    id: string;
    name: string;
    role: string;
    color: string;
    model: string;
    status: 'idle' | 'speaking' | 'done';
    thinking?: boolean;
}

export interface LiveSessionState {
    id: string | null;
    topic: string | null;
    mode: string | null;
    phase: 'idle' | 'opening' | 'debating' | 'voting' | 'resolving' | 'adjourned' | 'paused';
    startedAt: number | null;
    elapsed: number;
    messages: LiveMessage[];
    councilors: LiveCouncilor[];
    voteData: any | null;
    stats: { messages: number; yeas: number; nays: number };
    viewerCount: number;
    connected: boolean;
}

const API_BASE = 'http://localhost:3001';

export function useLiveSession() {
    const [state, setState] = useState<LiveSessionState>({
        id: null,
        topic: null,
        mode: null,
        phase: 'idle',
        startedAt: null,
        elapsed: 0,
        messages: [],
        councilors: [],
        voteData: null,
        stats: { messages: 0, yeas: 0, nays: 0 },
        viewerCount: 0,
        connected: false
    });

    const esRef = useRef<EventSource | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch current session state (for late joiners)
    const fetchSessionState = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/session`);
            if (res.ok) {
                const data = await res.json();
                setState(prev => ({
                    ...prev,
                    id: data.id,
                    topic: data.topic,
                    mode: data.mode,
                    phase: data.phase || 'idle',
                    startedAt: data.startedAt,
                    elapsed: data.elapsed || 0,
                    messages: data.messages || [],
                    councilors: (data.councilors || []).map((c: any) => ({
                        ...c,
                        status: c.status || 'idle',
                        thinking: false
                    })),
                    voteData: data.voteData,
                    stats: data.stats || { messages: 0, yeas: 0, nays: 0 },
                    viewerCount: data.viewerCount || 0
                }));
            }
        } catch (e) {
            // Server not reachable
        }
    }, []);

    // Connect to SSE
    const connect = useCallback(() => {
        if (esRef.current) {
            esRef.current.close();
        }

        const es = new EventSource(`${API_BASE}/api/events`);
        esRef.current = es;

        es.addEventListener('connected', () => {
            setState(prev => ({ ...prev, connected: true }));
            fetchSessionState();
        });

        es.addEventListener('viewer_count', (e) => {
            const data = JSON.parse(e.data);
            setState(prev => ({ ...prev, viewerCount: data.count }));
        });

        es.addEventListener('session_start', (e) => {
            const data = JSON.parse(e.data);
            setState({
                id: data.id,
                topic: data.topic,
                mode: data.mode,
                phase: data.phase,
                startedAt: data.startedAt,
                elapsed: 0,
                messages: [],
                councilors: (data.councilors || []).map((c: any) => ({ ...c, status: 'idle' as const, thinking: false })),
                voteData: null,
                stats: { messages: 0, yeas: 0, nays: 0 },
                viewerCount: state.viewerCount,
                connected: true
            });
        });

        es.addEventListener('message', (e) => {
            const msg: LiveMessage = JSON.parse(e.data);
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, { ...msg, timestamp: Date.now() }]
            }));
        });

        es.addEventListener('phase', (e) => {
            const data = JSON.parse(e.data);
            setState(prev => ({ ...prev, phase: data.phase }));
        });

        es.addEventListener('session_pause', (e) => {
            setState(prev => ({ ...prev, phase: 'paused' }));
        });

        es.addEventListener('session_resume', () => {
            // Refetch session state from backend to get correct elapsed time
            fetchSessionState();
            setState(prev => ({ ...prev, phase: 'debating' }));
        });

        es.addEventListener('councilor_start', (e) => {
            const data = JSON.parse(e.data);
            setState(prev => ({
                ...prev,
                councilors: prev.councilors.map(c => 
                    c.id === data.id ? { ...c, status: 'speaking' as const, thinking: true } : c
                )
            }));
        });

        es.addEventListener('councilor_end', (e) => {
            const data = JSON.parse(e.data);
            setState(prev => ({
                ...prev,
                councilors: prev.councilors.map(c => 
                    c.id === data.id ? { ...c, status: 'done' as const, thinking: false } : c
                )
            }));
        });

        es.addEventListener('thinking', (e) => {
            const data = JSON.parse(e.data);
            setState(prev => ({
                ...prev,
                councilors: prev.councilors.map(c => 
                    c.id === data.id ? { ...c, thinking: data.thinking } : c
                )
            }));
        });

        es.addEventListener('vote', (e) => {
            const data = JSON.parse(e.data);
            setState(prev => ({
                ...prev,
                voteData: data,
                stats: { ...prev.stats, yeas: data.yeas || 0, nays: data.nays || 0 }
            }));
        });

        es.addEventListener('prediction', (e) => {
            const data = JSON.parse(e.data);
            const msg: LiveMessage = {
                id: `pred-${Date.now()}`,
                author: 'Council Clerk',
                authorType: 'system',
                content: '📊 Prediction Generated',
                predictionData: data,
                timestamp: Date.now()
            };
            setState(prev => ({ ...prev, messages: [...prev.messages, msg] }));
        });

        es.addEventListener('session_end', () => {
            setState(prev => ({ ...prev, phase: 'adjourned' }));
        });

        es.addEventListener('session_clear', () => {
            setState(prev => ({
                ...prev,
                id: null, topic: null, mode: null, phase: 'idle',
                startedAt: null, elapsed: 0, messages: [],
                councilors: [], voteData: null,
                stats: { messages: 0, yeas: 0, nays: 0 }
            }));
        });

        es.onerror = () => {
            setState(prev => ({ ...prev, connected: false }));
            es.close();
            // Auto-reconnect after 3s
            reconnectRef.current = setTimeout(connect, 3000);
        };
    }, [fetchSessionState]);

    // Elapsed timer
    useEffect(() => {
        if (state.startedAt && state.phase !== 'idle' && state.phase !== 'adjourned') {
            timerRef.current = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    elapsed: prev.startedAt ? Date.now() - prev.startedAt : 0
                }));
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [state.startedAt, state.phase]);

    useEffect(() => {
        connect();
        return () => {
            if (esRef.current) esRef.current.close();
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [connect]);

    return state;
}
