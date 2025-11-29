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
  const [debateHeat, setDebateHeat] = useState<number>(0); 

  // Private Counsel State
  const [privateCouncilorId, setPrivateCouncilorId] = useState<string | null>(null);
  const [privateMessages, setPrivateMessages] = useState<Record<string, Message[]>>({});
  const [privateInput, setPrivateInput] = useState("");

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
    setMessages(prev => {
        const next = [...prev, newMessage];
        const recent = next.slice(-5).map(m => m.content.toLowerCase()).join(' ');
        let heat = 0;
        if (recent.includes('agree') || recent.includes('concur') || recent.includes('support')) heat += 0.2;
        if (recent.includes('disagree') || recent.includes('objection') || recent.includes('challenge')) heat -= 0.3;
        if (recent.includes('compromise') || recent.includes('consensus')) heat += 0.4;
        if (recent.includes('reject') || recent.includes('veto')) heat -= 0.4;
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

  const runBatchWithConcurrency = async <T, R>(
    items: T[], 
    fn: (item: T) => Promise<R>, 
    maxConcurrency: number
  ): Promise<R[]> => {
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
          const cleanSpeech = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').replace(/<vote>[\s\S]*?<\/vote>/g, '').trim();
          
          if (!cleanSpeech.includes('[PASS]') && cleanSpeech.length > 5) {
             speakText(cleanSpeech, bot);
          }
          await wait(1000);
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
    setDebateHeat(0);
    
    const precedents = searchMemories(topic);
    const docSnippets = searchDocuments(settings.knowledge.documents, topic);
    const contextBlock = [
        precedents.length > 0 ? `\n\n[RELEVANT PRECEDENTS]:\n${precedents.map(p => `- ${p.topic}: ${p.content.substring(0, 100)}...`).join('\n')}` : '',
        docSnippets.length > 0 ? `\n\n[KNOWLEDGE BASE]:\n${docSnippets.join('\n')}` : ''
    ].join('');

    const customDirective = settings.ui.customDirective || "";
    const atmospherePrompt = "TONE: Professional, Objective, Legislative. Avoid theatrical or sci-fi language.";

    const injectTopic = (template: string) => {
        let text = template.replace(/{{TOPIC}}/g, topic);
        text = atmospherePrompt + "\n\n" + (customDirective ? customDirective + "\n\n" : "") + text;
        return text + contextBlock;
    };

    const maxConcurrency = settings.cost.maxConcurrentRequests || 2;

    try {
        if (mode === SessionMode.SWARM) {
             if (speaker) {
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PROTOCOL: HIVE DECOMPOSITION. Speaker is analyzing task vectors..." });
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_DECOMPOSITION)} Persona: ${speaker.persona}`;
                 const res = await processBotTurn(speaker, sessionHistory, prompt, "HIVE OVERSEER");
                 sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
                 
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
                 
                 if (swarmAgents.length === 0) {
                     swarmAgents.push(
                         { id: 'sw1', name: 'Swarm: Alpha', role: 'swarm_agent', authorType: AuthorType.GEMINI, model: 'gemini-2.5-flash', persona: 'Analyst', color: 'from-orange-500 to-red-600', enabled: true },
                         { id: 'sw2', name: 'Swarm: Beta', role: 'swarm_agent', authorType: AuthorType.GEMINI, model: 'gemini-2.5-flash', persona: 'Analyst', color: 'from-orange-500 to-red-600', enabled: true }
                     );
                 }

                 setActiveSessionBots([...currentSessionBots, ...swarmAgents]);
                 await wait(1000);
                 
                 setSessionStatus(SessionStatus.DEBATING);
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `DEPLOYING ${swarmAgents.length} SWARM AGENTS.` });

                 const results = await runBatchWithConcurrency(swarmAgents, async (agent: BotConfig) => {
                     const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SWARM_AGENT).replace('{{ROLE}}', agent.name).replace('{{TASK}}', 'Execute your assigned vector from the Overseer.')}`;
                     const res = await processBotTurn(agent, sessionHistory, prompt, agent.name.toUpperCase());
                     return { agent, res };
                 }, maxConcurrency);

                 results.forEach(({ agent, res }) => {
                     sessionHistory.push({ id: `swarm-${agent.id}`, author: agent.name, authorType: agent.authorType, content: res });
                 });

                 setSessionStatus(SessionStatus.RESOLVING);
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "AGGREGATING SWARM DATA." });
                 const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SWARM.SPEAKER_AGGREGATION)} Persona: ${speaker.persona}`;
                 const finalRes = await processBotTurn(speaker, sessionHistory, finalPrompt, "HIVE CONSENSUS");
                 sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: finalRes });
             }
        }
        else if (mode === SessionMode.RESEARCH) {
            if (speaker) {
                addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PROTOCOL: DEEP RESEARCH. Phase 1: Planning." });
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_PLANNING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "LEAD INVESTIGATOR");
                sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
            }

            setSessionStatus(SessionStatus.DEBATING);
            const investigators = initialCouncilors.slice(0, 3);
            
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Phase 2: Broad Spectrum Collection." });
            await runBatchWithConcurrency(investigators, async (councilor: BotConfig) => {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_1)} Persona: ${councilor.persona}`;
                 const res = await processBotTurn(councilor, sessionHistory, prompt, "FIELD AGENT (R1)");
                 sessionHistory.push({ id: `r1-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
                 return res;
            }, maxConcurrency);

            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Phase 3: Recursive Drill-Down & Verification." });
             await runBatchWithConcurrency(investigators, async (councilor: BotConfig) => {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.COUNCILOR_ROUND_2)} Persona: ${councilor.persona}`;
                const res = await processBotTurn(councilor, sessionHistory, prompt, "FIELD AGENT (R2 - DEEP)");
                sessionHistory.push({ id: `r2-${councilor.id}`, author: councilor.name, authorType: councilor.authorType, content: res });
                return res;
            }, maxConcurrency);

            if (speaker) {
                setSessionStatus(SessionStatus.RESOLVING);
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.RESEARCH.SPEAKER_REPORT)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "FINAL DOSSIER");
                sessionHistory.push({ id: 'final', author: speaker.name, authorType: speaker.authorType, content: res });
            }
        }
        else if (mode === SessionMode.INQUIRY) {
            if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "SPEAKER");
                sessionHistory.push({ id: 'spk', author: speaker.name, authorType: speaker.authorType, content: res });
            }
            setSessionStatus(SessionStatus.DEBATING);
            const responders = initialCouncilors.slice(0, 3); 
            
            const results = await runBatchWithConcurrency(responders, async (councilor: BotConfig) => {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.INQUIRY.COUNCILOR)} Persona: ${councilor.persona}`;
                 const res = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                 return { councilor, res };
            }, maxConcurrency);

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
        else {
            if (speaker) {
                const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
                const res = await processBotTurn(speaker, sessionHistory, prompt, "OPENING BRIEF");
                sessionHistory.push({ id: 'spk-open', author: speaker.name, authorType: speaker.authorType, content: res });
            }
            
            setSessionStatus(SessionStatus.DEBATING);

            let debateQueue = [...initialCouncilors];
            let rounds = 0;
            const MAX_DEBATE_ROUNDS = 4; 

            while (debateQueue.length > 0 && rounds < MAX_DEBATE_ROUNDS * initialCouncilors.length) {
                const councilor = debateQueue.shift();
                if (!councilor) break;

                if (moderator && rounds > 0 && rounds % 3 === 0) {
                     const modPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.MODERATOR)} Persona: ${moderator.persona}`;
                     await processBotTurn(moderator, sessionHistory, modPrompt, "MODERATOR");
                }

                let prompt = rounds < initialCouncilors.length 
                    ? `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_OPENING)} Persona: ${councilor.persona}`
                    : `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_REBUTTAL)} Persona: ${councilor.persona}`;

                const res = await processBotTurn(councilor, sessionHistory, prompt, councilor.role);
                sessionHistory.push({ id: `deb-${rounds}`, author: councilor.name, authorType: councilor.authorType, content: res });
                rounds++;

                if (res.includes('[PASS]')) {
                    continue; 
                }

                const challengeMatch = res.match(/\[CHALLENGE:\s*([^\]]+)\]/i);
                if (challengeMatch) {
                    const challengedName = challengeMatch[1].toLowerCase();
                    const challengedBot = currentSessionBots.find(b => b.name.toLowerCase().includes(challengedName) || b.id.includes(challengedName));
                    if (challengedBot) {
                        debateQueue = debateQueue.filter(b => b.id !== challengedBot.id); 
                        debateQueue.unshift(challengedBot); 
                        
                        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `POINT OF ORDER: ${councilor.name} has challenged ${challengedBot.name}. Rebuttal granted.` });
                    }
                }
                
                const summonMatch = res.match(/\[SUMMON AGENT:\s*([^\]]+)\]/i);
                if (summonMatch) {
                    const role = summonMatch[1];
                    const specialist = {
                         id: `spec-${Date.now()}`,
                         name: `Specialist (${role})`,
                         role: 'specialist',
                         authorType: AuthorType.GEMINI,
                         model: 'gemini-2.5-flash',
                         persona: `You are a top-tier expert in ${role}. Provide facts only.`,
                         color: "from-purple-500 to-indigo-600",
                         enabled: true
                    } as BotConfig;
                    
                    setActiveSessionBots(prev => [...prev, specialist]);
                    addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `SUMMONING SPECIALIST: ${role}` });
                    await wait(1000);
                    
                    const specPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SPECIALIST).replace('{{ROLE}}', role)}`;
                    const specRes = await processBotTurn(specialist, sessionHistory, specPrompt, "SPECIALIST");
                    sessionHistory.push({ id: `spec-${rounds}`, author: specialist.name, authorType: specialist.authorType, content: specRes });
                }
            }

            setSessionStatus(SessionStatus.VOTING);
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "DEBATE CLOSED. PROCEEDING TO ROLL CALL VOTE." });
            
            const votes: VoteData['votes'] = [];
            let yeas = 0;
            let nays = 0;
            let totalConfidence = 0;

            await runBatchWithConcurrency(initialCouncilors, async (councilor: BotConfig) => {
                 const prompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.COUNCILOR_VOTE)} Persona: ${councilor.persona}`;
                 const res = await processBotTurn(councilor, sessionHistory, prompt, "VOTING");
                 
                 const voteMatch = res.match(/<vote>(.*?)<\/vote>/i);
                 const reasonMatch = res.match(/<reason>([\s\S]*?)<\/reason>/i);
                 const confMatch = res.match(/<confidence>(.*?)<\/confidence>/i);

                 const choice = voteMatch ? (voteMatch[1].toUpperCase().includes('YEA') ? 'YEA' : 'NAY') : 'NAY';
                 const reason = reasonMatch ? reasonMatch[1].trim() : "No reason provided.";
                 const confidence = confMatch ? parseInt(confMatch[1]) : 5;

                 votes.push({
                     voter: councilor.name,
                     choice,
                     confidence,
                     reason,
                     color: councilor.color
                 });

                 if (choice === 'YEA') yeas++; else nays++;
                 totalConfidence += confidence;
                 return res;
            }, maxConcurrency);

            const avgConfidence = votes.length > 0 ? totalConfidence / votes.length : 0;
            let result: VoteData['result'] = 'REJECTED';
            
            if (yeas > nays) {
                if (avgConfidence < 6 || (yeas - nays) <= 1) {
                    result = 'RECONCILIATION NEEDED';
                } else {
                    result = 'PASSED';
                }
            }

            const voteData: VoteData = {
                topic,
                yeas,
                nays,
                result,
                avgConfidence,
                votes
            };

            addMessage({ 
                author: 'Council Clerk', 
                authorType: AuthorType.SYSTEM, 
                content: "VOTE TALLY COMPLETE.", 
                voteData 
            });

            if (speaker) {
                setSessionStatus(result === 'PASSED' ? SessionStatus.ENACTING : (result === 'RECONCILIATION NEEDED' ? SessionStatus.RECONCILING : SessionStatus.RESOLVING));
                
                const finalPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER_POST_VOTE)} 
                The vote result was: ${result}. Yeas: ${yeas}, Nays: ${nays}, Avg Confidence: ${avgConfidence.toFixed(1)}.
                Persona: ${speaker.persona}`;
                
                const res = await processBotTurn(speaker, sessionHistory, finalPrompt, "FINAL DECREE");
                
                if (result === 'PASSED') {
                    saveMemory({
                        id: `mem-${Date.now()}`,
                        topic: topic,
                        content: res,
                        date: new Date().toISOString(),
                        tags: [mode]
                    });
                }
            }
        }

    } catch (e: any) {
        if (e.message !== "SESSION_STOPPED") {
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `SESSION ERROR: ${e.message}` });
        } else {
            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "SESSION HALTED BY USER." });
        }
    } finally {
        setSessionStatus(SessionStatus.ADJOURNED);
        setActiveSessionBots([]);
    }
  };

  const handleSendMessage = (content: string, attachments: Attachment[], mode: SessionMode) => {
    if (privateCouncilorId) {
        handlePrivateSend(content);
        return;
    }

    setCurrentTopic(content);
    setSessionMode(mode);
    setSessionStatus(SessionStatus.OPENING);
    
    let fullContent = content;
    if (attachments.length > 0) {
        const links = attachments.filter(a => a.type === 'link').map(a => a.data).join(', ');
        if (links) fullContent += `\n[ATTACHED RESOURCES: ${links}]`;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      author: 'Petitioner',
      authorType: AuthorType.HUMAN,
      content: fullContent,
      attachments
    };
    
    setMessages(prev => [...prev, newMessage]);
    runCouncilSession(fullContent, mode, [...messages, newMessage]);
  };

  const clearSession = () => {
      controlSignal.current.stop = true;
      setMessages([{
          id: `init-${Date.now()}`,
          author: 'Council Clerk',
          authorType: AuthorType.SYSTEM,
          content: "Council Reset. Ready for new agenda."
      }]);
      setSessionStatus(SessionStatus.IDLE);
      setCurrentTopic(null);
      setThinkingBotIds([]);
      setActiveSessionBots([]);
  };
  
  const openPrivateCounsel = (botId: string) => {
      setPrivateCouncilorId(botId);
      if (!privateMessages[botId]) {
          const bot = settings.bots.find(b => b.id === botId);
          if (bot) {
              setPrivateMessages(prev => ({
                  ...prev,
                  [botId]: [{
                      id: 'priv-init',
                      author: bot.name,
                      authorType: bot.authorType,
                      content: `Direct consultation channel active. I am ready to provide specific insight on the current agenda.`
                  }]
              }));
          }
      }
  };

  const closePrivateCounsel = () => {
      setPrivateCouncilorId(null);
  };

  const handlePrivateSend = async (text: string) => {
      if (!privateCouncilorId) return;
      const bot = settings.bots.find(b => b.id === privateCouncilorId);
      if (!bot) return;

      const userMsg: Message = { id: Date.now().toString(), author: 'You', authorType: AuthorType.HUMAN, content: text };
      
      setPrivateMessages(prev => ({
          ...prev,
          [privateCouncilorId]: [...(prev[privateCouncilorId] || []), userMsg]
      }));
      setPrivateInput("");

      const history = [...(privateMessages[privateCouncilorId] || []), userMsg];
      const prompt = `${COUNCIL_SYSTEM_INSTRUCTION.PRIVATE_WHISPER} Persona: ${bot.persona}`;
      
      try {
          const res = await getBotResponse(bot, history, prompt, settings);
          const botMsg: Message = { id: Date.now().toString(), author: bot.name, authorType: bot.authorType, content: res };
           setPrivateMessages(prev => ({
              ...prev,
              [privateCouncilorId]: [...(prev[privateCouncilorId] || []), botMsg]
          }));
      } catch (e) {
          console.error(e);
      }
  };

  const activePrivateHistory = privateCouncilorId ? privateMessages[privateCouncilorId] : [];
  const activePrivateBot = settings.bots.find(b => b.id === privateCouncilorId);

  return (
    <div className="bg-slate-950 h-[100dvh] w-full flex flex-col font-sans text-slate-200 overflow-hidden relative pt-[env(safe-area-inset-top)]">
      
      <ChatWindow 
        messages={messages} 
        activeBots={activeSessionBots.length > 0 ? activeSessionBots : settings.bots.filter(b => b.enabled)}
        thinkingBotIds={thinkingBotIds}
        onSendMessage={handleSendMessage}
        statusText={sessionStatus !== SessionStatus.IDLE ? sessionStatus.toUpperCase().replace('_', ' ') : "AWAITING MOTION"}
        currentTopic={currentTopic}
        sessionMode={sessionMode}
        sessionStatus={sessionStatus}
        debateHeat={debateHeat}
        onClearSession={clearSession}
        onStopSession={() => controlSignal.current.stop = true}
        onPauseSession={() => { 
            controlSignal.current.pause = !controlSignal.current.pause;
            setSessionStatus(prev => prev === SessionStatus.PAUSED ? SessionStatus.DEBATING : SessionStatus.PAUSED); 
        }}
        onOpenLiveSession={() => setIsLiveSessionOpen(true)}
        onCouncilorClick={openPrivateCounsel}
      />

      <SettingsPanel 
        settings={settings} 
        onSettingsChange={setSettings} 
        isOpen={isSettingsOpen} 
        onToggle={() => setIsSettingsOpen(!isSettingsOpen)} 
      />
      
      {isLiveSessionOpen && (
          <LiveSession onClose={() => setIsLiveSessionOpen(false)} />
      )}

      {privateCouncilorId && activePrivateBot && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-end animate-fade-in">
              <div className="w-full md:w-96 h-full bg-slate-950 border-l border-amber-900/50 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                  <div className={`p-4 border-b border-slate-800 bg-gradient-to-r ${activePrivateBot.color} bg-opacity-10 flex justify-between items-center`}>
                      <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-white animate-pulse`}></div>
                          <div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Direct Consultation</h3>
                              <p className="text-xs text-slate-300">with {activePrivateBot.name}</p>
                          </div>
                      </div>
                      <button onClick={closePrivateCounsel} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {activePrivateHistory.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.authorType === AuthorType.HUMAN ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded text-sm ${msg.authorType === AuthorType.HUMAN ? 'bg-slate-800 text-slate-200' : 'bg-slate-900 border border-slate-700 text-amber-100 italic'}`}>
                                  {msg.content}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="p-3 border-t border-slate-800 bg-slate-900">
                      <form 
                        onSubmit={(e) => { e.preventDefault(); if(privateInput.trim()) handlePrivateSend(privateInput); }}
                        className="flex gap-2"
                      >
                          <input 
                            autoFocus
                            value={privateInput}
                            onChange={(e) => setPrivateInput(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                            placeholder="Type consultation query..."
                          />
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