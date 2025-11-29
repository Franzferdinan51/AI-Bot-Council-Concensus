
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Settings, AuthorType, SessionStatus, BotConfig, VoteData, Attachment, SessionMode, MemoryEntry, ControlSignal, PredictionData } from './types';
import { getBotResponse, generateSpeech, streamBotResponse } from './services/aiService';
import { searchMemories, searchDocuments, saveMemory } from './services/knowledgeService';
import { COUNCIL_SYSTEM_INSTRUCTION, DEFAULT_SETTINGS } from './constants';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import LiveSession from './components/LiveSession';
import CodingInterface from './components/CodingInterface';

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

  useEffect(() => {
      const hasAck = localStorage.getItem('ai_council_cost_ack');
      if (!hasAck) {
          setShowCostWarning(true);
      }
  }, []);

  const handleAckCost = () => {
      localStorage.setItem('ai_council_cost_ack', 'true');
      setShowCostWarning(false);
  };

  // --- AUDIO HANDLING ---
  const speakText = useCallback(async (text: string, bot: BotConfig | null) => {
    if (!settings.audio.enabled) return;
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/[*_#]/g, '').replace(/```[\s\S]*?```/g, 'Code block omitted.');

    if (settings.audio.useGeminiTTS && bot && bot.authorType === AuthorType.GEMINI) {
        const apiKey = settings.providers.geminiApiKey || process.env.API_KEY || '';
        const audioData = await generateSpeech(cleanText, bot.role, apiKey);
        if (audioData) {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const binaryString = atob(audioData);
            const bytes = new Uint8Array(binaryString.length);
            for(let i=0; i<binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            const buffer = await audioCtx.decodeAudioData(bytes.buffer);
            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start();
            return;
        }
    }

    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.audio.speechRate;
    utterance.volume = settings.audio.voiceVolume;

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
          const cleanSpeech = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').replace(/<vote>[\s\S]*?<\/vote>/g, '').replace(/```[\s\S]*?```/g, '').trim();
          if (!cleanSpeech.includes('[PASS]') && cleanSpeech.length > 5) speakText(cleanSpeech, bot);
          await wait(1000);
          return fullResponse;
      } catch (e: any) {
          setThinkingBotIds(prev => prev.filter(id => id !== bot.id));
          if (e.message === "SESSION_STOPPED") throw e;
          updateMessageContent(tempMsg.id, `(Error: ${e.message})`);
          return "";
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
    controlSignal.current = { stop: false, pause: false };
    let sessionHistory = [...initialHistory];
    const enabledBots = settings.bots.filter(b => b.enabled);
    let currentSessionBots = [...enabledBots];
    setActiveSessionBots(currentSessionBots);

    const speaker = enabledBots.find(b => b.role === 'speaker');
    const moderator = enabledBots.find(b => b.role === 'moderator');
    const initialCouncilors = enabledBots.filter(b => b.role === 'councilor');

    if (!speaker && initialCouncilors.length === 0) {
        addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: "No Councilors present." });
        setSessionStatus(SessionStatus.IDLE);
        return;
    }

    setSessionStatus(SessionStatus.OPENING);
    setDebateHeat(0);
    
    const precedents = searchMemories(topic);
    const docSnippets = searchDocuments(settings.knowledge.documents, topic);
    const contextBlock = [
        precedents.length > 0 ? `\n\n[RELEVANT PRECEDENTS]:\n${precedents.map(p => `- ${p.topic}: ${p.content.substring(0, 100)}...`).join('\n')}` : '',
        docSnippets.length > 0 ? `\n\n[KNOWLEDGE BASE]:\n${docSnippets.join('\n')}` : ''
    ].join('');

    const customDirective = settings.ui.customDirective || "";
    const atmospherePrompt = "TONE: Professional, Objective, Legislative.";
    const injectTopic = (template: string) => (atmospherePrompt + "\n\n" + (customDirective ? customDirective + "\n\n" : "") + template.replace(/{{TOPIC}}/g, topic)) + contextBlock;
    const maxConcurrency = settings.cost.maxConcurrentRequests || 2;

    try {
        if (mode === SessionMode.PREDICTION) {
             // 1. Speaker Opening
             if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "CHIEF FORECASTER");
                sessionHistory.push({ id: 'pred-open', author: speaker.name, authorType: speaker.authorType, content: res });
             }
             
             setSessionStatus(SessionStatus.DEBATING);
             
             // 2. Councilors: Superforecasting Analysis
             await runBatchWithConcurrency(initialCouncilors.slice(0, 3), async (bot: BotConfig) => {
                 return await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.COUNCILOR)} Persona: ${bot.persona}`, "SUPERFORECASTER");
             }, maxConcurrency);

             // 3. Speaker: Final Synthesis & Prediction XML
             setSessionStatus(SessionStatus.RESOLVING);
             if (speaker) {
                 const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PREDICTION.SPEAKER_PREDICTION)} Persona: ${speaker.persona}`;
                 const finalRes = await processBotTurn(speaker, sessionHistory, finalPrompt, "FINAL PREDICTION");
                 
                 // Parse and add visual card
                 const predictionData = parsePredictionFromResponse(finalRes);
                 if (predictionData) {
                     const predMsg: Message = { 
                         id: `pred-dashboard-${Date.now()}`, 
                         author: 'Council Clerk', 
                         authorType: AuthorType.SYSTEM, 
                         content: "Prediction Model Generated.", 
                         predictionData: predictionData 
                     };
                     setMessages(prev => [...prev, predMsg]);
                     sessionHistory.push(predMsg);
                 }
                 
                 // Add the text response as well if it has extra commentary (and to show full thinking)
                 sessionHistory.push({ id: 'final-pred-text', author: speaker.name, authorType: speaker.authorType, content: finalRes });
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
                 for (const match of fileMatches) {
                     tasks.push({ file: match[1], assignee: match[2], desc: match[3] });
                 }

                 if (tasks.length > 0) {
                     setSessionStatus(SessionStatus.DEBATING);
                     addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `ARCHITECT DEPLOYING ${tasks.length} DEV AGENTS.` });
                     await runBatchWithConcurrency(tasks, async (task) => {
                         let assignedBot = enabledBots.find(b => b.name.includes(task.assignee) || task.assignee.includes(b.name));
                         if (!assignedBot) assignedBot = enabledBots.find(b => b.role === 'councilor') || speaker;
                         const devPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM_CODING.DEV_AGENT).replace('{{ROLE}}', task.assignee).replace('{{FILE}}', task.file)} Additional Context: ${task.desc} Persona: ${assignedBot?.persona}`;
                         return await processBotTurn(assignedBot!, sessionHistory, devPrompt, `${task.file} (DEV)`);
                     }, maxConcurrency);
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
                 for (const match of agentMatches) {
                     swarmAgents.push({ id: `swarm-${Date.now()}-${match[1].trim()}`, name: `Swarm: ${match[1].trim()}`, role: 'swarm_agent', authorType: AuthorType.GEMINI, model: 'gemini-2.5-flash', persona: "You are a specialized Swarm Agent.", color: "from-orange-500 to-red-600", enabled: true });
                 }
                 setActiveSessionBots([...currentSessionBots, ...swarmAgents]);
                 setSessionStatus(SessionStatus.DEBATING);
                 await runBatchWithConcurrency(swarmAgents, async (agent: BotConfig) => {
                     const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SWARM_AGENT).replace('{{ROLE}}', agent.name).replace('{{TASK}}', 'Execute.')}`;
                     return await processBotTurn(agent, sessionHistory, prompt, agent.name.toUpperCase());
                 }, maxConcurrency);
                 setSessionStatus(SessionStatus.RESOLVING);
                 const finalRes = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_AGGREGATION)} Persona: ${speaker.persona}`, "HIVE CONSENSUS");
                 sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: finalRes });
             }
        }
        else if (mode === SessionMode.RESEARCH) {
             if (speaker) {
                await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_PLANNING)} Persona: ${speaker.persona}`, "LEAD INVESTIGATOR");
                
                setSessionStatus(SessionStatus.DEBATING);
                await runBatchWithConcurrency(initialCouncilors.slice(0,3), async (bot: BotConfig) => {
                    return await processBotTurn(bot, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_1)} Persona: ${bot.persona}`, "RESEARCH AGENT (PHASE 1)");
                }, maxConcurrency);

                setSessionStatus(SessionStatus.RECONCILING);
                const gapAnalysis = await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_GAP_ANALYSIS)} Persona: ${speaker.persona}`, "GAP ANALYSIS");
                sessionHistory.push({ id: 'gap-analysis', author: speaker.name, authorType: speaker.authorType, content: gapAnalysis });

                setSessionStatus(SessionStatus.DEBATING);
                await runBatchWithConcurrency(initialCouncilors.slice(0,3), async (bot: BotConfig) => {
                    const depthPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_2).replace('{{GAP_CONTEXT}}', gapAnalysis)} Persona: ${bot.persona}`;
                    return await processBotTurn(bot, sessionHistory, depthPrompt, "RESEARCH AGENT (PHASE 2)");
                }, maxConcurrency);
                
                setSessionStatus(SessionStatus.RESOLVING);
                await processBotTurn(speaker, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_REPORT)} Persona: ${speaker.persona}`, "FINAL DOSSIER");
             }
        }
        else if (mode === SessionMode.INQUIRY || mode === SessionMode.DELIBERATION) {
             let openingPrompt = "";
             let councilorPrompt = "";
             let closingPrompt = "";
             let closingRole = "FINAL";
 
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
 
             if (speaker) await processBotTurn(speaker, sessionHistory, `${injectTopic(openingPrompt)} Persona: ${speaker.persona}`, "SPEAKER");
             
             setSessionStatus(SessionStatus.DEBATING);
             await runBatchWithConcurrency(initialCouncilors.slice(0,3), async (bot: BotConfig) => {
                 return await processBotTurn(bot, sessionHistory, `${injectTopic(councilorPrompt)} Persona: ${bot.persona}`, bot.role);
             }, maxConcurrency);
             
             setSessionStatus(SessionStatus.RESOLVING);
             if (speaker) {
                await processBotTurn(speaker, sessionHistory, `${injectTopic(closingPrompt)} Persona: ${speaker.persona}`, closingRole);
             }
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
                 
                 const turnRegex = /\*\*([^*]+)\*\*:\s*([\s\S]*?)(?=\*\*|$)/g;
                 const turns = [...rawTranscript.matchAll(turnRegex)];
                 
                 turns.forEach((match, idx) => {
                     const name = match[1].trim();
                     const content = match[2].trim();
                     const bot = initialCouncilors.find(b => b.name === name) || { color: 'from-gray-500 to-gray-600', role: 'councilor' } as BotConfig;
                     addMessage({ 
                         author: name, 
                         authorType: AuthorType.GEMINI,
                         content: content, 
                         color: bot.color, 
                         roleLabel: "Councilor (Simulated)" 
                     });
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

                    if (councilor.id === lastSpeakerId && debateQueue.length > 0) {
                        debateQueue.push(councilor);
                        continue;
                    }

                    let prompt = turnsProcessed < initialCouncilors.length 
                        ? `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_OPENING)} Persona: ${councilor.persona}` 
                        : `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_REBUTTAL)} Persona: ${councilor.persona}`;

                    if (rebuttalChainLength >= 3 && moderator) {
                        addMessage({ author: 'Moderator', authorType: AuthorType.SYSTEM, content: "*Interjecting to break repetitive argument loop...*" });
                        const modRes = await processBotTurn(moderator, sessionHistory, `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.MODERATOR_INTERVENTION)} Persona: ${moderator.persona}`, "MODERATOR");
                        sessionHistory.push({ id: `mod-interjection-${Date.now()}`, author: moderator.name, authorType: moderator.authorType, content: modRes });
                        rebuttalChainLength = 0;
                        debateQueue = debateQueue.sort(() => Math.random() - 0.5);
                    }

                    const res = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                    lastSpeakerId = councilor.id;

                    if (res.includes('[PASS]')) {
                        continue; 
                    }

                    sessionHistory.push({ id: `deb-${turnsProcessed}`, author: councilor.name, authorType: councilor.authorType, content: res });
                    turnsProcessed++;

                    const challengeMatch = res.match(/\[CHALLENGE:\s*([^\]]+)\]/i);
                    if (challengeMatch) {
                        const challengedName = challengeMatch[1].toLowerCase();
                        const challengedBot = currentSessionBots.find(b => b.name.toLowerCase().includes(challengedName));
                        
                        if (challengedBot && challengedBot.id !== councilor.id) {
                            debateQueue = debateQueue.filter(b => b.id !== challengedBot.id);
                            debateQueue.unshift(challengedBot);
                            rebuttalChainLength++;
                        } else {
                            rebuttalChainLength = 0;
                        }
                    } else {
                        rebuttalChainLength = 0;
                    }
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
                 if (finalRes.includes('PASSED') || voteData.result === 'PASSED') {
                     saveMemory({ id: `mem-${Date.now()}`, topic, content: finalRes, date: new Date().toISOString(), tags: [mode] });
                 }
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

  const handleSendMessage = (content: string, attachments: Attachment[], mode: SessionMode) => {
    if (privateCouncilorId) { handlePrivateSend(content); return; }
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
      } catch (e) { console.error(e); }
  };
  const activePrivateHistory = privateCouncilorId ? privateMessages[privateCouncilorId] : [];
  const activePrivateBot = settings.bots.find(b => b.id === privateCouncilorId);

  const isCodingMode = sessionMode === SessionMode.SWARM_CODING;
  const showCodingUI = isCodingMode && settings.ui.proCodingUI;

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-slate-950 flex flex-col font-sans text-slate-200 overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      
      {showCodingUI ? (
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
          />
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
          />
      )}

      <SettingsPanel settings={settings} onSettingsChange={setSettings} isOpen={isSettingsOpen} onToggle={() => setIsSettingsOpen(!isSettingsOpen)} />
      {isLiveSessionOpen && <LiveSession onClose={() => setIsLiveSessionOpen(false)} />}
      
      {showCostWarning && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-600 rounded-xl shadow-2xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold uppercase tracking-wider text-amber-500 mb-4">High Usage Warning</h2>
                <p className="text-slate-300 text-sm mb-6">Modes like Swarm Coding perform multiple API calls. Use local providers to save costs.</p>
                <button onClick={handleAckCost} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-lg uppercase text-sm">I Understand</button>
            </div>
        </div>
      )}
      {privateCouncilorId && activePrivateBot && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-end">
              <div className="w-full md:w-96 h-full bg-slate-950 border-l border-amber-900/50 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                  <div className={`p-4 border-b border-slate-800 bg-gradient-to-r ${activePrivateBot.color} bg-opacity-10 flex justify-between items-center`}>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Direct Consultation ({activePrivateBot.name})</h3>
                      <button onClick={closePrivateCounsel} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {activePrivateHistory.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.authorType === AuthorType.HUMAN ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded text-sm ${msg.authorType === AuthorType.HUMAN ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 border border-slate-700 text-amber-100 italic'}`}>{msg.content}</div>
                          </div>
                      ))}
                  </div>
                  <div className="p-3 border-t border-slate-800 bg-slate-900">
                      <form onSubmit={(e) => { e.preventDefault(); if(privateInput.trim()) handlePrivateSend(privateInput); }} className="flex gap-2">
                          <input autoFocus value={privateInput} onChange={(e) => setPrivateInput(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
                          <button type="submit" className="bg-amber-700 hover:bg-amber-600 text-white px-3 rounded">➤</button>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;