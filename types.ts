
export enum AuthorType {
  HUMAN = 'human',
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter',
  LM_STUDIO = 'lmstudio',
  OLLAMA = 'ollama',
  JAN_AI = 'jan_ai',
  OPENAI_COMPATIBLE = 'openai_compatible',
  ZAI = 'zai',
  MOONSHOT = 'moonshot',
  MINIMAX = 'minimax',
  SYSTEM = 'system',
}

export type BotRole = 'speaker' | 'councilor' | 'specialist' | 'moderator' | 'swarm_agent'
  | 'senator'           // Upper House - long-term vision, constitutional interpretation
  | 'representative'    // Lower House - constituent interests, practical impact
  | 'executive'         // Executive Branch - decisions, veto power, implementation
  | 'judge'            // Judicial - constitutionality, precedent
  | 'lobbyist';        // Special interests - narrow stakeholder viewpoints

export enum SessionMode {
    PROPOSAL = 'proposal',           // Standard Legislative: Debate -> Vote -> Enact
    DELIBERATION = 'deliberation', // Roundtable: Deep discussion -> Summary (No Vote)
    INQUIRY = 'inquiry',           // Q&A: Direct answers -> Synthesis
    RESEARCH = 'research',          // Agentic: Deep Dive -> Plan -> Investigate -> Report
    SWARM = 'swarm',               // Swarm: Dynamic Decomposition -> Parallel Execution -> Aggregation
    SWARM_CODING = 'swarm_coding', // Claude Code / OK Computer Style: Architect -> Dev Swarm -> Code Gen
    PREDICTION = 'prediction',     // Superforecasting: Probability & Outcome Analysis
    LEGISLATIVE = 'legislative',   // US Government: Bill -> Committee -> Floor Vote -> President
    OVERSIGHT = 'oversight',       // Investigation -> Subpoena -> Report
    BUDGET = 'budget',             // Budget proposal -> Committee -> Floor -> Signing
    IMPEACHMENT = 'impeachment',   // House charges -> Senate trial -> Vote
    CONFIRMATION = 'confirmation', // Nominee hearing -> Committee -> Floor vote
    TREATY = 'treaty',             // Negotiation -> Senate ratification
    CONSTITUTIONAL = 'constitutional', // Supreme Court review -> Precedent setting
    EMERGENCY = 'emergency',          // Crisis response -> Rapid deliberation
}

export interface BotConfig {
  id: string;
  name: string;
  role: BotRole;
  authorType: AuthorType;
  model: string; 
  apiKey?: string; 
  endpoint?: string; 
  persona: string;
  color: string; 
  enabled: boolean;
  voiceIndex?: number; // Preference for TTS voice index
}

export interface MCPTool {
  name: string;
  description: string;
  schema: string; 
}

export interface MCPSettings {
  enabled: boolean;
  dockerEndpoint: string; 
  customTools: MCPTool[]; 
  publicToolIds?: string[];
}

export interface AudioSettings {
    enabled: boolean;
    useGeminiTTS: boolean; // Toggle between Browser and Gemini TTS
    autoPlay: boolean;
    speechRate: number; // 0.5 to 2.0
    voiceVolume: number; // 0 to 1.0
}

export interface UISettings {
    debateDelay: number; // ms delay between turns
    fontSize: 'small' | 'medium' | 'large';
    customDirective?: string; // Override for Prime Directive
    enableCodingMode?: boolean; // Toggle Swarm Coding Mode availability
    proCodingUI?: boolean; // Toggle IDE-style interface for coding mode
    chatViewMode?: 'list' | 'grid'; // Toggle between linear chat and grid layout
    soundEnabled?: boolean; // Toggle sound effects
    theme?: 'dark' | 'light'; // Theme toggle
    animationsEnabled?: boolean; // Toggle animations
}

export interface CostSettings {
    contextPruning: boolean; // Enable history truncation
    maxContextTurns: number; // Keep last N turns + Topic
    parallelProcessing: boolean; // Batch requests where possible
    maxConcurrentRequests: number; // Limit parallel requests to prevent 429s
    economyMode: boolean; // Force lighter models for councilors
}

export interface ProviderSettings {
    geminiApiKey?: string;
    openRouterKey?: string;
    ollamaEndpoint: string;
    lmStudioEndpoint: string;
    janAiEndpoint: string;
    genericOpenAIEndpoint?: string;
    genericOpenAIKey?: string;

    // New Providers
    zaiApiKey?: string;
    zaiEndpoint?: string;
    moonshotApiKey?: string;
    moonshotEndpoint?: string;
    minimaxApiKey?: string;
    minimaxEndpoint?: string;

    // DeepSeek
    deepseekApiKey?: string;
    deepseekEndpoint?: string;

    // Provider priority order (used by routing)
    providerPriority: string[]; // e.g. ['minimax', 'kimi', 'openrouter', 'lmstudio']

    // Cost limits
    dailyBudget?: number;       // Max USD per day
    maxTokensPerRequest?: number; // Cap response tokens
}

