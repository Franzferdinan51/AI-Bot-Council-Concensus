
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, Settings, AuthorType, SessionStatus, BotConfig, VoteData, Attachment, SessionMode, MemoryEntry, ControlSignal, PredictionData } from './types';
import { getBotResponse, generateSpeech } from './services/aiService';
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
                for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
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

    // --- SSE HANDLING ---
    useEffect(() => {
        const eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
            console.log("Connected to Council Event Stream");
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'session_update') {
                // Add new message
                const msg = data.data;
                setMessages(prev => {
                    // Avoid duplicates
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
            else if (data.type === 'token') {
                // Streaming token update
                const { messageId, content } = data.data;
                updateMessageContent(messageId, content);
            }
            else if (data.type === 'status_change') {
                setSessionStatus(data.data.status);
            }
            else if (data.type === 'speaker_change') {
                const { botId, isSpeaking } = data.data;
                if (isSpeaking) {
                    setThinkingBotIds(prev => [...prev, botId]);
                } else {
                    setThinkingBotIds(prev => prev.filter(id => id !== botId));
                }
            }
            else if (data.type === 'vote') {
                // Handle vote data update
                const { messageId, voteData } = data.data;
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, voteData } : m));
            }
            else if (data.type === 'error') {
                addMessage({ author: 'System', authorType: AuthorType.SYSTEM, content: `Error: ${data.data.error}` });
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
            // Retry connection after delay?
        };

        return () => {
            eventSource.close();
        };
    }, [updateMessageContent, addMessage]);

    const runCouncilSession = async (topic: string, mode: SessionMode, initialHistory: Message[]) => {
        // Logic moved to server
        console.log("Starting session on server...");
    };

    const processBotTurn = async () => { return ""; }; // Stub


    const handleSendMessage = async (content: string, attachments: Attachment[], mode: SessionMode) => {
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

        try {
            const res = await fetch('/api/session/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: fullContent,
                    mode,
                    settings,
                    context: messages,
                    userPrompt: fullContent,
                    attachments
                })
            });
            const data = await res.json();
            if (!data.success) {
                addMessage({ author: 'System', authorType: AuthorType.SYSTEM, content: `Failed to start session: ${data.error}` });
                setSessionStatus(SessionStatus.IDLE);
            }
        } catch (e: any) {
            addMessage({ author: 'System', authorType: AuthorType.SYSTEM, content: `Network Error: ${e.message}` });
            setSessionStatus(SessionStatus.IDLE);
        }
    };

    const clearSession = async () => {
        try {
            await fetch('/api/session/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'current' })
            });
        } catch (e) { console.error(e); }

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
        <div className="fixed inset-0 h-[100dvh] w-full bg-slate-950 flex flex-col font-sans text-slate-200 overflow-hidden pt-[calc(0.5rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">

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
                            <form onSubmit={(e) => { e.preventDefault(); if (privateInput.trim()) handlePrivateSend(privateInput); }} className="flex gap-2">
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
