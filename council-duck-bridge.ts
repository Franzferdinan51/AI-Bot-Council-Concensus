/**
 * AI Senate — Duck CLI Orchestrator Bridge
 * Integrates AI Senate with duck-cli for enhanced multi-agent workflows
 *
 * Allows duck-cli to:
 * - Consult the senate before major decisions
 * - Use senate for ethical/complex reasoning
 * - Route tasks TO the senate for deliberation
 * - Receive senate verdicts back in duck-cli sessions
 *
 * Run as: node --experimental-vm-modules council-duck-bridge.ts
 * Or import into a TypeScript project
 */

import type { CouncilRequest, CouncilResponse, SenateConfig, CouncilMode } from './orchestrator-types.js';

// ─── Configuration ──────────────────────────────────────────────────────────
const COUNCIL_API = process.env.COUNCIL_API || 'http://localhost:3001';
const MESH_API = process.env.MESH_API_URL || 'http://localhost:4000/api';
const MESH_KEY = process.env.MESH_API_KEY || 'openclaw-mesh-default-key';
const DUCK_API = process.env.DUCK_CLI_API || 'http://localhost:18797';

export const DEFAULT_SENATE_CONFIG: SenateConfig = {
  enabled: true,
  defaultMode: 'deliberation',
  maxRounds: 3,
  convergenceThreshold: 0.85,  // Stop when 85%+ agreement reached
  timeoutMs: 60000,
  minParticipants: 3,
};

// ─── Senate Client ────────────────────────────────────────────────────────────
export class SenateClient {
  private apiBase: string;
  private meshBase: string;
  private meshKey: string;
  private config: SenateConfig;

  constructor(config: Partial<SenateConfig> = {}) {
    this.apiBase = COUNCIL_API;
    this.meshBase = MESH_API;
    this.meshKey = MESH_KEY;
    this.config = { ...DEFAULT_SENATE_CONFIG, ...config };
  }

  /** Check if senate is reachable */
  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/api/health`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }

  /** Register this agent with the agent mesh */
  async registerWithMesh(): Promise<{ agentId?: string; error?: string }> {
    try {
      const res = await fetch(`${this.meshBase}/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.meshKey,
        },
        body: JSON.stringify({
          name: 'DuckCLI-Senate-Bridge',
          endpoint: DUCK_API,
          capabilities: [
            'deliberation',
            'voting',
            'consensus',
            'multi-perspective-analysis',
            'structured-response',
            'anti-sycophancy',
            'fresh-eyes-validation',
          ],
          metadata: {
            type: 'bridge',
            version: '2.0.0',
            senateUrl: this.apiBase,
          },
        }),
      });
      const data = await res.json();
      return { agentId: data.agentId };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /** Delegate a task to the AI Senate for full deliberation */
  async deliberate(request: CouncilRequest): Promise<CouncilResponse | { error: string }> {
    try {
      const res = await fetch(`${this.apiBase}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.meshKey },
        body: JSON.stringify({
          topic: request.task,
          mode: request.mode || this.config.defaultMode,
          councilors: request.perspectives,
          urgency: request.urgency || 'normal',
        }),
      });
      if (!res.ok) return { error: `API error ${res.status}` };
      const data = await res.json();
      return {
        verdict: this.mapVerdict(data.result?.content),
        reasoning: data.result?.content || '',
        recommendations: [],
        consensus: 0.7,
        confidence: 0.7,
        deliberationTimeMs: Date.now() - (data.startedAt || Date.now()),
        perspectivesEngaged: data.councilorsEngaged || 3,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }

  /** Quick synchronous verdict — ask senate and wait for fast answer */
  async consult(topic: string, mode: CouncilMode = 'inquiry'): Promise<string> {
    const result = await this.deliberate({ task: topic, mode, urgency: 'high' });
    if ('error' in result) return `[Senate ERROR] ${result.error}`;
    return `[Senate ${result.verdict.toUpperCase()}] ${result.reasoning.substring(0, 300)}`;
  }

  /** Broadcast deliberation result to all mesh agents */
  async broadcastResult(topic: string, result: CouncilResponse): Promise<void> {
    try {
      await fetch(`${this.meshBase}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.meshKey },
        body: JSON.stringify({
          from: 'AI-Senate',
          topic,
          payload: result,
          messageType: 'broadcast',
        }),
      });
    } catch { /* silent - mesh is optional */ }
  }

  /** Send direct message to a mesh agent */
  async meshSend(to: string, content: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.meshBase}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.meshKey },
        body: JSON.stringify({ to, content }),
      });
      return res.ok;
    } catch { return false; }
  }

  /** Get all registered mesh agents */
  async listMeshAgents(): Promise<any[]> {
    try {
      const res = await fetch(`${this.meshBase}/agents`, {
        headers: { 'X-API-Key': this.meshKey },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.agents || [];
    } catch { return []; }
  }

  private mapVerdict(content: string): 'approve' | 'reject' | 'conditional' {
    if (!content) return 'conditional';
    const lower = content.toLowerCase();
    if (lower.includes('approve') || lower.includes('pass') || lower.includes('yes')) return 'approve';
    if (lower.includes('reject') || lower.includes('fail') || lower.includes('no')) return 'reject';
    return 'conditional';
  }
}

// ─── CLI Usage ──────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new SenateClient();
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'health') {
    client.health().then(ok => console.log(ok ? '✅ Senate online' : '❌ Senate unreachable'));
  } else if (cmd === 'consult' && args[1]) {
    client.consult(args.slice(1).join(' ')).then(r => console.log(r));
  } else if (cmd === 'register') {
    client.registerWithMesh().then(r => console.log(JSON.stringify(r, null, 2)));
  } else if (cmd === 'agents') {
    client.listMeshAgents().then(a => console.log(JSON.stringify(a, null, 2)));
  } else {
    console.log(`AI Senate Bridge CLI\n\nUsage:\n  node council-duck-bridge.ts health          Check senate is online\n  node council-duck-bridge.ts consult <text>  Quick consult\n  node council-duck-bridge.ts register       Register with mesh\n  node council-duck-bridge.ts agents          List mesh agents`);
  }
}

export default SenateClient;
