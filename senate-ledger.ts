/**
 * Senate Ledger — precedent system for AI Senate deliberations
 * Inspired by OpenClaw MetaLearner experience store
 * 
 * Tracks past deliberations for precedent injection into councilor prompts.
 * Uses localStorage for persistence in browser environment.
 */

// ─── Types ────────────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  timestamp: number;
  topic: string;
  keywords: string[];
  mode: string;
  outcome: string;
  consensusScore: number;      // 0-1
  voteCount: number;
  votes: Record<string, string>; // councilorId -> vote
  summary: string;
  lessonsLearned: string;
  factors: string[];          // Key factors that drove the decision
  dissenters: string[];       // Councilors who disagreed
  qualityScore: number;        // 0-1, meta-critic assessment
  responseTime: number;        // ms
}

export interface LedgerStats {
  total: number;
  avgConsensus: number;
  avgQuality: number;
  topics: string[];
  modes: string[];
  councilors: string[];
  recentTopics: string[];
  predictionAccuracy?: { score: number; correct: number; total: number };
}

// ─── Storage (browser localStorage) ────────────────────────────────────────────

const LEDGER_KEY = 'ai_senate_ledger';
const LEDGER_INDEX_KEY = 'ai_senate_ledger_index';
const CALIBRATION_KEY = 'ai_senate_calibration';

function getLedger(): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLedger(ledger: LedgerEntry[]): void {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger.slice(-500))); // Keep last 500
    localStorage.setItem(LEDGER_INDEX_KEY, JSON.stringify(Date.now()));
  } catch (e) {
    console.warn('[SenateLedger] Failed to save:', e);
  }
}

// ─── Keyword Extraction ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','must',
  'shall','can','need','dare','ought','used','to','of','in','for','on','with',
  'at','by','from','up','about','into','through','during','before','after',
  'above','below','between','under','again','further','then','once',
  'and','but','or','nor','so','yet','both','either','neither','not','only',
  'own','same','than','too','very','just','also','now','here','there','when',
  'where','why','how','all','each','every','both','few','more','most','other',
  'some','such','no','any','this','that','these','those','it','its',
  'what','which','who','whom','whose','i','me','my','myself','we','our',
  'you','your','he','him','his','she','her','they','them','their',
  'this','that','these','those','审议','deliberation','讨论'
]);

export function extractKeywords(text: string, maxKeywords = 12): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([w]) => w);
}

// ─── Query Ledger ─────────────────────────────────────────────────────────────

