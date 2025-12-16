
import React, { useState, useEffect } from 'react';
import { Message, SessionMode, Attachment, BotConfig } from '../types';
import MessageInput from './MessageInput';

interface CodingInterfaceProps {
    messages: Message[];
    onSendMessage: (content: string, attachments: Attachment[], mode: SessionMode) => void;
    isLoading: boolean;
    statusText: string;
    thinkingBotIds: string[];
    onStopSession: () => void;
    currentTopic: string | null;
    currentMode: SessionMode;
    onModeChange: (mode: SessionMode) => void;
    onToggleSettings?: () => void;
}

interface VirtualFile {
    name: string;
    content: string;
    language: string;
}

const CodingInterface: React.FC<CodingInterfaceProps> = ({
    messages, onSendMessage, isLoading, statusText, thinkingBotIds, onStopSession, currentTopic, currentMode, onModeChange, onToggleSettings
}) => {
    const [files, setFiles] = useState<VirtualFile[]>([]);
    const [activeFile, setActiveFile] = useState<VirtualFile | null>(null);
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

    // Parse messages to build Virtual File System
    useEffect(() => {
        const newFiles: VirtualFile[] = [];
        const fileMap = new Map<string, VirtualFile>();

        messages.forEach(msg => {
            // 1. Check for XML plan (Architect)
            const planMatches = msg.content.matchAll(/<file name="(.*?)"/g);
            for (const match of planMatches) {
                const name = match[1];
                if (!fileMap.has(name)) {
                    fileMap.set(name, { name, content: '// Pending generation...', language: getLanguageFromExt(name) });
                }
            }

            // 2. Check for Code Blocks
            const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
            const matches = [...msg.content.matchAll(codeBlockRegex)];
            
            if (matches.length > 0) {
                 let bestFileMatch: string | null = null;
                 
                 // Heuristic: Try to find file name mentioned in the message or role label
                 for (const fname of fileMap.keys()) {
                     if (msg.content.includes(fname) || (msg.roleLabel && msg.roleLabel.includes(fname))) {
                         bestFileMatch = fname;
                         break;
                     }
                 }

                 matches.forEach((match, idx) => {
                     const lang = match[1] || 'text';
                     const content = match[2];
                     
                     if (bestFileMatch) {
                         fileMap.set(bestFileMatch, { name: bestFileMatch, content, language: lang });
                     } else {
                         // Fallback for unnamed artifacts
                         const artifactName = `artifact_${msg.id.substring(0,4)}_${idx}.${lang === 'javascript' ? 'js' : lang}`;
                         if (!fileMap.has(artifactName)) {
                             fileMap.set(artifactName, { name: artifactName, content, language: lang });
                         }
                     }
                 });
            }
        });

        setFiles(Array.from(fileMap.values()));
        if (!activeFile && fileMap.size > 0) setActiveFile(fileMap.values().next().value);

    }, [messages]);

    const getLanguageFromExt = (filename: string) => {
        if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'javascript';
        if (filename.endsWith('.html')) return 'html';
        if (filename.endsWith('.css')) return 'css';
        if (filename.endsWith('.py')) return 'python';
        if (filename.endsWith('.json')) return 'json';
        return 'text';
    };

    return (
        <div className="flex flex-1 min-h-0 w-full bg-[#1e1e1e] text-slate-300 font-mono overflow-hidden">
            
            {/* LEFT: EXPLORER */}
            <div className="w-64 bg-[#252526] border-r border-[#333] flex flex-col shrink-0 hidden md:flex pt-[env(safe-area-inset-top)]">
                <div className="h-10 flex items-center justify-between px-4 text-xs font-bold uppercase tracking-widest text-slate-500 bg-[#252526]">
                    <span>Explorer</span>
                    <button onClick={onToggleSettings} title="Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:text-white"><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.78a2 2 0 0 1-.59 1.4l-4.12 4.12a2 2 0 0 0 0 2.82l4.12 4.12a2 2 0 0 1 .59 1.4v.78a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.78a2 2 0 0 1 .59-1.4l4.12-4.12a2 2 0 0 0 0-2.82l-4.12-4.12a2 2 0 0 1-.59-1.4V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {files.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 italic">No files generated yet.</div>
                    ) : (
                        files.map(file => (
                            <button
                                key={file.name}
                                onClick={() => setActiveFile(file)}
                                className={`w-full text-left px-4 py-1.5 text-xs flex items-center gap-2 hover:bg-[#2a2d2e] border-l-2 ${activeFile?.name === file.name ? 'bg-[#37373d] text-white border-pink-500' : 'border-transparent text-slate-400'}`}
                            >
                                <span className="opacity-70">{getIconForFile(file.name)}</span>
                                <span className="truncate">{file.name}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* CENTER: EDITOR */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] pt-[env(safe-area-inset-top)]">
                {/* Tabs */}
                <div className="flex bg-[#252526] border-b border-[#333] overflow-x-auto scrollbar-hide">
                    {activeFile && (
                        <div className="flex">
                            <button 
                                onClick={() => setActiveTab('code')}
                                className={`px-4 py-2 text-xs border-t-2 ${activeTab === 'code' ? 'bg-[#1e1e1e] text-white border-pink-500' : 'text-slate-500 border-transparent'}`}
                            >
                                {activeFile.name}
                            </button>
                            {activeFile.language === 'html' && (
                                <button 
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-4 py-2 text-xs border-t-2 ${activeTab === 'preview' ? 'bg-[#1e1e1e] text-white border-pink-500' : 'text-slate-500 border-transparent'}`}
                                >
                                    Preview
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto relative">
                    {activeFile ? (
                        activeTab === 'code' ? (
                            <pre className="p-4 text-sm font-mono text-blue-200 leading-relaxed whitespace-pre selection:bg-pink-500/30">
                                <code>{activeFile.content}</code>
                            </pre>
                        ) : (
                             <iframe 
                                srcDoc={activeFile.content} 
                                className="w-full h-full bg-white" 
                                title="Preview"
                                sandbox="allow-scripts"
                             />
                        )
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                            Select a file to view content
                        </div>
                    )}
                </div>

                {/* BOTTOM: TERMINAL (CHAT) */}
                <div className="h-1/3 min-h-[200px] border-t border-[#333] bg-[#1e1e1e] flex flex-col">
                    <div className="flex justify-between items-center px-4 py-1 bg-[#252526] text-xs">
                        <span className="uppercase font-bold text-slate-400">Terminal / Swarm Output</span>
                        <div className="flex gap-2">
                             {statusText && <span className="text-pink-400 animate-pulse">{statusText}</span>}
                             <button onClick={onStopSession} className="text-red-400 hover:text-white">STOP</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-xs">
                         {messages.map(msg => (
                             <div key={msg.id} className="opacity-80 hover:opacity-100">
                                 <span className={`font-bold ${msg.authorType === 'human' ? 'text-green-400' : 'text-pink-400'}`}>
                                     {msg.authorType === 'human' ? 'user@council:~$ ' : `${msg.roleLabel || 'swarm'}: `}
                                 </span>
                                 <span className="text-slate-300">{msg.content.substring(0, 300)}{msg.content.length > 300 ? '...' : ''}</span>
                             </div>
                         ))}
                    </div>
                    {/* Compact Input */}
                    <MessageInput 
                        onSendMessage={onSendMessage} 
                        isLoading={isLoading} 
                        statusText="" 
                        enableCodingMode={true} 
                        currentMode={currentMode}
                        onModeChange={onModeChange}
                        compact={true} 
                    />
                </div>
            </div>
        </div>
    );
};

const getIconForFile = (name: string) => {
    if (name.endsWith('.html')) return '🌐';
    if (name.endsWith('.css')) return '🎨';
    if (name.endsWith('.js') || name.endsWith('.ts')) return '📜';
    if (name.endsWith('.json')) return '📦';
    return '📄';
};

export default CodingInterface;
