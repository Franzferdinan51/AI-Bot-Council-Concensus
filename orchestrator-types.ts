/**
 * AI Senate — Orchestrator Types
 * Shared types for council-delegate integration with duck-cli and agent programs
 */

export interface CouncilRequest {
  task: string;
  context?: Record<string, unknown>;
  perspectives?: string[];
  mode?: CouncilMode;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export type CouncilMode =
  | 'legislative'    // Debate & vote on proposals
  | 'deliberation'   // Roundtable discussion
  | 'research'        // Multi-vector investigation
  | 'prediction'     // Probabilistic forecasting
  | 'inquiry'        // Direct Q&A
  | 'swarm'          // Swarm coordination
  | 'emergency';     // Fast emergency response

export interface CouncilResponse {
  verdict: 'approve' | 'reject' | 'conditional';
  reasoning: string;
  recommendations: string[];
  consensus: number;  // 0-1
  votes?: CouncilVote[];
  deliberationTimeMs: number;
  perspectivesEngaged: number;
  confidence: number;
  round?: number;
  converged?: boolean;
}

export interface CouncilVote {
  perspective: string;
  vote: 'approve' | 'reject' | 'conditional';
  reasoning: string;
  confidence: number;  // 0-1
  evidence?: string;
}

export interface SenateConfig {
  enabled: boolean;
  defaultMode: CouncilMode;
  maxRounds: number;
  convergenceThreshold: number;  // 0-1, auto-stop if reached
  timeoutMs: number;
  minParticipants: number;
}