// --- GLOBAL MEMORY (Laws/Precedents) ---
export interface MemoryEntry {
    id: string;
    topic: string;
    content: string; // The enactment/ruling
    date: string;
    tags: string[];
}

// --- AGENT SPECIFIC MEMORY ---
export interface BotMemory {
    id: string;
    botId: string;
    type: 'fact' | 'directive' | 'observation';
    content: string;
    timestamp: number;
}

export interface RAGDocument {
    id: string;
    title: string;
    content: string;
    active: boolean;
}

export interface Settings {
  bots: BotConfig[];
  mcp: MCPSettings;
  audio: AudioSettings;
  ui: UISettings;
  cost: CostSettings;
  providers: ProviderSettings;
  knowledge: {
      documents: RAGDocument[];
  };
  predictionCalibration?: PredictionCalibration;
}

export interface VoteData {
    topic: string; 
    yeas: number;
    nays: number;
    result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED';
    avgConfidence: number;
    consensusScore: number; // 0-100 score representing unity
    consensusLabel: string; // "Unanimous", "Strong", "Divided", "Contentious"
    votes: {
        voter: string;
        choice: 'YEA' | 'NAY';
        confidence: number; // 0-10
        reason: string;
        color: string;
    }[];
}

export interface PredictionData {
    outcome: string;
    confidence: number; // 0-100
    timeline: string;
    reasoning: string;
    // Extended superforecasting fields
    probability?: number;        // 0-100 (alias for confidence in new format)
    baseRate?: number;           // Historical frequency (0-1)
    timeframe?: string;          // When outcome expected
    resolutionCriteria?: string; // What counts as correct/incorrect
    factors?: PredictionFactor[];
    contraryEvidence?: string;
    sources?: string[];
    calibrationNote?: string;
    subQuestionAnalysis?: {
        subQuestions: { question: string; probability: number; direction: 'and' | 'or' }[];
        combinedProbability: number;
        decompositionQuality: string;
    };
    conditionalDrivers?: {
        driver: string;
        probabilityIfDriver: number;
        probabilityIfNot: number;
        currentLikelihood: number;
        conditionalProbability: number;
    }[];
    temporalNote?: string;
    falsificationTest?: string;
    aggregation?: {
        councilorRange: string;
        consensusScore: number;
        keyDisagreement: string;
    };
    informationGaps?: string;
}

export interface PredictionFactor {
    factor: string;
    direction: 'for' | 'against';
    weight: number;    // 0-1
    evidence: string;
}

export interface PredictionCalibration {
    totalPredictions: number;
    correctPredictions: number;    // within 10% of actual
    averageConfidence: number;      // 0-1
    brierScore: number;              // Mean squared error (lower is better)
    calibrationByBin: Record<string, { count: number; correct: number }>;
}

export interface Attachment {
    type: 'file' | 'link';
    mimeType?: string; // for files
    data: string; // base64 for files, url for links
    title?: string; // for links
}

// --- NEW: CODE ARTIFACTS ---
export interface CodeFile {
    filename: string;
    language: string;
    content: string;
    description?: string;
}

export interface Message {
  id: string;
  author: string;
  content: string;
  authorType: AuthorType;
  color?: string; 
  roleLabel?: string;
  voteData?: VoteData;
  predictionData?: PredictionData; // New field for prediction results
  attachments?: Attachment[];
  thinking?: string; // Chain of Thought content
  codeFiles?: CodeFile[]; // New field for code artifacts
}

export enum SessionStatus {
    IDLE = 'idle',
    OPENING = 'opening',
    DEBATING = 'debating',
    RECONCILING = 'reconciling',
    RESOLVING = 'resolving',
    VOTING = 'voting',
    ENACTING = 'enacting',
    ADJOURNED = 'adjourned',
    PAUSED = 'paused',
    ERROR = 'error'
}

export enum ConvergenceState {
    UNKNOWN = 'unknown',    // Not yet evaluated
    DIVERGING = 'diverging', // <40% similarity - keep deliberating
    REFINING = 'refining',   // 40-85% similarity - continue
    CONVERGED = 'converged', // >=85% similarity - stop early
    IMPASSE = 'impasse'      // Stable disagreement
}

export interface ControlSignal {
    stop: boolean;
    pause: boolean;
}

// v2.0: Debate round tracking
export interface DebateRound {
    roundNumber: number;
    responses: CouncilorRoundResponse[];
    convergenceState: ConvergenceState;
    timestamp: number;
}

export interface CouncilorRoundResponse {
    councilorId: string;
    councilorName: string;
    position: 'AGREE' | 'DISAGREE' | 'PARTIALLY_AGREE' | 'ABSTAIN';
    confidence: number; // 0-1
    reasoning: string;
    evidence?: string;
    changedFromRound1: boolean;
}

// v2.0: Fresh Eyes validation result
export interface FreshEyesResult {
    validatorId: string;
    validatorName: string;
    validation: 'VALID' | 'REVISED' | 'REJECTED';
    concerns: string[];
    improvements: string[];
    confidence: number;
}
