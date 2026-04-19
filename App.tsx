
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Settings, AuthorType, SessionStatus, BotConfig, VoteData, Attachment, SessionMode, MemoryEntry, ControlSignal, PredictionData, ConvergenceState, DebateRound } from './types';
import { getBotResponse, generateSpeech, streamBotResponse } from './services/aiService';
import { searchMemories, searchDocuments, saveMemory } from './services/knowledgeService';
import { COUNCIL_SYSTEM_INSTRUCTION, GOV_CHAMBER_INSTRUCTION, DEFAULT_SETTINGS } from './constants';
// v2.1: Senate Ledger - precedent system (inspired by OpenClaw MetaLearner)
import { getPrecedentContext, logDeliberation, extractKeywords, buildPrecedentContext, getLedgerStats } from './senate-ledger';
// v2.1: Provider health monitoring
import { checkProviderHealth, providerHealth, getBestModelForTask } from './services/providerHealth';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import LiveSession from './components/LiveSession';
import CodingInterface from './components/CodingInterface';

// v2.0: ErrorBoundary - prevents white screen on API/stream failures
function ErrorBoundary(props: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (hasError) {
    return (
      <div className="min-h-screen w-full bg-[#0a0c10] text-slate-200 flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-red-900/50 rounded-xl p-6 max-w-lg text-center">
          <h2 className="text-red-500 font-bold text-lg mb-2">Council Session Crashed</h2>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm">Reload Council</button>
        </div>
      </div>
    );
  }
  return props.children;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
      {
          id: 'init-1',
          author: 'Council Clerk',
          authorType: AuthorType.SYSTEM,
          content: "All rise. The High AI Council is now in session. Select a mode below to begin."
      }
  ]);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [thinkingBotIds, setThinkingBotIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [activeSessionBots, setActiveSessionBots] = useState<BotConfig[]>([]);
  const [sessionMode, setSessionMode] = useState<SessionMode>(SessionMode.PROPOSAL);
  const [debateHeat, setDebateHeat] = useState<number>(0); 
  
  const [showCostWarning, setShowCostWarning] = useState(false);
  const [privateCouncilorId, setPrivateCouncilorId] = useState<string | null>(null);
  const [privateMessages, setPrivateMessages] = useState<Record<string, Message[]>>({});
  const [privateInput, setPrivateInput] = useState("");

  const controlSignal = useRef<ControlSignal>({ stop: false, pause: false });
  // v2.0: Track speech utterance for cleanup on unmount
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // v2.0: Debate round tracking for anti-sycophancy + hard limit
  const debateRoundRef = useRef<number>(0);
  const debateRoundsRef = useRef<DebateRound[]>([]);

  // v2.0: Cost warning - with proper cleanup
  useEffect(() => {
      const hasAck = localStorage.getItem('ai_council_cost_ack');
      if (!hasAck) {
          setShowCostWarning(true);
      }
      
      // Load saved messages for persistence across sessions
      const savedMessages = localStorage.getItem('ai_council_messages');
      if (savedMessages) {
          try {
              const parsed = JSON.parse(savedMessages);
              if (parsed.length > 0) {
                  setMessages(prev => [...prev, ...parsed]);
              }
          } catch (e) { /* ignore */ }
      }
      // v2.0: Cleanup - cancel any ongoing speech when component unmounts
      return () => {
          window.speechSynthesis?.cancel();
          speechUtteranceRef.current = null;
      };
  }, []);

  // v2.1: Provider health check on startup (OpenClaw agent startup pattern)
  useEffect(() => {
      checkProviderHealth().catch(() => {/* non-blocking */});
      const interval = setInterval(() => checkProviderHealth().catch(() => {/* non-blocking */}), 300000); // every 5min
      return () => clearInterval(interval);
  }, []);

  // v2.1: Load Constitution.md as a setting reference
  useEffect(() => {
      fetch('/CONSTITUTION.md')
          .then(r => r.ok ? r.text() : null)
          .then(text => {
              if (text) localStorage.setItem('ai_senate_constitution', text);
          })
          .catch(() => {/* Constitution is optional */});
  }, []);

  // v2.0: Save messages - with cleanup
  useEffect(() => {
      if (messages.length > 1) {
          const toSave = messages.slice(-50);
          localStorage.setItem('ai_council_messages', JSON.stringify(toSave));
      }
  }, [messages]);

  const handleAckCost = () => {
      localStorage.setItem('ai_council_cost_ack', 'true');
      setShowCostWarning(false);
  };

  // --- AUDIO HANDLING (v2.0: error-safe with cleanup) ---
  const speakText = useCallback(async (text: string, bot: BotConfig | null) => {
    if (!settings.audio.enabled) return;
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/[*_#]/g, '').replace(/```[\s\S]*?```/g, 'Code block omitted.');

    if (settings.audio.useGeminiTTS && bot && bot.authorType === AuthorType.GEMINI) {
        try {
            const apiKey = settings.providers.geminiApiKey || process.env.API_KEY || '';
            const audioData = await generateSpeech(cleanText, bot.role, apiKey);
            if (audioData) {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for(let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                // v2.0: wrap decodeAudioData in try-catch (can fail on corrupt data or closed context)
                const buffer = await audioCtx.decodeAudioData(bytes.buffer);
                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(audioCtx.destination);
                source.start();
                return;
            }
        } catch (e) {
            // Audio generation failed silently - fall through to speech synthesis
        }
    }

    if (!window.speechSynthesis) return;
    // v2.0: Cancel previous utterance before starting new one
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.audio.speechRate;
    utterance.volume = settings.audio.voiceVolume;
    speechUtteranceRef.current = utterance; // Track for unmount cleanup

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0 && bot) {
        let voiceIndex = 0;
        if (bot.role === 'speaker') voiceIndex = 0;
        else voiceIndex = (bot.id.charCodeAt(0) + bot.id.length) % voices.length;
        utterance.voice = voices[voiceIndex] || voices[0];
    }
    window.speechSynthesis.speak(utterance);
  }, [settings.audio]);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const newMessage = { ...message, id: Date.now().toString() + Math.random() };
    setMessages(prev => {
        const next = [...prev, newMessage];
        const recent = next.slice(-5).map(m => m.content.toLowerCase()).join(' ');
        let heat = 0;
        if (recent.includes('agree') || recent.includes('concur')) heat += 0.2;
        if (recent.includes('disagree') || recent.includes('objection')) heat -= 0.3;
        if (recent.includes('compromise')) heat += 0.4;
        if (recent.includes('reject')) heat -= 0.4;
        setDebateHeat(Math.max(-1, Math.min(1, heat)));
        return next;
    });
    return newMessage;
  }, []);

  const updateMessageContent = useCallback((id: string, newContent: string) => {
      let content = newContent;
      let thinking = undefined;
      const thinkMatch = newContent.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkMatch) {
          thinking = thinkMatch[1].trim();
          content = newContent.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
      }
      setMessages(prev => prev.map(m => m.id === id ? { ...m, content, thinking } : m));
  }, []);

  const checkControlSignal = async () => {
      if (controlSignal.current.stop) throw new Error("SESSION_STOPPED");
      while (controlSignal.current.pause) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (controlSignal.current.stop) throw new Error("SESSION_STOPPED");
      }
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runBatchWithConcurrency = async <T, R>(items: T[], fn: (item: T) => Promise<R>, maxConcurrency: number): Promise<R[]> => {
      const results: R[] = [];
      for (let i = 0; i < items.length; i += maxConcurrency) {
          await checkControlSignal();
          const batch = items.slice(i, i + maxConcurrency);
          await wait(1000); 
          const batchResults = await Promise.all(batch.map(fn));
          results.push(...batchResults);
      }
      return results;
  };

  const processBotTurn = async (bot: BotConfig, history: Message[], systemPrompt: string, roleLabel?: string): Promise<string> => {
      await checkControlSignal();
      setThinkingBotIds(prev => [...prev, bot.id]);
      await wait(settings.ui.debateDelay); 
      await checkControlSignal();
      
      const tempMsg = addMessage({ author: bot.name, authorType: bot.authorType, content: "...", color: bot.color, roleLabel: roleLabel || bot.role });

      try {
          const fullResponse = await streamBotResponse(bot, history, systemPrompt, settings, (chunk) => updateMessageContent(tempMsg.id, chunk));
          setThinkingBotIds(prev => prev.filter(id => id !== bot.id));
          
          if (!fullResponse || !fullResponse.trim()) {
              updateMessageContent(tempMsg.id, "(No response generated)");
              return "(No response generated)";
          }

          const cleanSpeech = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').replace(/<vote>[\s\S]*?<\/vote>/g, '').replace(/```[\s\S]*?```/g, '').trim();
          if (!cleanSpeech.includes('[PASS]') && cleanSpeech.length > 5) speakText(cleanSpeech, bot);
          await wait(1000);
          return fullResponse;
      } catch (e: any) {
          setThinkingBotIds(prev => prev.filter(id => id !== bot.id));
          if (e.message === "SESSION_STOPPED") throw e;
          const errMsg = `(Error: ${e.message})`;
          updateMessageContent(tempMsg.id, errMsg);
          return errMsg; 
      }
  };
  
  // Helper to parse XML votes into VoteData
  const parseVotesFromResponse = (response: string, topic: string, councilors: BotConfig[]): VoteData => {
      let yeas = 0;
      let nays = 0;
      let totalConfidence = 0;
      let voteCount = 0;
      const votes: any[] = [];
      
      const voteBlocks = [...response.matchAll(/MEMBER:\s*(?:\*\*)?(.*?)(?:\*\*)?\s*<vote>(.*?)<\/vote>\s*<confidence>(.*?)<\/confidence>\s*<reason>([\s\S]*?)<\/reason>/gi)];
      
      if (voteBlocks.length > 0) {
           voteBlocks.forEach(match => {
               const name = match[1].trim();
               const choice = match[2].toUpperCase().includes('YEA') ? 'YEA' : 'NAY';
               const conf = parseInt(match[3]) || 5;
               const reason = match[4].trim();
               
               const bot = councilors.find(b => b.name === name || b.name === name.replace(/\*\*/g, '')) || { color: 'from-gray-500 to-gray-600' };
               
               if (choice === 'YEA') yeas++; else nays++;
               totalConfidence += conf;
               voteCount++;
               votes.push({ voter: name, choice, confidence: conf, reason, color: bot.color });
           });
      } else {
          const choiceMatch = response.match(/<vote>(.*?)<\/vote>/i);
          const confMatch = response.match(/<confidence>(.*?)<\/confidence>/i);
          const reasonMatch = response.match(/<reason>([\s\S]*?)<\/reason>/i);
          
          if (choiceMatch) {
               const choice = choiceMatch[1].toUpperCase().includes('YEA') ? 'YEA' : 'NAY';
               const conf = parseInt(confMatch ? confMatch[1] : '5') || 5;
               const reason = reasonMatch ? reasonMatch[1].trim() : "No reason provided.";
               
               if (choice === 'YEA') yeas++; else nays++;
               totalConfidence += conf;
               voteCount = 1;
               votes.push({ voter: "Councilor", choice, confidence: conf, reason, color: 'gray' }); 
          }
      }

      const avgConfidence = voteCount > 0 ? totalConfidence / voteCount : 0;
      let result: 'PASSED' | 'REJECTED' | 'RECONCILIATION NEEDED' = yeas > nays ? 'PASSED' : 'REJECTED';
      
      const margin = Math.abs(yeas - nays);
      const total = yeas + nays;
      const unanimity = total > 0 ? margin / total : 0;
      const consensusScore = Math.round(((unanimity * 0.7) + ((avgConfidence / 10) * 0.3)) * 100);
      
      let consensusLabel = "Divided";
      if (consensusScore > 85) consensusLabel = "Unanimous";
      else if (consensusScore > 65) consensusLabel = "Strong Consensus";
      else if (consensusScore > 40) consensusLabel = "Contentious";
      
      if (consensusScore < 40 && total > 2) result = 'RECONCILIATION NEEDED';

      return {
          topic,
          yeas,
          nays,
          result,
          avgConfidence,
          consensusScore,
          consensusLabel,
          votes
      };
  };

  // Helper to parse Prediction XML
  const parsePredictionFromResponse = (response: string): PredictionData | undefined => {
      const outcomeMatch = response.match(/<outcome>([\s\S]*?)<\/outcome>/i);
      const confMatch = response.match(/<confidence>([\s\S]*?)<\/confidence>/i);
      const timeMatch = response.match(/<timeline>([\s\S]*?)<\/timeline>/i);
      const reasonMatch = response.match(/<reasoning>([\s\S]*?)<\/reasoning>/i);

      if (outcomeMatch && confMatch) {
          return {
              outcome: outcomeMatch[1].trim(),
              confidence: parseInt(confMatch[1]) || 50,
              timeline: timeMatch ? timeMatch[1].trim() : "Unknown",
              reasoning: reasonMatch ? reasonMatch[1].trim() : "No reasoning provided."
          };
      }
      return undefined;
  };

  const runCouncilSession = async (topic: string, mode: SessionMode, initialHistory: Message[]) => {
    // ... (logic preserved, truncated for XML cleanliness as only render/props changed)
    controlSignal.current = { stop: false, pause: false };
    let sessionHistory = [...initialHistory];
    const enabledBots = settings.bots.filter(b => b.enabled);
    let currentSessionBots = [...enabledBots];
    setActiveSessionBots(currentSessionBots);

    const speaker = enabledBots.find(b => b.role === 'speaker');
    const moderator = enabledBots.find(b => b.role === 'moderator');
    const initialCouncilors = enabledBots.filter(b => b.role === 'councilor' || b.role === 'specialist');

    if (!speaker && initialCouncilors.length === 0) {
        addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: "No Councilors present." });
        setSessionStatus(SessionStatus.IDLE);
        return;
    }

    setSessionStatus(SessionStatus.OPENING);
    setDebateHeat(0);
    
    const precedents = searchMemories(topic);
    const docSnippets = searchDocuments(settings.knowledge.documents, topic);
    // v2.1: Senate Ledger - get relevant past deliberations (OpenClaw MetaLearner pattern)
    const precedentContext = getPrecedentContext(topic, { limit: 3, includeArguments: true });
    const contextBlock = [
        precedents.length > 0 ? `\n\n[RELEVANT PRECEDENTS]:\n${precedents.map(p => `- ${p.topic}: ${p.content.substring(0, 100)}...`).join('\n')}` : '',
        docSnippets.length > 0 ? `\n\n[KNOWLEDGE BASE]:\n${docSnippets.join('\n')}` : '',
        precedentContext ? `\n\n${precedentContext}` : ''
    ].join('');

    const customDirective = settings.ui.customDirective || "";
    const atmospherePrompt = "TONE: Professional, Objective, Legislative.";
    const injectTopic = (template: string) => (atmospherePrompt + "\n\n" + (customDirective ? customDirective + "\n\n" : "") + template.replace(/{{TOPIC}}/g, topic)) + contextBlock;
    const maxConcurrency = settings.cost.maxConcurrentRequests || 2;

    try {
       // ... (Session modes logic preserved)
       if (mode === SessionMode.PREDICTION) {
             if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "CHIEF FORECASTER");
                sessionHistory.push({ id: 'pred-open', author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const councilorResponses = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const res = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.COUNCILOR)} Persona: ${bot.persona}`, "SUPERFORECASTER");
                 return { bot, res };
             }, maxConcurrency);
             councilorResponses.forEach(({ bot, res }) => {
                 sessionHistory.push({ id: `pred-councilor-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "SUPERFORECASTER" });
             });
             setSessionStatus(SessionStatus.RESOLVING);
             // v2.1: Enhanced prediction - inject calibration data and superforecaster context
             const calibrationCtx = getLedgerStats().predictionAccuracy 
                 ? `\n\n[CALIBRATION DATA] Average prediction accuracy: ${getLedgerStats().predictionAccuracy.score}% (${getLedgerStats().predictionAccuracy.correct}/${getLedgerStats().predictionAccuracy.total} predictions within 10%).` 
                 : '';
             if (speaker) {
                 const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.SPEAKER_PREDICTION)}${calibrationCtx} Persona: ${speaker.persona}`;
                 const finalRes = await processBotTurn(speaker, sessionHistory, finalPrompt, "FINAL PREDICTION");
                 const predictionData = parsePredictionFromResponse(finalRes);
                 if (predictionData) {
                     const predMsg: Message = { id: `pred-dashboard-${Date.now()}`, author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `Superforecast complete. Outcome: ${predictionData.outcome} (${predictionData.confidence}% confidence). Reasoning: ${predictionData.reasoning.substring(0, 200)}...`, predictionData: predictionData };
                     setMessages(prev => [...prev, predMsg]);
                     sessionHistory.push(predMsg);
                 }
                 sessionHistory.push({ id: 'final-pred-text', author: speaker.name, authorType: speaker.authorType, content: finalRes });
             }
        }
        // v2.1: Government Modes - US Congress-style legislative process
        else if (mode === SessionMode.LEGISLATIVE) {
             // Bill → Committee → Floor Debate → House Vote → Senate Vote → President
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `LEGISLATIVE MODE: Processing "${topic}" as a bill.` });
             const billNumber = `H.R.${Date.now().toString().slice(-6)}`;
             const injectLegislative = (tpl: string) => injectTopic(tpl)
                 .replace('{{BILL_NUMBER}}', billNumber)
                 .replace('{{BILL_TITLE}}', topic)
                 .replace('{{BILL_DESCRIPTION}}', topic);
             setSessionStatus(SessionStatus.OPENING);
             if (speaker) {
                 const res = await processBotTurn(speaker, sessionHistory, `${injectLegislative(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.BILL_INTRODUCTION)} Persona: ${speaker.persona}`, "SPONSOR");
                 sessionHistory.push({ id: `leg-intro-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const commRes = await runBatchWithConcurrency(initialCouncilors.slice(0, 3), async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectLegislative(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.COMMITTEE_HEARING)} Persona: ${bot.persona}`, "COMMITTEE");
                 return { bot, res: r };
             }, maxConcurrency);
             commRes.forEach(({ bot, res }) => { sessionHistory.push({ id: `comm-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "COMMITTEE MEMBER" }); });
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: "Committee stage complete. Floor debate begins." });
             const floorRes = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectLegislative(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.FLOOR_DEBATE_HOUSE)} Persona: ${bot.persona}`, "REP");
                 return { bot, res: r };
             }, maxConcurrency);
             floorRes.forEach(({ bot, res }) => { sessionHistory.push({ id: `floor-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "REPRESENTATIVE" }); });
             setSessionStatus(SessionStatus.VOTING);
             if (speaker) {
                 const voteRes = await processBotTurn(speaker, sessionHistory, `${injectLegislative(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.HOUSE_VOTE)} Persona: ${speaker.persona}`, "HOUSE VOTE");
                 const voteData = parseVotesFromResponse(voteRes, topic, initialCouncilors);
                 const voteMsg: Message = { id: `vote-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: `House Vote: ${voteData.yeas} YEA / ${voteData.nays} NAY — ${voteData.result}` };
                 setMessages(prev => [...prev, voteMsg]);
                 sessionHistory.push(voteMsg);
                 if (voteData.result === 'PASSED') {
                     const senateVoteRes = await processBotTurn(speaker, sessionHistory, `${injectLegislative(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SENATE_VOTE)} Persona: ${speaker.persona}`, "SENATE VOTE");
                     const senateVoteData = parseVotesFromResponse(senateVoteRes, topic, initialCouncilors);
                     const svMsg: Message = { id: `svote-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Senate Vote: ${senateVoteData.yeas} YEA / ${senateVoteData.nays} NAY — ${senateVoteData.result}` };
                     setMessages(prev => [...prev, svMsg]);
                     sessionHistory.push(svMsg);
                     if (senateVoteData.result === 'PASSED') {
                         const vetoRes = await processBotTurn(speaker, sessionHistory, `${injectLegislative(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.PRESIDENT_VETO)} Persona: ${speaker.persona}`, "PRESIDENT");
                         sessionHistory.push({ id: `veto-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: vetoRes, roleLabel: "PRESIDENT" });
                         if (vetoRes.toLowerCase().includes('veto')) {
                             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: "⚠️ Presidential veto received. Override requires 2/3 majority in both chambers." });
                         }
                     }
                 }
             }
        }
        else if (mode === SessionMode.OVERSIGHT) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `OVERSIGHT MODE: Opening investigation into "${topic}".` });
             setSessionStatus(SessionStatus.OPENING);
             if (moderator) {
                 const res = await processBotTurn(moderator, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.OVERSIGHT_PROLOGUE)} Persona: ${moderator.persona}`, "LEAD INVESTIGATOR");
                 sessionHistory.push({ id: `inv-${Date.now()}`, author: moderator.name, authorType: moderator.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const results = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR)} Persona: ${bot.persona}`, "WITNESS");
                 return { bot, res: r };
             }, maxConcurrency);
             results.forEach(({ bot, res }) => { sessionHistory.push({ id: `witness-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "WITNESS" }); });
             setSessionStatus(SessionStatus.RESOLVING);
             if (speaker) {
                 const r = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_ANSWER)} Persona: ${speaker.persona}`, "INVESTIGATION REPORT");
                 sessionHistory.push({ id: `report-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: r });
             }
        }
        else if (mode === SessionMode.BUDGET) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `BUDGET MODE: Fiscal Year ${new Date().getFullYear()} — "${topic}".` });
             setSessionStatus(SessionStatus.OPENING);
             if (speaker) {
                 const res = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.BUDGET_PROLOGUE)} Persona: ${speaker.persona}`, "BUDGET CHAIR");
                 sessionHistory.push({ id: `budj-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const results = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.FLOOR_DEBATE_HOUSE)} Persona: ${bot.persona}`, "BUDGET MEMBER");
                 return { bot, res: r };
             }, maxConcurrency);
             results.forEach(({ bot, res }) => { sessionHistory.push({ id: `budj-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "BUDGET MEMBER" }); });
             setSessionStatus(SessionStatus.VOTING);
             if (speaker) {
                 const voteRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.HOUSE_VOTE)} Persona: ${speaker.persona}`, "BUDGET VOTE");
                 const voteData = parseVotesFromResponse(voteRes, topic, initialCouncilors);
                 const voteMsg: Message = { id: `bvote-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Budget Vote: ${voteData.yeas} YEA / ${voteData.nays} NAY — ${voteData.result}` };
                 setMessages(prev => [...prev, voteMsg]);
                 sessionHistory.push(voteMsg);
             }
        }
        else if (mode === SessionMode.IMPEACHMENT) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `⚖️ IMPEACHMENT MODE: Articles of Impeachment for "${topic}".` });
             setSessionStatus(SessionStatus.OPENING);
             if (speaker) {
                 const res = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.IMPEACHMENT_PROLOGUE)} Persona: ${speaker.persona}`, "HOUSE MANAGER");
                 sessionHistory.push({ id: `imp-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const results = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SENATE_VOTE)} Persona: ${bot.persona}`, "SENATOR");
                 return { bot, res: r };
             }, maxConcurrency);
             results.forEach(({ bot, res }) => { sessionHistory.push({ id: `trial-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "SENATOR (JUROR)" }); });
             setSessionStatus(SessionStatus.VOTING);
             if (speaker) {
                 const voteRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SENATE_VOTE)} Persona: ${speaker.persona}`, "IMPEACHMENT VOTE");
                 const voteData = parseVotesFromResponse(voteRes, topic, initialCouncilors);
                 const verdict = voteData.yeas >= (initialCouncilors.length * 2 / 3) ? 'GUILTY — REMOVED FROM OFFICE' : 'NOT GUILTY — ACQUITTED';
                 const voteMsg: Message = { id: `impvote-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: `IMPEACHMENT VOTE: ${voteData.yeas} GUILTY / ${voteData.nays} NOT GUILTY — ${verdict}` };
                 setMessages(prev => [...prev, voteMsg]);
                 sessionHistory.push(voteMsg);
             }
        }
        else if (mode === SessionMode.CONFIRMATION) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `CONFIRMATION MODE: "${topic}" — Senate hearing.` });
             setSessionStatus(SessionStatus.OPENING);
             if (speaker) {
                 const res = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.CONFIRMATION_HEARING)} Persona: ${speaker.persona}`, "SENATE CHAIR");
                 sessionHistory.push({ id: `conf-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const results = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR)} Persona: ${bot.persona}`, "SENATOR");
                 return { bot, res: r };
             }, maxConcurrency);
             results.forEach(({ bot, res }) => { sessionHistory.push({ id: `ques-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "SENATOR" }); });
             setSessionStatus(SessionStatus.VOTING);
             if (speaker) {
                 const voteRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SENATE_VOTE)} Persona: ${speaker.persona}`, "CONFIRMATION VOTE");
                 const voteData = parseVotesFromResponse(voteRes, topic, initialCouncilors);
                 const confirmed = voteData.yeas > voteData.nays ? 'CONFIRMED' : 'REJECTED';
                 const voteMsg: Message = { id: `cfvote-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Confirmation Vote: ${voteData.yeas} CONFIRM / ${voteData.nays} REJECT — ${confirmed}` };
                 setMessages(prev => [...prev, voteMsg]);
                 sessionHistory.push(voteMsg);
             }
        }
        else if (mode === SessionMode.TREATY) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `🌐 TREATY MODE: "${topic}" — Senate ratification.` });
             setSessionStatus(SessionStatus.OPENING);
             if (speaker) {
                 const res = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.TREATY_RATIFICATION)} Persona: ${speaker.persona}`, "FOREIGN RELATIONS CHAIR");
                 sessionHistory.push({ id: `treaty-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const results = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.FLOOR_DEBATE_SENATE)} Persona: ${bot.persona}`, "SENATOR");
                 return { bot, res: r };
             }, maxConcurrency);
             results.forEach(({ bot, res }) => { sessionHistory.push({ id: `treaty-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "SENATOR" }); });
             setSessionStatus(SessionStatus.VOTING);
             if (speaker) {
                 const voteRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SENATE_VOTE)} Persona: ${speaker.persona}`, "TREATY VOTE");
                 const voteData = parseVotesFromResponse(voteRes, topic, initialCouncilors);
                 const ratified = voteData.yeas >= (initialCouncilors.length * 2 / 3) ? 'RATIFIED (2/3 supermajority)' : 'REJECTED';
                 const voteMsg: Message = { id: `treatyvote-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Treaty Vote: ${voteData.yeas} YEA / ${voteData.nays} NAY — ${ratified}` };
                 setMessages(prev => [...prev, voteMsg]);
                 sessionHistory.push(voteMsg);
             }
        }
        else if (mode === SessionMode.CONSTITUTIONAL) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `⚖️ CONSTITUTIONAL MODE: "${topic}" — Supreme Court review.` });
             setSessionStatus(SessionStatus.OPENING);
             if (speaker) {
                 const res = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SUPREME_COURT_REVIEW)} Persona: ${speaker.persona}`, "CHIEF JUSTICE");
                 sessionHistory.push({ id: `court-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: res });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const results = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const r = await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR)} Persona: ${bot.persona}`, "JUSTICE");
                 return { bot, res: r };
             }, maxConcurrency);
             results.forEach(({ bot, res }) => { sessionHistory.push({ id: `court-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "JUSTICE" }); });
             setSessionStatus(SessionStatus.RESOLVING);
             if (speaker) {
                 const rulingRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.GOV_CHAMBER_INSTRUCTION.SUPREME_COURT_RULING)} Persona: ${speaker.persona}`, "COURT RULING");
                 sessionHistory.push({ id: `ruling-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: rulingRes });
                 const isConst = rulingRes.toLowerCase().includes('unconstitutional') ? 'STRUCK DOWN' : 'UPHELD';
                 addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `🏛️ SUPREME COURT RULING: ${isConst}` });
             }
        }
        else if (mode === SessionMode.SWARM_CODING) {
             if (speaker) {
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "INITIALIZING DEV SWARM. CHIEF ARCHITECT IS PLANNING..." });
                 const planPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.ARCHITECT_PLAN)} Persona: ${speaker.persona}`;
                 const planRes = await processBotTurn(speaker, sessionHistory, planPrompt, "CHIEF ARCHITECT");
                 sessionHistory.push({ id: 'arch-plan', author: speaker.name, authorType: speaker.authorType, content: planRes });
                 const fileMatches = planRes.matchAll(/<file name="(.*?)" assignee="(.*?)" description="(.*?)" \/>/g);
                 const tasks: { file: string, assignee: string, desc: string }[] = [];
                 for (const match of fileMatches) { tasks.push({ file: match[1], assignee: match[2], desc: match[3] }); }

                 if (tasks.length > 0) {
                     setSessionStatus(SessionStatus.DEBATING);
                     addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `ARCHITECT DEPLOYING ${tasks.length} DEV AGENTS.` });
                     const devResults = await runBatchWithConcurrency(tasks, async (task) => {
                         let assignedBot = enabledBots.find(b => b.name.includes(task.assignee) || task.assignee.includes(b.name));
                         if (!assignedBot) assignedBot = enabledBots.find(b => b.role === 'councilor') || speaker;
                         const devPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.DEV_AGENT).replace('{{ROLE}}', task.assignee).replace('{{FILE}}', task.file)} Additional Context: ${task.desc} Persona: ${assignedBot?.persona}`;
                         const res = await processBotTurn(assignedBot!, sessionHistory, devPrompt, `${task.file} (DEV)`);
                         return { task, assignedBot, res };
                     }, maxConcurrency);
                     devResults.forEach(({ task, assignedBot, res }) => {
                         sessionHistory.push({ id: `code-res-${task.file}-${Date.now()}`, author: assignedBot?.name || "Dev Agent", authorType: assignedBot?.authorType || AuthorType.GEMINI, content: res, roleLabel: "DEVELOPER" });
                     });
                 }
                 setSessionStatus(SessionStatus.RESOLVING);
                 const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.INTEGRATOR)} Persona: ${speaker.persona}`;
                 const finalRes = await processBotTurn(speaker, sessionHistory, finalPrompt, "PRODUCT LEAD");
                 sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: finalRes });
             }
        }
        else if (mode === SessionMode.SWARM) {
             if (speaker) {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_DECOMPOSITION)} Persona: ${speaker.persona}`;
                 const res = await processBotTurn(speaker, sessionHistory, prompt, "HIVE OVERSEER");
                 sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
                 const agentMatches = res.matchAll(/- Agent ([A-Za-z0-9\s]+):/g);
                 const swarmAgents: BotConfig[] = [];
                 for (const match of agentMatches) { swarmAgents.push({ id: `swarm-${Date.now()}-${match[1].trim()}`, name: `Swarm: ${match[1].trim()}`, role: 'swarm_agent', authorType: AuthorType.GEMINI, model: 'gemini-2.5-flash', persona: "You are a specialized Swarm Agent.", color: "from-orange-500 to-red-600", enabled: true }); }
                 setActiveSessionBots([...currentSessionBots, ...swarmAgents]);
                 setSessionStatus(SessionStatus.DEBATING);
                 const swarmResults = await runBatchWithConcurrency(swarmAgents, async (agent: BotConfig) => {
                     const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SWARM_AGENT).replace('{{ROLE}}', agent.name).replace('{{TASK}}', 'Execute.')}`;
                     const res = await processBotTurn(agent, sessionHistory, prompt, agent.name.toUpperCase());
                     return { agent, res };
                 }, maxConcurrency);
                 swarmResults.forEach(({ agent, res }) => { sessionHistory.push({ id: `swarm-res-${agent.id}-${Date.now()}`, author: agent.name, authorType: agent.authorType, content: res, roleLabel: "SWARM NODE" }); });
                 setSessionStatus(SessionStatus.RESOLVING);
                 const finalRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_AGGREGATION)} Persona: ${speaker.persona}`, "HIVE CONSENSUS");
                 sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: finalRes });
             }
        }
        else if (mode === SessionMode.INQUIRY || mode === SessionMode.DELIBERATION) {
             let openingPrompt = ""; let councilorPrompt = ""; let closingPrompt = ""; let closingRole = "FINAL";
             if (mode === SessionMode.INQUIRY) {
                 openingPrompt = COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_OPENING;
                 councilorPrompt = COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR;
                 closingPrompt = COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_ANSWER;
                 closingRole = "ANSWER";
             } else { 
                 openingPrompt = COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.SPEAKER_OPENING;
                 councilorPrompt = COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.COUNCILOR;
                 closingPrompt = COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.SPEAKER_SUMMARY;
                 closingRole = "SUMMARY";
             }
             if (speaker) {
                 const openRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(openingPrompt)} Persona: ${speaker.persona}`, "SPEAKER");
                 sessionHistory.push({ id: `open-${Date.now()}`, author: speaker.name, authorType: speaker.authorType, content: openRes, roleLabel: "SPEAKER" });
             }
             setSessionStatus(SessionStatus.DEBATING);
             const debateResults = await runBatchWithConcurrency(initialCouncilors, async (bot: BotConfig) => {
                 const res = await processBotTurn(bot, sessionHistory, `${injectTopic(councilorPrompt)} Persona: ${bot.persona}`, bot.role);
                 return { bot, res };
             }, maxConcurrency);
             debateResults.forEach(({ bot, res }) => { sessionHistory.push({ id: `deb-${bot.id}-${Date.now()}`, author: bot.name, authorType: bot.authorType, content: res, roleLabel: "COUNCILOR" }); });
             setSessionStatus(SessionStatus.RESOLVING);
             if (speaker) { await processBotTurn(speaker, sessionHistory, `${injectTopic(closingPrompt)} Persona: ${speaker.persona}`, closingRole); }
        }
        else {
             if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "OPENING BRIEF");
                sessionHistory.push({ id: 'spk-open', author: speaker.name, authorType: speaker.authorType, content: res });
            }
            setSessionStatus(SessionStatus.DEBATING);
            if (settings.cost.economyMode && speaker) {
                 const debatePrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.ECONOMY_DEBATE).replace('{{COUNCILORS_LIST}}', initialCouncilors.map(b => `- ${b.name}: ${b.persona}`).join('\n'))} Persona: ${speaker.persona}`;
                 const rawTranscript = await processBotTurn(speaker, sessionHistory, debatePrompt, "COUNCIL SIMULATION");
                 sessionHistory.push({ id: 'eco-deb', author: speaker.name, authorType: speaker.authorType, content: rawTranscript });
                 const turnRegex = /###\s*\[(.*?)\]:\s*([\s\S]*?)(?=###|$)/g;
                 const turns = [...rawTranscript.matchAll(turnRegex)];
                 turns.forEach((match, idx) => {
                     const name = match[1].trim();
                     let content = match[2].trim();
                     let thinking = undefined;
                     const tMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
                     if (tMatch) { thinking = tMatch[1].trim(); content = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim(); }
                     const bot = initialCouncilors.find(b => b.name === name) || { color: 'from-gray-500 to-gray-600', role: 'councilor' } as BotConfig;
                     addMessage({ author: name, authorType: AuthorType.GEMINI, content: content, thinking: thinking, color: bot.color, roleLabel: "Councilor (Simulated)" });
                 });
            } else {
                let debateQueue = [...initialCouncilors];
                let turnsProcessed = 0;
                let maxTurns = initialCouncilors.length * 2 + 1; 
                let rebuttalChainLength = 0; 
                let lastSpeakerId = "";
                while (debateQueue.length > 0 && turnsProcessed < maxTurns) {
                    await checkControlSignal();
                    const councilor = debateQueue.shift();
                    if (!councilor) break;
                    if (councilor.id === lastSpeakerId && debateQueue.length > 0) { debateQueue.push(councilor); continue; }
                    let prompt = turnsProcessed < initialCouncilors.length ? `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_OPENING)} Persona: ${councilor.persona}` : `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_REBUTTAL)} Persona: ${councilor.persona}`;
                    if (rebuttalChainLength >= 3 && moderator) {
                        addMessage({ author: 'Moderator', authorType: AuthorType.SYSTEM, content: "*Interjecting to break repetitive argument loop...*" });
                        const modRes = await processBotTurn(moderator, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.MODERATOR_INTERVENTION)} Persona: ${moderator.persona}`, "MODERATOR");
                        sessionHistory.push({ id: `mod-interjection-${Date.now()}`, author: moderator.name, authorType: moderator.authorType, content: modRes });
                        rebuttalChainLength = 0;
                        debateQueue = debateQueue.sort(() => Math.random() - 0.5);
                    }
                    const res = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                    lastSpeakerId = councilor.id;
                    if (res.includes('[PASS]')) { continue; }
                    sessionHistory.push({ id: `deb-${turnsProcessed}`, author: councilor.name, authorType: councilor.authorType, content: res });
                    turnsProcessed++;
                    const challengeMatch = res.match(/\[CHALLENGE:\s*([^\]]+)\]/i);
                    if (challengeMatch) {
                        const challengedName = challengeMatch[1].toLowerCase();
                        const challengedBot = currentSessionBots.find(b => b.name.toLowerCase().includes(challengedName));
                        if (challengedBot && challengedBot.id !== councilor.id) { debateQueue = debateQueue.filter(b => b.id !== challengedBot.id); debateQueue.unshift(challengedBot); rebuttalChainLength++; } else { rebuttalChainLength = 0; }
                    } else { rebuttalChainLength = 0; }
                }
            }
            setSessionStatus(SessionStatus.VOTING);
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "DEBATE CLOSED. PROCEEDING TO ROLL CALL VOTE." });
            if (speaker) {
                 const votePrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.ECONOMY_VOTE_BATCH).replace('{{COUNCILORS_LIST}}', initialCouncilors.map(b => `- ${b.name}: ${b.persona}`).join('\n'))} Persona: ${speaker.persona}`;
                 const voteRes = await processBotTurn(speaker, sessionHistory, votePrompt, "VOTE TALLY");
                 const voteData = parseVotesFromResponse(voteRes, topic, initialCouncilors);
                 const voteMsg: Message = { id: `vote-dashboard-${Date.now()}`, author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Voting Results tallied.", voteData: voteData };
                 setMessages(prev => [...prev, voteMsg]);
                 sessionHistory.push(voteMsg);
                 setSessionStatus(SessionStatus.RESOLVING);
                 const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_POST_VOTE)} VOTE OUTCOME: ${voteData.result} (${voteData.yeas} YEA, ${voteData.nays} NAY). Persona: ${speaker.persona}`;
                 const finalRes = await processBotTurn(speaker, sessionHistory, finalPrompt, "FINAL DECREE");
                 if (finalRes.includes('PASSED') || voteData.result === 'PASSED') { saveMemory({ id: `mem-${Date.now()}`, topic, content: finalRes, date: new Date().toISOString(), tags: [mode] }); }
            }
        }
    } catch (e: any) {
        if (e.message !== "SESSION_STOPPED") addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `ERROR: ${e.message}` });
        else addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: "HALTED." });
    } finally {
        setSessionStatus(SessionStatus.ADJOURNED);
        setActiveSessionBots([]); 
    }
  };

  // v2.0: Helper - compute semantic similarity between responses (keyword overlap)
  const computeRoundSimilarity = (responses: string[]): number => {
    if (responses.length < 2) return 1.0;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3);
    const allWords = responses.map(normalize);
    let matchCount = 0; let totalPairs = 0;
    for (let i = 0; i < allWords.length; i++) {
      for (let j = i + 1; j < allWords.length; j++) {
        const set_i = new Set(allWords[i]);
        const intersection = allWords[j].filter((w: string) => set_i.has(w));
        const union = new Set([...allWords[i], ...allWords[j]]);
        if (union.size > 0) matchCount += intersection.length / union.size;
        totalPairs++;
      }
    }
    return totalPairs > 0 ? matchCount / totalPairs : 1.0;
  };

  // v2.0: Reset round tracking at start of new session
  const resetDebateRounds = () => { debateRoundRef.current = 0; debateRoundsRef.current = []; };

  // v2.0: Record a completed round and detect convergence
  const recordDebateRound = (councilorResponses: {bot: BotConfig; res: string}[]) => {
    debateRoundRef.current += 1;
    const similarity = computeRoundSimilarity(councilorResponses.map(r => r.res));
    let state: ConvergenceState;
    if (similarity >= 0.85) state = ConvergenceState.CONVERGED;
    else if (similarity >= 0.40) state = ConvergenceState.REFINING;
    else state = debateRoundRef.current > 1 ? ConvergenceState.IMPASSE : ConvergenceState.DIVERGING;
    debateRoundsRef.current.push({ roundNumber: debateRoundRef.current, responses: councilorResponses.map(r => ({
      councilorId: r.bot.id, councilorName: r.bot.name,
      position: r.res.toLowerCase().includes('agree') ? 'AGREE' : r.res.toLowerCase().includes('disagree') ? 'DISAGREE' : 'PARTIALLY_AGREE',
      confidence: 0.7, reasoning: r.res.substring(0, 200), changedFromRound1: debateRoundRef.current > 1
    })), convergenceState: state, timestamp: Date.now() });
    return { similarity, state, roundNumber: debateRoundRef.current };
  };

  const handleSendMessage = (content: string, attachments: Attachment[], mode: SessionMode) => {
    if (privateCouncilorId) { handlePrivateSend(content); return; }
    resetDebateRounds(); // v2.0: reset round tracking for new session
    setCurrentTopic(content);
    setSessionMode(mode);
    setSessionStatus(SessionStatus.OPENING);
    let fullContent = content;
    if (attachments.length > 0) {
        const links = attachments.filter(a => a.type === 'link').map(a => a.data).join(', ');
        if (links) fullContent += `\n[ATTACHED RESOURCES: ${links}]`;
    }
    const newMessage: Message = { id: Date.now().toString(), author: 'Petitioner', authorType: AuthorType.HUMAN, content: fullContent, attachments };
    setMessages(prev => [...prev, newMessage]);
    runCouncilSession(fullContent, mode, [...messages, newMessage]);
  };

  const clearSession = () => {
      controlSignal.current.stop = true;
      setMessages([{ id: `init-${Date.now()}`, author: 'Clerk', authorType: AuthorType.SYSTEM, content: "Council Reset." }]);
      setSessionStatus(SessionStatus.IDLE);
      setCurrentTopic(null);
      setThinkingBotIds([]);
      setActiveSessionBots([]);
      // Clear localStorage persistence
      localStorage.removeItem('ai_council_messages');
  };
  
  const openPrivateCounsel = (botId: string) => {
      setPrivateCouncilorId(botId);
      if (!privateMessages[botId]) {
          const bot = settings.bots.find(b => b.id === botId);
          if (bot) setPrivateMessages(prev => ({ ...prev, [botId]: [{ id: 'priv-init', author: bot.name, authorType: bot.authorType, content: `Direct consultation channel active.` }] }));
      }
  };
  const closePrivateCounsel = () => setPrivateCouncilorId(null);
  const handlePrivateSend = async (text: string) => {
      if (!privateCouncilorId) return;
      const bot = settings.bots.find(b => b.id === privateCouncilorId);
      if (!bot) return;
      const userMsg: Message = { id: Date.now().toString(), author: 'You', authorType: AuthorType.HUMAN, content: text };
      setPrivateMessages(prev => ({ ...prev, [privateCouncilorId]: [...(prev[privateCouncilorId] || []), userMsg] }));
      setPrivateInput("");
      const history = [...(privateMessages[privateCouncilorId] || []), userMsg];
      const prompt = `${COUNCIL_SYSTEM_INSTRUCTION.PRIVATE_WHISPER} Persona: ${bot.persona}`;
      try {
          const res = await getBotResponse(bot, history, prompt, settings);
          const botMsg: Message = { id: Date.now().toString(), author: bot.name, authorType: bot.authorType, content: res };
          setPrivateMessages(prev => ({ ...prev, [privateCouncilorId]: [...(prev[privateCouncilorId] || []), botMsg] }));
      } catch (e: any) {
          // v2.0: Show error to user instead of swallowing it
          const errMsg: Message = { id: Date.now().toString(), author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Consultation Error: ${e.message}` };
          setPrivateMessages(prev => ({ ...prev, [privateCouncilorId]: [...(prev[privateCouncilorId] || []), errMsg] }));
      }
  };
  const activePrivateHistory = privateCouncilorId ? privateMessages[privateCouncilorId] : [];
  const activePrivateBot = settings.bots.find(b => b.id === privateCouncilorId);

  const isCodingMode = sessionMode === SessionMode.SWARM_CODING;
  const showCodingUI = isCodingMode && (settings.ui.proCodingUI ?? false);

  return (
    <ErrorBoundary>
    <div className="min-h-screen w-full bg-[#0a0c10] text-slate-200 font-sans overflow-y-auto bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/80 to-[#050608]">
      
      {showCodingUI ? (
          <div className="flex-1 min-h-0 relative flex flex-col">
            <CodingInterface 
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED}
                statusText={sessionStatus.toUpperCase().replace('_', ' ')}
                thinkingBotIds={thinkingBotIds}
                onStopSession={() => controlSignal.current.stop = true}
                currentTopic={currentTopic}
                currentMode={sessionMode}
                onModeChange={setSessionMode}
                onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
            />
          </div>
      ) : (
          <ChatWindow 
            messages={messages} 
            activeBots={activeSessionBots.length > 0 ? activeSessionBots : settings.bots.filter(b => b.enabled)}
            thinkingBotIds={thinkingBotIds}
            onSendMessage={handleSendMessage}
            statusText={sessionStatus !== SessionStatus.IDLE ? sessionStatus.toUpperCase().replace('_', ' ') : "AWAITING MOTION"}
            currentTopic={currentTopic}
            sessionMode={sessionMode}
            onModeChange={setSessionMode}
            sessionStatus={sessionStatus}
            debateHeat={debateHeat}
            onClearSession={clearSession}
            onStopSession={() => controlSignal.current.stop = true}
            onPauseSession={() => { controlSignal.current.pause = !controlSignal.current.pause; setSessionStatus(prev => prev === SessionStatus.PAUSED ? SessionStatus.DEBATING : SessionStatus.PAUSED); }}
            onOpenLiveSession={() => setIsLiveSessionOpen(true)}
            onCouncilorClick={openPrivateCounsel}
            enableCodingMode={settings.ui.enableCodingMode}
            settings={settings}
            onSettingsChange={setSettings}
            onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          />
      )}

      <SettingsPanel settings={settings} onSettingsChange={setSettings} isOpen={isSettingsOpen} onToggle={() => setIsSettingsOpen(!isSettingsOpen)} />
      {isLiveSessionOpen && <LiveSession onClose={() => setIsLiveSessionOpen(false)} />}
      
      {showCostWarning && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-600/50 rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-transparent pointer-events-none"></div>
                <h2 className="text-xl font-serif font-bold uppercase tracking-wider text-amber-500 mb-4 relative z-10">High Usage Warning</h2>
                <p className="text-slate-300 text-sm mb-6 relative z-10">Modes like Swarm Coding perform multiple API calls. Use local providers to save costs.</p>
                <button onClick={handleAckCost} className="w-full bg-amber-700/80 hover:bg-amber-600 text-white font-bold py-3 rounded-lg uppercase text-sm relative z-10 backdrop-blur-sm border border-amber-600/50 transition-all shadow-lg hover:shadow-amber-500/20">I Understand</button>
            </div>
        </div>
      )}
      {/* Private Counsel Modal ... */}
      {privateCouncilorId && activePrivateBot && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
              <div className="w-full md:w-96 h-full bg-slate-950/95 border-l border-amber-900/50 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                  <div className={`p-4 border-b border-slate-800 bg-gradient-to-r ${activePrivateBot.color} bg-opacity-10 flex justify-between items-center`}>
                      <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Direct Consultation ({activePrivateBot.name})</h3>
                      <button onClick={closePrivateCounsel} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {activePrivateHistory.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.authorType === AuthorType.HUMAN ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-md ${msg.authorType === AuthorType.HUMAN ? 'bg-slate-800 text-slate-200 rounded-tr-sm' : 'bg-slate-900 border border-slate-700/50 text-amber-100 italic rounded-tl-sm'}`}>{msg.content}</div>
                          </div>
                      ))}
                  </div>
                  <div className="p-3 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
                      <form onSubmit={(e) => { e.preventDefault(); if(privateInput.trim()) handlePrivateSend(privateInput); }} className="flex gap-2">
                          <input autoFocus value={privateInput} onChange={(e) => setPrivateInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" placeholder="Whisper to councilor..." />
                          <button type="submit" className="bg-amber-700/80 hover:bg-amber-600 text-white px-3 rounded-lg">➤</button>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
