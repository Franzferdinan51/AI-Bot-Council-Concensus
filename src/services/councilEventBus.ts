import { EventEmitter } from 'events';

export interface CouncilEvent {
    type: 'speaker_change' | 'token' | 'vote' | 'status_change' | 'session_update' | 'error' | 'tool_call' | 'tool_complete';
    sessionId: string;
    data: any;
    timestamp: number;
}

class CouncilEventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100); // Allow many SSE connections
    }

    emitEvent(type: CouncilEvent['type'], sessionId: string, data: any) {
        const event: CouncilEvent = {
            type,
            sessionId,
            data,
            timestamp: Date.now()
        };
        this.emit('council_event', event);
    }
}

export const councilEventBus = new CouncilEventBus();
