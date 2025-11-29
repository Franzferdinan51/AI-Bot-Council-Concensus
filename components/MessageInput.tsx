
import React, { useState, useRef, useEffect } from 'react';
import { Attachment, SessionMode } from '../types';
import { transcribeAudio } from '../services/aiService';

interface MessageInputProps {
  onSendMessage: (content: string, attachments: Attachment[], mode: SessionMode) => void;
  isLoading: boolean;
  statusText: string;
  enableCodingMode?: boolean;
  currentMode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    statusText, 
    enableCodingMode = false,
    currentMode,
    onModeChange
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [content]);

  // --- AUDIO RECORDING ---
  const toggleRecording = async () => {
      if (isRecording) {
          mediaRecorder.current?.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              mediaRecorder.current = recorder;
              audioChunks.current = [];
              
              recorder.ondataavailable = (event) => {
                  audioChunks.current.push(event.data);
              };
              
              recorder.onstop = async () => {
                  const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
                  setContent("Transcribing audio...");
                  try {
                      const text = await transcribeAudio(audioBlob, process.env.API_KEY || '');
                      setContent(text);
                  } catch (e) {
                      console.error(e);
                      setContent("Error transcribing audio.");
                  }
              };
              
              recorder.start();
              setIsRecording(true);
          } catch (e) {
              console.error("Mic access denied", e);
          }
      }
  };

  // --- FILE HANDLING ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              const base64String = (event.target?.result as string).split(',')[1];
              setAttachments([...attachments, {
                  type: 'file',
                  mimeType: file.type,
                  data: base64String
              }]);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddLink = () => {
      if (linkUrl.trim()) {
          setAttachments([...attachments, {
              type: 'link',
              data: linkUrl.trim(),
              title: linkUrl.trim()
          }]);
          setLinkUrl('');
          setShowLinkInput(false);
      }
  };

  const removeAttachment = (index: number) => {
      setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim(), attachments, currentMode);
      setContent('');
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
      }
  };
  
  const getModeColor = (m: SessionMode) => {
      switch(m) {
          case SessionMode.PROPOSAL: return 'amber';
          case SessionMode.DELIBERATION: return 'purple';
          case SessionMode.INQUIRY: return 'cyan';
          case SessionMode.RESEARCH: return 'emerald';
          case SessionMode.SWARM: return 'orange';
          case SessionMode.SWARM_CODING: return 'pink';
          default: return 'slate';
      }
  };
  const activeColor = getModeColor(currentMode);

  const availableModes = [
      { m: SessionMode.PROPOSAL, label: 'Legislate', color: 'amber' },
      { m: SessionMode.DELIBERATION, label: 'Deliberate', color: 'purple' },
      { m: SessionMode.INQUIRY, label: 'Inquiry', color: 'cyan' },
      { m: SessionMode.RESEARCH, label: 'Deep Research', color: 'emerald' },
      { m: SessionMode.SWARM, label: 'Swarm Hive', color: 'orange' },
  ];

  if (enableCodingMode) {
      availableModes.push({ m: SessionMode.SWARM_CODING, label: 'Swarm Coding', color: 'pink' });
  }

  return (
    <div className="w-full bg-slate-950 pb-[env(safe-area-inset-bottom)] pt-2 px-2 md:px-4 relative z-10 transition-all duration-300 border-t border-transparent shrink-0">
      <div className="max-w-4xl mx-auto relative">
        
        {/* Status Indicator (Floating above) */}
        <div className="absolute -top-6 left-2 flex items-center gap-2 pointer-events-none">
            {isLoading && (
                 <div className="flex items-center gap-1.5 bg-slate-800/90 backdrop-blur px-2 py-0.5 rounded-full border border-slate-700 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-slate-300 font-mono uppercase tracking-wider">{statusText}</span>
                 </div>
            )}
        </div>

        {/* Link Input Popover */}
        {showLinkInput && (
            <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-slate-800 border border-slate-600 p-2 rounded-xl shadow-2xl flex gap-2 z-50 animate-fade-in-up">
                <input 
                    autoFocus
                    type="text" 
                    placeholder="Paste URL (Web or YouTube)..." 
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddLink(); } }}
                />
                <button onClick={handleAddLink} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 rounded-lg font-bold">Add</button>
                <button onClick={() => setShowLinkInput(false)} className="text-slate-400 hover:text-white px-2">✕</button>
            </div>
        )}

        {/* MAIN INPUT SURFACE */}
        <div className={`
            bg-slate-900 border border-slate-700 rounded-[20px] shadow-2xl transition-all duration-300
            focus-within:border-${activeColor}-500/50 focus-within:ring-1 focus-within:ring-${activeColor}-500/20
            flex flex-col relative overflow-visible group
        `}>
            
            {/* Top Bar: Mode Selector & Attachments */}
            <div className="flex items-center gap-2 px-3 pt-2">
                
                {/* Mode Pill */}
                <div className="relative">
                    <button 
                        onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all bg-${activeColor}-900/30 text-${activeColor}-400 hover:bg-${activeColor}-900/50 border border-${activeColor}-900/50`}
                    >
                        <span>{currentMode.replace('_', ' ')}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isModeMenuOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    
                    {/* Mode Dropdown */}
                    {isModeMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsModeMenuOpen(false)}></div>
                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-y-auto max-h-60 py-1 scrollbar-thin scrollbar-thumb-slate-600">
                                {availableModes.map((opt) => (
                                    <button
                                        key={opt.m}
                                        onClick={() => { onModeChange(opt.m); setIsModeMenuOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors flex items-center gap-3 ${currentMode === opt.m ? `text-${opt.color}-400 bg-slate-700/50` : 'text-slate-400'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full bg-${opt.color}-500 shrink-0`}></div>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Attachment Previews */}
                <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
                    {attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 max-w-[120px]">
                            {att.type === 'link' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 flex-shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            )}
                            <span className="text-[9px] text-slate-300 truncate flex-1">{att.type === 'link' ? att.data : 'File'}</span>
                            <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-red-400">×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Middle: Textarea */}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "Please wait..." : "Message the Council..."}
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 text-sm md:text-base px-4 py-3 focus:ring-0 resize-none max-h-48 font-serif leading-relaxed"
            />

            {/* Bottom Bar: Tools & Send */}
            <div className="flex justify-between items-center px-2 pb-2">
                
                {/* Left Tools */}
                <div className="flex items-center gap-1">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*" />
                    
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        title="Upload File"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                        title="Add Link"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    </button>
                </div>

                {/* Right Tools */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleRecording}
                        className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500/20 text-red-500' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        {isRecording ? (
                            <span className="flex h-4 w-4 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                            </span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={!content.trim() || isLoading}
                        className={`
                            h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg
                            ${content.trim() && !isLoading 
                                ? `bg-gradient-to-br from-${activeColor}-500 to-${activeColor}-700 text-white hover:scale-105 active:scale-95` 
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                        `}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
        
        {/* Footer Text */}
        <div className="text-center mt-1">
             <p className="text-[9px] text-slate-600 font-mono">
                 AI Council • {currentMode.replace('_', ' ').toUpperCase()} Mode Active
             </p>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
