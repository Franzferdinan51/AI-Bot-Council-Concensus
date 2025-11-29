
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Settings, AuthorType, SessionStatus, BotConfig, VoteData, Attachment, SessionMode, MemoryEntry, ControlSignal } from './types';
import { getBotResponse, generateSpeech, streamBotResponse } from './services/aiService';
import { searchMemories, searchDocuments, saveMemory } from './services/knowledgeService';
import { COUNCIL_SYSTEM_INSTRUCTION, DEFAULT_SETTINGS } from './constants';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';
import LiveSession from './components/LiveSession';

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

  // CONTROL SIGNALS (Refs for synchronous access in async loops)
  const controlSignal = useRef<ControlSignal>({ stop: false, pause: false });

  // --- AUDIO HANDLING (TTS) ---
  const speakText = useCallback(async (text: string, bot: BotConfig | null) => {
    if (!settings.audio.enabled) return;
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/[*_#]/g, '');

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
    setMessages(prev => [...prev, newMessage]);
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

  // FLOW CONTROL HELPER
  const checkControlSignal = async () => {
      if (controlSignal.current.stop) throw new Error("SESSION_STOPPED");
      while (controlSignal.current.pause) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (controlSignal.current.stop) throw new Error("SESSION_STOPPED");
      }
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processBotTurn = async (
      bot: BotConfig, 
      history: Message[], 
      systemPrompt: string, 
      roleLabel?: string
  ): Promise<string> => {
      await checkControlSignal();
      setThinkingBotIds(prev => [...prev, bot.id]);
      await wait(settings.ui.debateDelay);
      await checkControlSignal();
      
      const tempMsg = addMessage({ 
          author: bot.name, 
          authorType: bot.authorType, 
          content: "...", 
          color: bot.color, 
          roleLabel: roleLabel || bot.role 
      });

      try {
          const fullResponse = await streamBotResponse(
              bot, 
              history, 
              systemPrompt, 
              settings, 
              (chunk) => updateMessageContent(tempMsg.id, chunk)
          );
          
          setThinkingBotIds(prev => prev.filter(id => id !== bot.id));
          const cleanSpeech = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
          speakText(cleanSpeech, bot);
          return fullResponse;
      } catch (e: any) {
          setThinkingBotIds(prev => prev.filter(id => id !== bot.id));
          if (e.message === "SESSION_STOPPED") throw e;
          updateMessageContent(tempMsg.id, `(Error: ${e.message})`);
          return "";
      }
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
        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "No Councilors or Speaker present. Please enable bots in Settings." });
        setSessionStatus(SessionStatus.IDLE);
        return;
    }

    setSessionStatus(SessionStatus.OPENING);
    
    // RAG INJECTION
    const precedents = searchMemories(topic);
    const docSnippets = searchDocuments(settings.knowledge.documents, topic);
    const contextBlock = [
        precedents.length > 0 ? `\n\n[RELEVANT PRECEDENTS]:\n${precedents.map(p => `- ${p.topic}: ${p.content.substring(0, 100)}...`).join('\n')}` : '',
        docSnippets.length > 0 ? `\n\n[KNOWLEDGE BASE]:\n${docSnippets.join('\n')}` : ''
    ].join('');

    const customDirective = settings.ui.customDirective || "";
    const injectTopic = (template: string) => {
        let text = template.replace(/{{TOPIC}}/g, topic);
        if (customDirective) text = customDirective + "\n\n" + text;
        return text + contextBlock;
    };

    try {
        // ==========================================
        // MODE: SWARM INTELLIGENCE
        // ==========================================
        if (mode === SessionMode.SWARM) {
             if (speaker) {
                 // 1. Decomposition
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PROTOCOL: HIVE DECOMPOSITION. Speaker is analyzing task vectors..." });
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_DECOMPOSITION)} Persona: ${speaker.persona}`;
                 const res = await processBotTurn(speaker, sessionHistory, prompt, "HIVE OVERSEER");
                 sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
                 
                 // 2. Spawn Agents based on output
                 const agentMatches = res.matchAll(/- Agent ([A-Za-z0-9\s]+):/g);
                 const swarmAgents: BotConfig[] = [];
                 for (const match of agentMatches) {
                     const agentName = match[1].trim();
                     swarmAgents.push({
                         id: `swarm-${Date.now()}-${agentName}`,
                         name: `Swarm: ${agentName}`,
                         role: 'swarm_agent',
                         authorType: AuthorType.GEMINI,
                         model: 'gemini-2.5-flash',
                         persona: "You are a specialized Swarm Agent. You exist only to process this specific sub-task.",
                         color: "from-orange-500 to-red-600",
                         enabled: true
                     });
                 }
                 
                 // Fallback if regex fails
                 if (swarmAgents.length === 0) {
                     swarmAgents.push(
                         { id: 'sw1', name: 'Swarm: Alpha', role: 'swarm_agent', authorType: AuthorType.GEMINI, model: 'gemini-2.5-flash', persona: 'Analyst', color: 'from-orange-500 to-red-600', enabled: true },
                         { id: 'sw2', name: 'Swarm: Beta', role: 'swarm_agent', authorType: AuthorType.GEMINI, model: 'gemini-2.5-flash', persona: 'Analyst', color: 'from-orange-500 to-red-600', enabled: true }
                     );
                 }

                 // Update UI to show swarm
                 setActiveSessionBots([...currentSessionBots, ...swarmAgents]);
                 await wait(1000);
                 
                 setSessionStatus(SessionStatus.DEBATING);
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `DEPLOYING ${swarmAgents.length} SWARM AGENTS.` });

                 // 3. Parallel Execution
                 const promises = swarmAgents.map(async (agent) => {
                     const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SWARM_AGENT).replace('{{ROLE}}', agent.name).replace('{{TASK}}', 'Execute your assigned vector from the Overseer.')}`;
                     const res = await processBotTurn(agent, sessionHistory, prompt, agent.name.toUpperCase());
                     return { agent, res };
                 });

                 const results = await Promise.all(promises);
                 results.forEach(({ agent, res }) => {
                     sessionHistory.push({ id: `swarm-${agent.id}`, author: agent.name, authorType: agent.authorType, content: res });
                 });

                 // 4. Aggregation
                 setSessionStatus(SessionStatus.RESOLVING);
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "AGGREGATING SWARM DATA." });
                 const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_AGGREGATION)} Persona: ${speaker.persona}`;
                 const finalRes = await processBotTurn(speaker, sessionHistory, finalPrompt, "HIVE CONSENSUS");
                 sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: finalRes });
             }
        }

        // ==========================================
        // MODE: DEEP RESEARCH (Iterative)
        // ==========================================
        else if (mode === SessionMode.RESEARCH) {
            if (speaker) {
                // Plan
                addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PROTOCOL: DEEP RESEARCH. Phase 1: Planning." });
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_PLANNING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "LEAD INVESTIGATOR");
                sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
            }

            setSessionStatus(SessionStatus.DEBATING);
            const investigators = initialCouncilors.slice(0, 3);
            
            // Phase 2: Breadth (Round 1)
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Phase 2: Broad Spectrum Collection." });
            for (const councilor of investigators) {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_1)} Persona: ${councilor.persona}`;
                 const res = await processBotTurn(councilor, sessionHistory, prompt, "FIELD AGENT (R1)");
                 sessionHistory.push({ id: `r1-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
            }

            // Phase 3: Depth (Iterative)
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Phase 3: Recursive Drill-Down & Verification." });
            for (const councilor of investigators) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_2)} Persona: ${councilor.persona}`;
                const res = await processBotTurn(councilor, sessionHistory, prompt, "FIELD AGENT (R2 - DEEP)");
                sessionHistory.push({ id: `r2-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
            }

            // Phase 4: Synthesis
            if (speaker) {
                setSessionStatus(SessionStatus.RESOLVING);
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_REPORT)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "FINAL DOSSIER");
                sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: res });
            }
        }

        // ==========================================
        // MODE: INQUIRY (Fast Q&A)
        // ==========================================
        else if (mode === SessionMode.INQUIRY) {
            if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "SPEAKER");
                sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
            }
            setSessionStatus(SessionStatus.DEBATING);
            const responders = initialCouncilors.slice(0, 3); 
            
            const promises = responders.map(async (councilor) => {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR)} Persona: ${councilor.persona}`;
                 const res = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                 return { councilor, res };
            });
            const results = await Promise.all(promises);
            results.forEach(({ councilor, res }) => {
                 sessionHistory.push({ id: `res-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
            });

            if (speaker) {
                setSessionStatus(SessionStatus.RESOLVING);
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_ANSWER)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "FINAL ANSWER");
                sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: res });
            }
        } 
        
        // ==========================================
        // MODE: DELIBERATION (Roundtable)
        // ==========================================
        else if (mode === SessionMode.DELIBERATION) {
            if (speaker) {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                 const res = await processBotTurn(speaker, sessionHistory, prompt, "OPENING");
                 sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
            }
            setSessionStatus(SessionStatus.DEBATING);
            for (const councilor of initialCouncilors) {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.COUNCILOR)} Persona: ${councilor.persona}`;
                 const res = await processBotTurn(councilor, sessionHistory, prompt, "DELIBERATION");
                 sessionHistory.push({ id: `res-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
            }
            if (speaker) {
                setSessionStatus(SessionStatus.RESOLVING);
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.DELIBERATION.SPEAKER_SUMMARY)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "SENSE OF COUNCIL");
                sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: res });
            }
        }

        // ==========================================
        // MODE: PROPOSAL (Legislative - Default)
        // ==========================================
        else {
            if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "SPEAKER BRIEFING");
                sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
            }

            for (const councilor of initialCouncilors) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_OPENING)} Persona: ${councilor.persona}`;
                const res = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                sessionHistory.push({ id: `opn-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
            }

            let debateRounds = 2;
            if (initialCouncilors.length > 0) {
                setSessionStatus(SessionStatus.DEBATING);

                for (let round = 1; round <= debateRounds; round++) {
                    await checkControlSignal();
                    if (moderator && round > 1) {
                        await wait(settings.ui.debateDelay);
                        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "The Moderator has recognized the floor." });
                        const modPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.MODERATOR)} Persona: ${moderator.persona}`;
                        const res = await processBotTurn(moderator, sessionHistory, modPrompt, "MODERATOR");
                        sessionHistory.push({ id: `mod-${round}`, author: moderator.name, authorType: moderator.authorType, content: res });
                    }

                    addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `PHASE 2: FLOOR DEBATE - ROUND ${round} of ${debateRounds}.` });
                    
                    const activeCouncilors = currentSessionBots.filter(b => b.role === 'councilor');

                    for (const councilor of activeCouncilors) {
                        const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_REBUTTAL)} Persona: ${councilor.persona}`;
                        const response = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                        sessionHistory.push({ id: `reb-${round}-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: response });

                        // Specialist Summoning Check
                        const summonMatch = response.match(/SUMMON AGENT:[\s]*([a-zA-Z0-9\s-]+?)(?=[.!]|$|\n)/i);
                        if (summonMatch) {
                            const requestedRole = summonMatch[1].trim();
                            const exists = currentSessionBots.find(b => b.name.includes(requestedRole));
                            if (!exists) {
                                addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `MOTION RECOGNIZED. Summoning Subject Matter Expert: ${requestedRole}...` });
                                await wait(1500);
                                const newSpecialist: BotConfig = {
                                    id: `specialist-${Date.now()}`,
                                    name: `Expert (${requestedRole})`,
                                    role: 'specialist',
                                    authorType: AuthorType.GEMINI, 
                                    model: 'gemini-2.5-flash',
                                    persona: `You are a world-class subject matter expert in ${requestedRole}. The High Council has summoned you for a specific deep-dive.`,
                                    color: "from-fuchsia-500 to-purple-600",
                                    enabled: true
                                };
                                currentSessionBots = [...currentSessionBots, newSpecialist];
                                setActiveSessionBots(currentSessionBots);
                                
                                const specPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SPECIALIST).replace('{{ROLE}}', requestedRole) + ` Persona: ${newSpecialist.persona}`;
                                const specRes = await processBotTurn(newSpecialist, sessionHistory, specPrompt, "SPECIALIST AGENT");
                                sessionHistory.push({ id: `spec-${newSpecialist.id}`, author: newSpecialist.name, authorType: newSpecialist.authorType, content: specRes });
                            }
                        }
                    }
                }
            }

            if (speaker) {
                setSessionStatus(SessionStatus.RESOLVING);
                addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 3: SPEAKER'S RULING." });
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "SPEAKER");
                sessionHistory.push({ id: 'spk-res', author: speaker.name, authorType: speaker.authorType, content: res });
                    
                const finalVotingMembers = currentSessionBots.filter(b => b.role === 'councilor');
                if (finalVotingMembers.length > 0) {
                        setSessionStatus(SessionStatus.VOTING);
                        await wait(settings.ui.debateDelay);
                        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 4: ROLL CALL VOTE." });
                        
                        const collectVotes = async () => {
                            const currentVotes: VoteData['votes'] = [];
                            let yeas = 0;
                            let nays = 0;
                            let totalConfidence = 0;

                            const parseVote = (res: string, bot: BotConfig) => {
                                 let choice: 'YEA' | 'NAY' = 'YEA'; 
                                 let reason = "Agreed with Speaker.";
                                 let confidence = 5;

                                 const cleanRes = res.replace(/\*/g, '').replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
                                 if (cleanRes.toUpperCase().includes("VOTE: NAY") || cleanRes.toUpperCase().includes("VOTE:NAY")) {
                                    choice = 'NAY';
                                    nays++;
                                 } else {
                                    yeas++;
                                 }
                                 
                                 const confMatch = cleanRes.match(/CONFIDENCE:\s*(\d+)/i);
                                 if (confMatch) confidence = Math.min(10, Math.max(0, parseInt(confMatch[1])));
                                 totalConfidence += confidence;

                                 const splitText = cleanRes.split(/REASON:/i);
                                 if (splitText.length > 1) reason = splitText[1].split('\n')[0].trim();
                                 
                                 currentVotes.push({
                                    voter: bot.name,
                                    choice,
                                    confidence,
                                    reason: reason.substring(0, 120) + (reason.length > 120 ? '...' : ''), 
                                    color: bot.color
                                });
                            };

                            const promises = finalVotingMembers.map(async (councilor) => {
                                 const votePrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_VOTE)} Persona: ${councilor.persona}`;
                                 return { councilor, res: await processBotTurn(councilor, sessionHistory, votePrompt, councilor.role) };
                            });
                            const results = await Promise.all(promises);
                            results.forEach(({councilor, res}) => {
                                 sessionHistory.push({ id: `vote-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
                                 parseVote(res, councilor);
                            });
                            
                            return { yeas, nays, votes: currentVotes, avgConfidence: totalConfidence / finalVotingMembers.length };
                        };

                        let { yeas, nays, votes, avgConfidence } = await collectVotes();
                        
                        const margin = Math.abs(yeas - nays);
                        const isClose = margin <= 1 && finalVotingMembers.length > 2;
                        const isLowConfidence = avgConfidence < 6;

                        if (isClose || isLowConfidence) {
                            setSessionStatus(SessionStatus.RECONCILING);
                            const problem = isClose ? "The vote is deadlocked." : "The Council lacks conviction.";
                            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `NOTICE: ${problem} (Confidence: ${avgConfidence.toFixed(1)}/10). Triggering Reconciliation Phase.` });
                            
                            if (moderator) {
                                 const modPrompt = `The vote on "${topic}" was inconclusive. You must FORCE a compromise. Call upon the Council to find middle ground immediately.`;
                                 const modRes = await processBotTurn(moderator, sessionHistory, modPrompt, "RECONCILIATION");
                                 sessionHistory.push({ id: 'mod-reconcile', author: moderator.name, authorType: moderator.authorType, content: modRes });
                            }
                            
                            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Final Compromise Statements..." });
                            for (const councilor of finalVotingMembers.slice(0, 2)) {
                                 const prompt = `The vote is deadlocked. Offer a compromise on "${topic}" that could pass.`;
                                 const res = await processBotTurn(councilor, sessionHistory, prompt, "COMPROMISE");
                                 sessionHistory.push({ id: `comp-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
                            }

                             addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Re-Voting on Modified Understanding..." });
                             const reVote = await collectVotes();
                             yeas = reVote.yeas;
                             nays = reVote.nays;
                             votes = reVote.votes;
                             avgConfidence = reVote.avgConfidence;
                        }

                        const result = yeas > nays ? "PASSED" : "REJECTED";
                        const voteData: VoteData = { topic: topic, yeas, nays, result, votes: votes, avgConfidence };
                        const voteMessage: Message = { id: `vote-${Date.now()}`, author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `Vote Tally Complete.`, voteData: voteData };
                        addMessage(voteMessage);
                        sessionHistory.push({ id: 'sys-vote', author: 'SYSTEM', authorType: AuthorType.SYSTEM, content: `VOTE RESULT: ${result}. Yeas: ${yeas}, Nays: ${nays}.` });

                        setSessionStatus(SessionStatus.ENACTING);
                        await wait(settings.ui.debateDelay);
                        
                        const enactmentPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_POST_VOTE).replace('{{RESULT}}', result).replace('{{YEAS}}', yeas.toString()).replace('{{NAYS}}', nays.toString()) + ` Persona: ${speaker.persona}`;
                        const res = await processBotTurn(speaker, sessionHistory, enactmentPrompt, result === 'PASSED' ? "ENACTMENT DECREE" : "TABLED NOTICE");
                        sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: res });

                        if (result === 'PASSED') {
                            saveMemory({
                                id: `mem-${Date.now()}`,
                                topic: topic,
                                content: res,
                                date: new Date().toISOString(),
                                tags: ['enactment', mode]
                            });
                            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Decree saved to Permanent Legislative Record." });
                        }
                }
            }
        }

        setSessionStatus(SessionStatus.ADJOURNED);
        await wait(2000);
        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Session Adjourned. The Council is in recess." });
    
    } catch (e: any) {
        if (e.message === "SESSION_STOPPED") {
            setSessionStatus(SessionStatus.IDLE);
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "EMERGENCY PROTOCOL: Session Aborted by User." });
        } else {
            console.error(e);
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `CRITICAL ERROR: ${e.message}` });
        }
    } finally {
        setThinkingBotIds([]);
        controlSignal.current = { stop: false, pause: false };
    }
  };

  const clearSession = () => {
      controlSignal.current.stop = true; // Stop any running loops
      setTimeout(() => {
          setMessages([{
              id: `init-${Date.now()}`,
              author: 'Council Clerk',
              authorType: AuthorType.SYSTEM,
              content: "Session Cleared. The Chamber is ready for new business."
          }]);
          setCurrentTopic(null);
          setSessionStatus(SessionStatus.IDLE);
          setThinkingBotIds([]);
          // Reset default bots
          setActiveSessionBots(settings.bots.filter(b => b.enabled));
      }, 100);
  };

  const stopSession = () => {
      controlSignal.current.stop = true;
  };

  const togglePause = () => {
      const isPaused = sessionStatus === SessionStatus.PAUSED;
      controlSignal.current.pause = !isPaused;
      if (isPaused) {
          // Resuming
          setSessionStatus(SessionStatus.DEBATING); // Or previous status, simple mapping for now
      } else {
          setSessionStatus(SessionStatus.PAUSED);
      }
  };

  const handleMotionProposed = (content: string, attachments: Attachment[] = [], mode: SessionMode) => {
    if (sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED) return;

    let fullTopic = content;
    const links = attachments.filter(a => a.type === 'link').map(a => a.data);
    if (links.length > 0) {
        fullTopic += ` \n\n[Attached Reference Links: ${links.join(', ')}]`;
    }

    setCurrentTopic(fullTopic);
    setSessionMode(mode);
    const humanMessage: Message = {
        id: `msg-${Date.now()}`,
        author: 'Petitioner',
        authorType: AuthorType.HUMAN,
        content: content,
        attachments: attachments
    };
    
    const newHistory = [...messages, humanMessage];
    setMessages(newHistory);
    runCouncilSession(fullTopic, mode, newHistory);
  };

  const getStatusText = () => {
    switch(sessionStatus) {
        case SessionStatus.OPENING: return "Briefing & Opening Statements...";
        case SessionStatus.DEBATING: return "Floor Debate in Progress...";
        case SessionStatus.RECONCILING: return "Compromise & Reconciliation...";
        case SessionStatus.RESOLVING: return "Speaker deliberation...";
        case SessionStatus.VOTING: return "Roll Call Vote...";
        case SessionStatus.ENACTING: return "Final Enactment...";
        case SessionStatus.ADJOURNED: return "Session Adjourned.";
        case SessionStatus.PAUSED: return "Session Paused.";
        default: return "Chamber in Recess";
    }
  };

  return (
    <div className={`h-[100dvh] w-screen flex antialiased font-sans bg-slate-950 ${settings.ui.fontSize === 'large' ? 'text-lg' : settings.ui.fontSize === 'small' ? 'text-sm' : 'text-base'}`}>
      
      {isLiveSessionOpen && <LiveSession onClose={() => setIsLiveSessionOpen(false)} />}

      <main className="flex-1 h-full flex flex-col relative">
        <div className="absolute top-2 left-2 md:left-4 z-50">
             <button 
                onClick={() => setIsLiveSessionOpen(true)}
                className="flex items-center gap-2 bg-slate-900 border border-amber-900/50 hover:border-amber-500 text-amber-500 px-3 py-1.5 rounded-full shadow-xl transition-all hover:scale-105"
             >
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Live Audience</span>
             </button>
        </div>

        <ChatWindow
            messages={messages}
            activeBots={sessionStatus === SessionStatus.IDLE || sessionStatus === SessionStatus.ADJOURNED ? settings.bots.filter(b => b.enabled) : activeSessionBots}
            thinkingBotIds={thinkingBotIds}
            onSendMessage={handleMotionProposed}
            statusText={getStatusText()}
            currentTopic={currentTopic}
            sessionMode={sessionMode}
            sessionStatus={sessionStatus}
            onClearSession={clearSession}
            onStopSession={stopSession}
            onPauseSession={togglePause}
        />
      </main>
      <SettingsPanel
        settings={settings}
        onSettingsChange={setSettings}
        isOpen={isSettingsOpen}
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
      />
    </div>
  );
};

export default App;
