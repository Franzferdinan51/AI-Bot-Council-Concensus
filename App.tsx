
import React, { useState, useCallback, useEffect } from 'react';
import { Message, Settings, AuthorType, SessionStatus, BotConfig, VoteData } from './types';
import { getBotResponse } from './services/aiService';
import { COUNCIL_SYSTEM_INSTRUCTION, DEFAULT_SETTINGS } from './constants';
import SettingsPanel from './components/SettingsPanel';
import ChatWindow from './components/ChatWindow';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
      {
          id: 'init-1',
          author: 'Council Clerk',
          authorType: AuthorType.SYSTEM,
          content: "All rise. The High AI Council is now in session. Configure your Council in settings or propose a motion."
      }
  ]);
  
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [thinkingBotId, setThinkingBotId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [activeSessionBots, setActiveSessionBots] = useState<BotConfig[]>([]);

  // --- AUDIO HANDLING (TTS) ---
  const speakText = useCallback((text: string, bot: BotConfig | null) => {
    if (!settings.audio.enabled || !window.speechSynthesis) return;
    
    // Stop current speech
    window.speechSynthesis.cancel();
    
    // Clean text (remove URLs, formatting chars for smoother speech)
    const cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/[*_#]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.audio.speechRate;
    utterance.volume = settings.audio.voiceVolume;

    // Attempt to pick a voice based on persona/role (simple hashing or assignment)
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0 && bot) {
        // Simple deterministic assignment based on bot ID length/chars
        let voiceIndex = 0;
        if (bot.role === 'speaker') voiceIndex = 0; // Usually a system default
        else voiceIndex = (bot.id.charCodeAt(0) + bot.id.length) % voices.length;
        
        utterance.voice = voices[voiceIndex] || voices[0];
    }
    
    window.speechSynthesis.speak(utterance);
  }, [settings.audio]);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() + Math.random() }]);
  }, []);

  // Delay helper for pacing the debate
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runCouncilSession = async (topic: string, initialHistory: Message[]) => {
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
    addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 1: SESSION OPENING & BRIEFING." });

    const injectTopic = (template: string) => template.replace(/{{TOPIC}}/g, topic);

    // --- PHASE 1-A: SPEAKER OPENING STATEMENT ---
    if (speaker) {
        setThinkingBotId(speaker.id);
        await wait(settings.ui.debateDelay);
        try {
            const systemPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SPEAKER_OPENING)} Persona: ${speaker.persona}`;
            const response = await getBotResponse(speaker, sessionHistory, systemPrompt, settings);
            
            const msg: Message = { 
                id: 'temp', author: speaker.name, authorType: speaker.authorType, 
                content: response, color: speaker.color, roleLabel: "SPEAKER BRIEFING" 
            };
            addMessage(msg);
            sessionHistory.push(msg);
            speakText(response, speaker);
        } catch (e: any) {
             console.error(e);
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Speaker failed to open session. (${e.message})` });
        }
    }

    // --- PHASE 1-B: COMMITTEE STATEMENTS ---
    for (const councilor of initialCouncilors) {
        setThinkingBotId(councilor.id);
        await wait(settings.ui.debateDelay);
        try {
            const systemPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.COUNCILOR_OPENING)} Persona: ${councilor.persona}`;
            const response = await getBotResponse(councilor, sessionHistory, systemPrompt, settings);
            
            const msg: Message = { 
                id: 'temp', author: councilor.name, authorType: councilor.authorType, 
                content: response, color: councilor.color, roleLabel: councilor.role 
            };
            addMessage(msg);
            sessionHistory.push(msg);
            speakText(response, councilor);
        } catch (e: any) {
             console.error(e);
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `${councilor.name} is absent. (${e.message})` });
        }
    }

    // --- PHASE 2: DEBATE & DYNAMIC SPECIALISTS ---
    if (initialCouncilors.length > 0) {
        setSessionStatus(SessionStatus.DEBATING);
        const DEBATE_ROUNDS = 2; 

        for (let round = 1; round <= DEBATE_ROUNDS; round++) {
            
            if (moderator && round > 1) {
                await wait(settings.ui.debateDelay);
                addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "The Moderator has recognized the floor." });
                setThinkingBotId(moderator.id);
                try {
                     const modPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.MODERATOR)} Persona: ${moderator.persona}`;
                     const response = await getBotResponse(moderator, sessionHistory, modPrompt, settings);
                     const msg: Message = { 
                        id: 'temp', author: moderator.name, authorType: moderator.authorType, 
                        content: response, color: moderator.color, roleLabel: "MODERATOR" 
                    };
                    addMessage(msg);
                    sessionHistory.push(msg);
                    speakText(response, moderator);
                } catch (e: any) {
                    addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Moderator absent. (${e.message})` });
                }
            }

            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `PHASE 2: FLOOR DEBATE - ROUND ${round} of ${DEBATE_ROUNDS}.` });
            
            const activeCouncilors = currentSessionBots.filter(b => b.role === 'councilor');

            for (const councilor of activeCouncilors) {
                setThinkingBotId(councilor.id);
                await wait(settings.ui.debateDelay);
                try {
                    const systemPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.COUNCILOR_REBUTTAL)} Persona: ${councilor.persona}`;
                    const response = await getBotResponse(councilor, sessionHistory, systemPrompt, settings);
                    
                    const msg: Message = { 
                        id: 'temp', author: councilor.name, authorType: councilor.authorType, 
                        content: response, color: councilor.color, roleLabel: councilor.role 
                    };
                    addMessage(msg);
                    sessionHistory.push(msg);
                    speakText(response, councilor);

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

                            setThinkingBotId(newSpecialist.id);
                            const specSystemPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SPECIALIST).replace('{{ROLE}}', requestedRole) + ` Persona: ${newSpecialist.persona}`;
                            const specResponse = await getBotResponse(newSpecialist, sessionHistory, specSystemPrompt, settings);

                            const specMsg: Message = { 
                                id: 'temp', author: newSpecialist.name, authorType: newSpecialist.authorType, 
                                content: specResponse, color: newSpecialist.color, roleLabel: "SPECIALIST AGENT" 
                            };
                            addMessage(specMsg);
                            sessionHistory.push(specMsg);
                            speakText(specResponse, newSpecialist);
                        }
                    }

                } catch (e: any) { console.error(e); addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `${councilor.name} yielded the floor.` }); }
            }
        }
    }

    // --- PHASE 3: RESOLUTION ---
    if (speaker) {
        setSessionStatus(SessionStatus.RESOLVING);
        await wait(settings.ui.debateDelay);
        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 3: SPEAKER'S RULING." });
        setThinkingBotId(speaker.id);
        
        try {
            const systemPrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SPEAKER)} Persona: ${speaker.persona}`;
            const response = await getBotResponse(speaker, sessionHistory, systemPrompt, settings);
            
            const msg: Message = { 
                id: 'temp', author: speaker.name, authorType: speaker.authorType, 
                content: response, color: speaker.color, roleLabel: "SPEAKER" 
            };
            addMessage(msg);
            sessionHistory.push(msg);
            speakText(response, speaker);
            
            // --- PHASE 4: VOTING ---
            const finalVotingMembers = currentSessionBots.filter(b => b.role === 'councilor');
            
            if (finalVotingMembers.length > 0) {
                 setSessionStatus(SessionStatus.VOTING);
                 await wait(settings.ui.debateDelay);
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 4: ROLL CALL VOTE." });
                 
                 const currentVotes: VoteData['votes'] = [];
                 let yeas = 0;
                 let nays = 0;

                 for (const councilor of finalVotingMembers) {
                     setThinkingBotId(councilor.id);
                     await wait(1000); // Quick voting cadence
                     const votePrompt = `${injectTopic(COUNCIL_SYSTEM_INSTRUCTION.COUNCILOR_VOTE)} Persona: ${councilor.persona}`;
                     try {
                        const voteRes = await getBotResponse(councilor, sessionHistory, votePrompt, settings);
                        
                        let choice: 'YEA' | 'NAY' = 'YEA'; 
                        let reason = "Agreed with Speaker.";

                        const cleanRes = voteRes.replace(/\*/g, '').trim();
                        if (cleanRes.toUpperCase().includes("VOTE: NAY") || cleanRes.toUpperCase().includes("VOTE:NAY")) {
                            choice = 'NAY';
                            nays++;
                        } else {
                            yeas++;
                        }
                        
                        const splitText = cleanRes.split(/VOTE: ?(YEA|NAY)/i);
                        if (splitText.length > 1) reason = splitText[splitText.length - 1].replace(/^[:\s-]+/, '').trim();
                        
                        currentVotes.push({
                            voter: councilor.name,
                            choice,
                            reason: reason.substring(0, 120) + (reason.length > 120 ? '...' : ''), 
                            color: councilor.color
                        });

                     } catch (e: any) { }
                 }

                 const result = yeas > nays ? "PASSED" : "REJECTED";
                 
                 const voteData: VoteData = {
                     topic: topic,
                     yeas,
                     nays,
                     result,
                     votes: currentVotes
                 };

                 const voteMessage: Message = { 
                     id: `vote-${Date.now()}`,
                     author: 'Council Clerk', 
                     authorType: AuthorType.SYSTEM, 
                     content: `Vote Tally Complete.`, 
                     voteData: voteData 
                };
                
                addMessage(voteMessage);
                sessionHistory.push({
                    id: 'sys-vote',
                    author: 'SYSTEM',
                    authorType: AuthorType.SYSTEM,
                    content: `VOTE RESULT: ${result}. Yeas: ${yeas}, Nays: ${nays}.`
                });

                 // --- PHASE 5: ENACTMENT ---
                 setSessionStatus(SessionStatus.ENACTING);
                 await wait(settings.ui.debateDelay);
                 setThinkingBotId(speaker.id);
                 
                 const enactmentPrompt = injectTopic(COUNCIL_SYSTEM_INSTRUCTION.SPEAKER_POST_VOTE)
                    .replace('{{RESULT}}', result)
                    .replace('{{YEAS}}', yeas.toString())
                    .replace('{{NAYS}}', nays.toString())
                    + ` Persona: ${speaker.persona}`;
                 
                 const enactmentResponse = await getBotResponse(speaker, sessionHistory, enactmentPrompt, settings);

                 addMessage({ 
                    author: speaker.name, 
                    authorType: speaker.authorType, 
                    content: enactmentResponse, 
                    color: speaker.color, 
                    roleLabel: result === 'PASSED' ? "ENACTMENT DECREE" : "TABLED NOTICE"
                });
                speakText(enactmentResponse, speaker);
            }

        } catch (e: any) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Speaker Error: ${e.message}` });
        }
    }
    
    // --- ADJOURNMENT ---
    setSessionStatus(SessionStatus.ADJOURNED);
    await wait(2000);
    addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "Session Adjourned. The Council is in recess." });
    setThinkingBotId(null);
    setCurrentTopic(null);
  };

  const handleMotionProposed = (content: string) => {
    if (sessionStatus !== SessionStatus.IDLE && sessionStatus !== SessionStatus.ADJOURNED) return;

    setCurrentTopic(content);
    const humanMessage: Message = {
        id: 'temp',
        author: 'Petitioner',
        authorType: AuthorType.HUMAN,
        content: content
    };
    
    const newHistory = [...messages, humanMessage];
    setMessages(newHistory);
    runCouncilSession(content, newHistory);
  };

  const getStatusText = () => {
    switch(sessionStatus) {
        case SessionStatus.OPENING: return "Briefing & Opening Statements...";
        case SessionStatus.DEBATING: return "Floor Debate in Progress...";
        case SessionStatus.RESOLVING: return "Speaker deliberation...";
        case SessionStatus.VOTING: return "Roll Call Vote...";
        case SessionStatus.ENACTING: return "Final Enactment...";
        case SessionStatus.ADJOURNED: return "Session Adjourned.";
        default: return "Chamber in Recess";
    }
  };

  return (
    <div className={`h-screen w-screen flex antialiased font-sans bg-slate-950 ${settings.ui.fontSize === 'large' ? 'text-lg' : settings.ui.fontSize === 'small' ? 'text-sm' : 'text-base'}`}>
      <main className="flex-1 h-full flex flex-col relative">
        <ChatWindow
            messages={messages}
            activeBots={sessionStatus === SessionStatus.IDLE || sessionStatus === SessionStatus.ADJOURNED ? settings.bots.filter(b => b.enabled) : activeSessionBots}
            thinkingBotId={thinkingBotId}
            onSendMessage={handleMotionProposed}
            statusText={getStatusText()}
            currentTopic={currentTopic}
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
