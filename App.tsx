
import React, { useState, useCallback } from 'react';
import { Message, Settings, AuthorType, SessionStatus, BotConfig, VoteData } from './types';
import { getBotResponse } from './services/aiService';
import { COUNCIL_SYSTEM_INSTRUCTION, DEFAULT_BOTS } from './constants';
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
  
  const [settings, setSettings] = useState<Settings>({
    bots: DEFAULT_BOTS,
    mcp: {
        enabled: false,
        dockerEndpoint: "",
        customTools: []
    },
    globalOpenRouterKey: ""
  });

  const [thinkingBotId, setThinkingBotId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  
  // Track bots involved in the current active session (including dynamically summoned ones)
  const [activeSessionBots, setActiveSessionBots] = useState<BotConfig[]>([]);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() + Math.random() }]);
  }, []);

  const runCouncilSession = async (topic: string, initialHistory: Message[]) => {
    let sessionHistory = [...initialHistory];
    
    // Initialize session bots from settings
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

    // --- PHASE 1: OPENING ---
    setSessionStatus(SessionStatus.OPENING);
    addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 1: COMMITTEE STATEMENTS." });

    for (const councilor of initialCouncilors) {
        setThinkingBotId(councilor.id);
        try {
            const systemPrompt = `${COUNCIL_SYSTEM_INSTRUCTION.COUNCILOR_OPENING} Persona: ${councilor.persona}`;
            const response = await getBotResponse(councilor, sessionHistory, systemPrompt, settings.globalOpenRouterKey, settings.mcp);
            
            const msg: Message = { 
                id: 'temp', author: councilor.name, authorType: councilor.authorType, 
                content: response, color: councilor.color, roleLabel: councilor.role 
            };
            addMessage(msg);
            sessionHistory.push(msg);
        } catch (e: any) {
             console.error(e);
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `${councilor.name} is absent. (${e.message})` });
        }
    }

    // --- PHASE 2: DEBATE & DYNAMIC SPECIALISTS ---
    if (initialCouncilors.length > 0) {
        setSessionStatus(SessionStatus.DEBATING);
        const DEBATE_ROUNDS = 2; // Increased to 2 rounds for back-and-forth

        for (let round = 1; round <= DEBATE_ROUNDS; round++) {
            
            // --- MODERATOR INTERJECTION ---
            // The moderator speaks before round 2 to guide the debate
            if (moderator && round > 1) {
                addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "The Moderator has recognized the floor." });
                setThinkingBotId(moderator.id);
                try {
                     const modPrompt = `${COUNCIL_SYSTEM_INSTRUCTION.MODERATOR} Persona: ${moderator.persona}`;
                     const response = await getBotResponse(moderator, sessionHistory, modPrompt, settings.globalOpenRouterKey, settings.mcp);
                     const msg: Message = { 
                        id: 'temp', author: moderator.name, authorType: moderator.authorType, 
                        content: response, color: moderator.color, roleLabel: "MODERATOR" 
                    };
                    addMessage(msg);
                    sessionHistory.push(msg);
                } catch (e: any) {
                    addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Moderator absent. (${e.message})` });
                }
            }

            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `PHASE 2: FLOOR DEBATE - ROUND ${round} of ${DEBATE_ROUNDS}.` });
            
            // Re-fetch councilors from the local session list (in case any logic changes, though usually static)
            const activeCouncilors = currentSessionBots.filter(b => b.role === 'councilor');

            for (const councilor of activeCouncilors) {
                setThinkingBotId(councilor.id);
                try {
                    const systemPrompt = `${COUNCIL_SYSTEM_INSTRUCTION.COUNCILOR_REBUTTAL} Persona: ${councilor.persona}`;
                    const response = await getBotResponse(councilor, sessionHistory, systemPrompt, settings.globalOpenRouterKey, settings.mcp);
                    
                    const msg: Message = { 
                        id: 'temp', author: councilor.name, authorType: councilor.authorType, 
                        content: response, color: councilor.color, roleLabel: councilor.role 
                    };
                    addMessage(msg);
                    sessionHistory.push(msg);

                    // --- CHECK FOR SUMMONING ---
                    // Regex to find "SUMMON AGENT: <Role>"
                    const summonMatch = response.match(/SUMMON AGENT:[\s]*([a-zA-Z0-9\s-]+?)(?=[.!]|$|\n)/i);
                    
                    if (summonMatch) {
                        const requestedRole = summonMatch[1].trim();
                        // Check if we already have this specialist to avoid duplicates
                        const exists = currentSessionBots.find(b => b.name.includes(requestedRole));
                        
                        if (!exists) {
                            addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: `MOTION RECOGNIZED. Summoning Subject Matter Expert: ${requestedRole}...` });
                            
                            // Create Dynamic Bot
                            const newSpecialist: BotConfig = {
                                id: `specialist-${Date.now()}`,
                                name: `Expert (${requestedRole})`,
                                role: 'specialist',
                                authorType: AuthorType.GEMINI, // Default to reliable model
                                model: 'gemini-2.5-flash',
                                persona: `You are a world-class subject matter expert in ${requestedRole}. The High Council has summoned you for a specific deep-dive.`,
                                color: "from-fuchsia-500 to-purple-600",
                                enabled: true
                            };
                            
                            // Update State & Local
                            currentSessionBots = [...currentSessionBots, newSpecialist];
                            setActiveSessionBots(currentSessionBots);

                            // Let the specialist speak immediately
                            setThinkingBotId(newSpecialist.id);
                            const specSystemPrompt = COUNCIL_SYSTEM_INSTRUCTION.SPECIALIST.replace('{{ROLE}}', requestedRole) + ` Persona: ${newSpecialist.persona}`;
                            const specResponse = await getBotResponse(newSpecialist, sessionHistory, specSystemPrompt, settings.globalOpenRouterKey, settings.mcp);

                            const specMsg: Message = { 
                                id: 'temp', author: newSpecialist.name, authorType: newSpecialist.authorType, 
                                content: specResponse, color: newSpecialist.color, roleLabel: "SPECIALIST AGENT" 
                            };
                            addMessage(specMsg);
                            sessionHistory.push(specMsg);
                        }
                    }

                } catch (e: any) { console.error(e); addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `${councilor.name} yielded the floor. (${e.message})` }); }
            }
        }
    }

    // --- PHASE 3: RESOLUTION ---
    if (speaker) {
        setSessionStatus(SessionStatus.RESOLVING);
        addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 3: SPEAKER'S RULING." });
        setThinkingBotId(speaker.id);
        
        try {
            const systemPrompt = `${COUNCIL_SYSTEM_INSTRUCTION.SPEAKER} Persona: ${speaker.persona}`;
            const response = await getBotResponse(speaker, sessionHistory, systemPrompt, settings.globalOpenRouterKey, settings.mcp);
            
            const msg: Message = { 
                id: 'temp', author: speaker.name, authorType: speaker.authorType, 
                content: response, color: speaker.color, roleLabel: "SPEAKER" 
            };
            addMessage(msg);
            sessionHistory.push(msg);
            
            // --- PHASE 4: VOTING ---
            const finalVotingMembers = currentSessionBots.filter(b => b.role === 'councilor');
            
            if (finalVotingMembers.length > 0) {
                 setSessionStatus(SessionStatus.VOTING);
                 addMessage({ author: 'Council Clerk', authorType: AuthorType.SYSTEM, content: "PHASE 4: ROLL CALL VOTE." });
                 
                 const currentVotes: VoteData['votes'] = [];
                 let yeas = 0;
                 let nays = 0;

                 for (const councilor of finalVotingMembers) {
                     setThinkingBotId(councilor.id);
                     const votePrompt = `${COUNCIL_SYSTEM_INSTRUCTION.COUNCILOR_VOTE} Persona: ${councilor.persona}`;
                     try {
                        const voteRes = await getBotResponse(councilor, sessionHistory, votePrompt, settings.globalOpenRouterKey, settings.mcp);
                        
                        let choice: 'YEA' | 'NAY' = 'YEA'; // Default fallback
                        let reason = "Agreed with Speaker.";

                        const cleanRes = voteRes.replace(/\*/g, '').trim();
                        if (cleanRes.toUpperCase().includes("VOTE: NAY") || cleanRes.toUpperCase().includes("VOTE:NAY")) {
                            choice = 'NAY';
                            nays++;
                        } else {
                            // Assume YEA unless explicit NAY
                            yeas++;
                        }
                        
                        // Attempt to extract reasoning text after the vote keyword
                        const splitText = cleanRes.split(/VOTE: ?(YEA|NAY)/i);
                        if (splitText.length > 1) reason = splitText[splitText.length - 1].replace(/^[:\s-]+/, '').trim();
                        
                        currentVotes.push({
                            voter: councilor.name,
                            choice,
                            reason: reason.substring(0, 120) + (reason.length > 120 ? '...' : ''), // Truncate for UI
                            color: councilor.color
                        });

                     } catch (e: any) {
                         // Abstention or error
                     }
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
                
                // Add vote tally to history for AI context
                sessionHistory.push({
                    id: 'sys-vote',
                    author: 'SYSTEM',
                    authorType: AuthorType.SYSTEM,
                    content: `VOTE RESULT: ${result}. Yeas: ${yeas}, Nays: ${nays}.`
                });

                 // --- PHASE 5: ENACTMENT / CONCLUSION ---
                 setSessionStatus(SessionStatus.ENACTING);
                 setThinkingBotId(speaker.id);
                 
                 // Re-prompt Speaker for Final Decree based on Vote
                 const enactmentPrompt = COUNCIL_SYSTEM_INSTRUCTION.SPEAKER_POST_VOTE
                    .replace('{{RESULT}}', result)
                    .replace('{{YEAS}}', yeas.toString())
                    .replace('{{NAYS}}', nays.toString())
                    + ` Persona: ${speaker.persona}`;
                 
                 const enactmentResponse = await getBotResponse(speaker, sessionHistory, enactmentPrompt, settings.globalOpenRouterKey, settings.mcp);

                 addMessage({ 
                    author: speaker.name, 
                    authorType: speaker.authorType, 
                    content: enactmentResponse, 
                    color: speaker.color, 
                    roleLabel: result === 'PASSED' ? "ENACTMENT DECREE" : "TABLED NOTICE"
                });

            }

        } catch (e: any) {
             addMessage({ author: 'Clerk', authorType: AuthorType.SYSTEM, content: `Speaker Error: ${e.message}` });
        }
    }

    setThinkingBotId(null);
    setSessionStatus(SessionStatus.IDLE);
    setCurrentTopic(null);
  };

  const handleMotionProposed = (content: string) => {
    if (sessionStatus !== SessionStatus.IDLE) return;

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
        case SessionStatus.OPENING: return "Committee Review...";
        case SessionStatus.DEBATING: return "Floor Debate in Progress...";
        case SessionStatus.RESOLVING: return "Speaker deliberation...";
        case SessionStatus.VOTING: return "Roll Call Vote...";
        case SessionStatus.ENACTING: return "Final Enactment...";
        default: return "Chamber in Recess";
    }
  };

  return (
    <div className="h-screen w-screen flex antialiased font-sans bg-slate-950">
      <main className="flex-1 h-full flex flex-col relative">
        <ChatWindow
            messages={messages}
            activeBots={sessionStatus === SessionStatus.IDLE ? settings.bots.filter(b => b.enabled) : activeSessionBots}
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
