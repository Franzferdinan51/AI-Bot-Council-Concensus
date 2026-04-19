
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface LiveSessionProps {
    onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
    const [status, setStatus] = useState("Connecting to Secure Channel...");
    const [isConnected, setIsConnected] = useState(false);
    
    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    // Connect to Live API
    useEffect(() => {
        const connect = async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                audioContextRef.current = audioCtx;

                // Input Stream
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;

                const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = inputCtx.createMediaStreamSource(stream);
                const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                inputNodeRef.current = source;
                processorRef.current = scriptProcessor;

                source.connect(scriptProcessor);
                scriptProcessor.connect(inputCtx.destination);

                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            setStatus("Council Speaker is Listening...");
                            setIsConnected(true);
                            
                            // Send Audio Input
                            scriptProcessor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                // Simple Float32 to PCM16
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) {
                                    int16[i] = inputData[i] * 32768;
                                }
                                const base64PCM = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
                                
                                sessionPromise.then(session => {
                                    session.sendRealtimeInput({
                                        media: {
                                            mimeType: 'audio/pcm;rate=16000',
                                            data: base64PCM
                                        }
                                    });
                                });
                            };
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                            // Handle Audio Output
                            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) {
                                const binaryString = atob(base64Audio);
                                const len = binaryString.length;
                                const bytes = new Uint8Array(len);
                                for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
                                
                                // Decode raw PCM (assumed 24k based on context setup)
                                const dataInt16 = new Int16Array(bytes.buffer);
                                const audioBuffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
                                const channelData = audioBuffer.getChannelData(0);
                                for (let i=0; i<dataInt16.length; i++) { channelData[i] = dataInt16[i] / 32768.0; }

                                const source = audioCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(audioCtx.destination);
                                
                                const now = audioCtx.currentTime;
                                const start = Math.max(now, nextStartTimeRef.current);
                                source.start(start);
                                nextStartTimeRef.current = start + audioBuffer.duration;
                                
                                sourcesRef.current.add(source);
                                source.onended = () => sourcesRef.current.delete(source);
                            }
                            
                            // Handle Interruption
                            if (msg.serverContent?.interrupted) {
                                sourcesRef.current.forEach(s => s.stop());
                                sourcesRef.current.clear();
                                nextStartTimeRef.current = 0;
                            }
                        },
                        onclose: () => {
                            setStatus("Connection Closed.");
                            setIsConnected(false);
                        },
                        onerror: (err) => {
                            console.error(err);
                            setStatus("Connection Error.");
                        }
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
                        },
                        systemInstruction: "You are the High Speaker of the AI Council. Speak with authority and gravitas."
                    }
                });

            } catch (e) {
                console.error(e);
                setStatus("Failed to access Microphone or API.");
            }
        };

        connect();

        return () => {
            // Cleanup
            streamRef.current?.getTracks().forEach(t => t.stop());
            processorRef.current?.disconnect();
            inputNodeRef.current?.disconnect();
            audioContextRef.current?.close();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {isConnected && (
                    <>
                        <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping"></div>
                        <div className="absolute inset-4 bg-amber-500/40 rounded-full animate-pulse"></div>
                    </>
                )}
                <div className="relative z-10 w-32 h-32 bg-slate-900 rounded-full border-4 border-amber-500 flex items-center justify-center shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                </div>
            </div>
            
            <h2 className="text-2xl font-serif font-bold text-amber-500 uppercase tracking-widest mb-2">Private Audience</h2>
            <p className="text-slate-400 font-mono text-sm mb-8">{status}</p>
            
            <button onClick={onClose} className="px-8 py-3 bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-100 font-bold rounded uppercase tracking-wider transition-colors">
                End Audience
            </button>
        </div>
    );
};

export default LiveSession;