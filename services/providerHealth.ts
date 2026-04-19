/**
 * Provider Health Service v1.0
 * Tracks which providers/models are currently working.
 * Automatically routes around failures.
 */

import { routeModelForTask, MODEL_ROUTING } from '../constants';

// ── Health State ─────────────────────────────────────────────────────────────
export interface ProviderHealthStatus {
  ok: boolean;
  latencyMs: number;
  lastCheck: number;
  error?: string;
}

export const providerHealth = new Map<string, ProviderHealthStatus>();

// ── Cost Tracking ────────────────────────────────────────────────────────────
export interface CostEntry {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: number;
}

export const costLog: CostEntry[] = [];

// Cost per 1M tokens (approximate, USD)
const COST_PER_MILLION = {
  'minimax': 0.05,        // Very cheap
  'kimi': 0.10,           // Moonshot
  'openrouter': 0.50,     // Varies by model
  'gemini': 0.10,         // Google
  'lmstudio': 0.0,        // Local = free
  'ollama': 0.0,          // Local = free
  'jan': 0.0,             // Local = free
  'deepseek': 0.10,       // DeepSeek
};

export function logCost(provider: string, model: string, inputTokens: number, outputTokens: number): void {
  const rate = COST_PER_MILLION[provider as keyof typeof COST_PER_MILLION] ?? 0.50;
  const totalTokens = inputTokens + outputTokens;
  const estimatedCost = (totalTokens / 1_000_000) * rate;
  
  costLog.push({
    provider,
    model,
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimatedCost,
    timestamp: Date.now()
  });
  
  // Keep last 1000 entries
  if (costLog.length > 1000) costLog.shift();
}

export function getCostSummary(): { totalCostUsd: number; byProvider: Record<string, number>; byModel: Record<string, number> } {
  const byProvider: Record<string, number> = {};
  const byModel: Record<string, number> = {};
  let totalCostUsd = 0;
  
  for (const entry of costLog) {
    totalCostUsd += entry.estimatedCostUsd;
    byProvider[entry.provider] = (byProvider[entry.provider] ?? 0) + entry.estimatedCostUsd;
    byModel[entry.model] = (byModel[entry.model] ?? 0) + entry.estimatedCostUsd;
  }
  
  return { totalCostUsd, byProvider, byModel };
}

// ── Health Checking ────────────────────────────────────────────────────────────
export async function checkProviderHealth(): Promise<void> {
  const checks = [
    { name: 'minimax',   url: 'https://api.minimax.chat/v1/models',      provider: 'minimax' },
    { name: 'kimi',      url: 'https://api.moonshot.cn/v1/models',          provider: 'kimi' },
    { name: 'openrouter',url: 'https://openrouter.ai/api/v1/models',       provider: 'openrouter' },
    { name: 'lmstudio',  url: 'http://localhost:1234/v1/models',           provider: 'lmstudio' },
    { name: 'ollama',    url: 'http://localhost:11434/v1/models',           provider: 'ollama' },
    { name: 'jan',       url: 'http://localhost:1337/v1/models',           provider: 'jan' },
    { name: 'gemini',    url: 'https://generativelanguage.googleapis.com/v1/models', provider: 'gemini' },
  ];

  await Promise.allSettled(
    checks.map(async (check) => {
      const start = Date.now();
      try {
        const res = await fetch(check.url, { signal: AbortSignal.timeout(5000) });
        providerHealth.set(check.name, {
          ok: res.ok,
          latencyMs: Date.now() - start,
          lastCheck: Date.now()
        });
      } catch (e: any) {
        providerHealth.set(check.name, {
          ok: false,
          latencyMs: -1,
          lastCheck: Date.now(),
          error: e.message
        });
      }
    })
  );
}

// ── Best Model Selection ──────────────────────────────────────────────────────

/**
 * Get the best available model for a task, routing around failed providers.
 */
export function getBestModelForTask(task: string): string {
  const minimaxHealth = providerHealth.get('minimax');
  if (minimaxHealth?.ok) return routeModelForTask(task);

  const lmHealth = providerHealth.get('lmstudio');
  if (lmHealth?.ok) return 'qwen/qwen3.5-9b';

  // Fallback chain
  const openrouterHealth = providerHealth.get('openrouter');
  if (openrouterHealth?.ok) return 'minimax/minimax-m2.5:free'; // Use free tier

  return 'MiniMax-M2.7'; // Final fallback
}

/**
 * Get the fastest available model (for parallel councilors).
 */
export function getFastestModel(): string {
  const candidates: { name: string; latencyMs: number }[] = [];
  
  if (providerHealth.get('lmstudio')?.ok) {
    candidates.push({ name: 'qwen/qwen3.5-9b', latencyMs: providerHealth.get('lmstudio')!.latencyMs });
  }
  if (providerHealth.get('ollama')?.ok) {
    candidates.push({ name: 'llama3.2', latencyMs: providerHealth.get('ollama')!.latencyMs });
  }
  if (providerHealth.get('minimax')?.ok) {
    candidates.push({ name: 'MiniMax-M2.7-highspeed', latencyMs: providerHealth.get('minimax')!.latencyMs });
  }
  if (providerHealth.get('openrouter')?.ok) {
    candidates.push({ name: 'minimax/minimax-m2.5:free', latencyMs: providerHealth.get('openrouter')!.latencyMs });
  }

  if (candidates.length === 0) return 'MiniMax-M2.7';

  // Return fastest
  candidates.sort((a, b) => a.latencyMs - b.latencyMs);
  return candidates[0].name;
}

/**
 * Check if a specific provider/model is healthy.
 */
export function isProviderHealthy(name: string): boolean {
  return providerHealth.get(name)?.ok ?? false;
}

/**
 * Get health summary for UI display.
 */
export function getHealthSummary(): Record<string, ProviderHealthStatus> {
  return Object.fromEntries(providerHealth);
}

// ── Auto-Health Check Loop ────────────────────────────────────────────────────
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

export function startHealthMonitoring(intervalMs = 60_000): void {
  if (healthCheckInterval) return;
  
  // Initial check
  checkProviderHealth();
  
  // Periodic check
  healthCheckInterval = setInterval(checkProviderHealth, intervalMs);
  console.log(`[ProviderHealth] Monitoring started (interval: ${intervalMs}ms)`);
}

export function stopHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    console.log('[ProviderHealth] Monitoring stopped');
  }
}