export function queryLedger(query: string, limit = 5): LedgerEntry[] {
  const ledger = getLedger();
  if (!query.trim()) return ledger.slice(-limit);

  const queryWords = new Set(extractKeywords(query));
  if (queryWords.size === 0) return ledger.slice(-limit);

  const scored = ledger.map(entry => {
    const entryWords = new Set(entry.keywords);
    const overlap = [...queryWords].filter(w => entryWords.has(w)).length;
    const union = new Set([...queryWords, ...entryWords]);
    const jaccard = overlap / union.size;
    const recency = 1 + (entry.timestamp / Date.now()) * 0.1; // slight recency boost
    return { entry, score: jaccard * recency + overlap * 0.2 };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

// ─── Get Precedent Context ─────────────────────────────────────────────────────

export function getPrecedentContext(query: string): string {
  const matches = queryLedger(query, 3);
  if (matches.length === 0) return '';

  const blocks = matches.map((entry, i) => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    return `[PAST DELIBERATION ${i + 1}] (${date}, ${(entry.consensusScore * 100).toFixed(0)}% consensus)
Topic: ${entry.topic}
Outcome: ${entry.outcome}
Key factors: ${entry.factors.join(', ') || 'none recorded'}
Dissent: ${entry.dissenters.length > 0 ? entry.dissenters.join(', ') + ' dissented' : 'unanimous'}
Quality: ${(entry.qualityScore * 100).toFixed(0)}%
Lessons: ${entry.lessonsLearned || 'none recorded'}`;
  });

  return `\n\n${blocks.join('\n\n')}\n\n[END PAST DELIBERATIONS]\n\nUse these past outcomes as precedent — but challenge assumptions that may not transfer to the current context.\n`;
}

// Alias for App.tsx compatibility
export const buildPrecedentContext = getPrecedentContext;

// ─── Log Deliberation ───────────────────────────────────────────────────────────

export async function logDeliberation(params: {
  topic: string;
  mode: string;
  outcome: string;
  consensusScore: number;
  voteCount: number;
  votes: Record<string, string>;
  summary: string;
  lessonsLearned?: string;
  factors?: string[];
  dissenters?: string[];
  qualityScore?: number;
  responseTime?: number;
}): Promise<void> {
  const keywords = extractKeywords(params.topic);

  const entry: LedgerEntry = {
    id: `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    topic: params.topic,
    keywords,
    mode: params.mode,
    outcome: params.outcome,
    consensusScore: params.consensusScore,
    voteCount: params.voteCount,
    votes: params.votes,
    summary: params.summary,
    lessonsLearned: params.lessonsLearned || '',
    factors: params.factors || [],
    dissenters: params.dissenters || [],
    qualityScore: params.qualityScore ?? 0.7,
    responseTime: params.responseTime ?? 0,
  };

  const ledger = getLedger();
  ledger.push(entry);
  saveLedger(ledger);

  // Update calibration data if this was a prediction
  if (params.mode === 'prediction' && params.outcome) {
    updateCalibration(params.topic, params.outcome);
  }
}

// ─── Calibration Tracking ─────────────────────────────────────────────────────

interface CalibrationRecord {
  topic: string;
  keywords: string[];
  predictedProbability: number;
  outcome: boolean | null; // null = unresolved
  resolutionTimestamp: number | null;
  createdAt: number;
}

function getCalibrationRecords(): CalibrationRecord[] {
  try {
    const raw = localStorage.getItem(CALIBRATION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordPrediction(topic: string, probability: number): void {
  const records = getCalibrationRecords();
  const keywords = extractKeywords(topic);
  records.push({
    topic,
    keywords,
    predictedProbability: probability,
    outcome: null,
    resolutionTimestamp: null,
    createdAt: Date.now(),
  });
  // Keep last 200
  const trimmed = records.slice(-200);
  localStorage.setItem(CALIBRATION_KEY, JSON.stringify(trimmed));
}

export function resolvePrediction(topic: string, outcome: boolean): void {
  const records = getCalibrationRecords();
  // Find most recent unresolved matching record
  const idx = [...records].reverse().findIndex(r =>
    r.outcome === null && (extractKeywords(topic).some(k => r.keywords.includes(k)) || topic.includes(r.topic))
  );
  if (idx !== -1) {
    const realIdx = records.length - 1 - idx;
    records[realIdx].outcome = outcome;
    records[realIdx].resolutionTimestamp = Date.now();
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(records));
  }
}

function updateCalibration(topic: string, outcome: string): void {
  // Called when a deliberation resolves — check if it was a prediction
  const normalizedOutcome = outcome.toLowerCase();
  if (normalizedOutcome.includes('yes') || normalizedOutcome.includes('occur') ||
      normalizedOutcome.includes('pass') || normalizedOutcome.includes('approve') ||
      normalizedOutcome.includes('happened')) {
    resolvePrediction(topic, true);
  } else if (normalizedOutcome.includes('no') || normalizedOutcome.includes('fail') ||
             normalizedOutcome.includes('reject') || normalizedOutcome.includes('not')) {
    resolvePrediction(topic, false);
  }
}

export function getCalibrationAccuracy(): { score: number; correct: number; total: number } {
  const records = getCalibrationRecords();
  const resolved = records.filter(r => r.outcome !== null);
  if (resolved.length === 0) return { score: 0, correct: 0, total: 0 };

  let correct = 0;
  for (const r of resolved) {
    const predictedTrue = r.predictedProbability >= 50;
    if (r.outcome === predictedTrue) correct++;
  }

  return {
    score: correct / resolved.length,
    correct,
    total: resolved.length,
  };
}

// ─── Ledger Stats ───────────────────────────────────────────────────────────────

export function getLedgerStats(): LedgerStats {
  const ledger = getLedger();
  if (ledger.length === 0) {
    return { total: 0, avgConsensus: 0, avgQuality: 0, topics: [], modes: [], councilors: [], recentTopics: [] };
  }

  const topics = [...new Set(ledger.map(e => e.topic))];
  const modes = [...new Set(ledger.map(e => e.mode))];
  const councilors = [...new Set(Object.values(ledger.flatMap(e => Object.keys(e.votes))))];
  const recentTopics = ledger.slice(-10).map(e => e.topic);
  const avgConsensus = ledger.reduce((s, e) => s + e.consensusScore, 0) / ledger.length;
  const avgQuality = ledger.reduce((s, e) => s + (e.qualityScore || 0.7), 0) / ledger.length;
  const calibration = getCalibrationAccuracy();

  return {
    total: ledger.length,
    avgConsensus,
    avgQuality,
    topics,
    modes,
    councilors,
    recentTopics,
    predictionAccuracy: calibration,
  };
}

// ─── Export for server-side use (optional) ─────────────────────────────────────
// If running in Node.js (e.g., via ts-node), provide file-based fallback
export async function initSenateLedger(_options?: { storageDir?: string }): Promise<void> {
  // No-op in browser — localStorage is already available
  console.log('[SenateLedger] Initialized (browser mode)');
}
