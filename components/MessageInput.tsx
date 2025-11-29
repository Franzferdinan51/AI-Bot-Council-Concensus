
import React, { useState, useRef } from 'react';
import { Attachment, SessionMode } from '../types';
import { transcribeAudio } from '../services/aiService';

interface MessageInputProps {
  onSendMessage: (content: string, attachments: Attachment[], mode: SessionMode) => void;
  isLoading: boolean;
  statusText: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, statusText }) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState<SessionMode>(SessionMode.PROPOSAL);
  const [isRecording, setIsRecording] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
                      // Note: We access API key via env process in service, but service needs it passed if client side
                      // For simplicity, we assume env.API_KEY is available or injected in service
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
              title: linkUrl.trim() // Simple default
          }]);
          setLinkUrl('');
          setShowLinkInput(false);
      }
  };

  const removeAttachment = (index: number) => {
      setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim(), attachments, mode);
      setContent('');
      setAttachments([]);
    }
  };
  
  const getPlaceholder = () => {
      if (isRecording) return "Recording...";
      if (isLoading) return "The Council is deliberating...";
      switch (mode) {
          case SessionMode.INQUIRY: return "Ask the Council a question...";
          case SessionMode.DELIBERATION: return "Enter a topic for roundtable discussion...";
          case SessionMode.RESEARCH: return "Enter a topic or attach links for deep investigation...";
          case SessionMode.SWARM: return "Enter a complex task for the Swarm to decompose...";
          default: return "Enter a motion for legislative debate...";
      }
  };

  const getModeColor = (m: SessionMode) => {
      switch(m) {
          case SessionMode.PROPOSAL: return 'amber';
          case SessionMode.DELIBERATION: return 'purple';
          case SessionMode.INQUIRY: return 'cyan';
          case SessionMode.RESEARCH: return 'emerald';
          case SessionMode.SWARM: return 'orange';
          default: return 'slate';
      }
  };
  const activeColor = getModeColor(mode);

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-slate-900 border-t border-slate-700 shadow-2xl z-10 transition-colors duration-500 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Mode Selector */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
             {[
                 { m: SessionMode.PROPOSAL, label: 'Legislative Proposal', bg: 'bg-amber-600' },
                 { m: SessionMode.DELIBERATION, label: 'Deliberation', bg: 'bg-purple-600' },
                 { m: SessionMode.INQUIRY, label: 'Inquiry', bg: 'bg-cyan-600' },
                 { m: SessionMode.RESEARCH, label: 'Deep Research', bg: 'bg-emerald-600' },
                 { m: SessionMode.SWARM, label: 'Swarm Intelligence', bg: 'bg-orange-600' },
             ].map((btn) => (
                <button
                    key={btn.m}
                    type="button"
                    onClick={() => setMode(btn.m)}
                    className={`px-3 py-1 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${mode === btn.m ? `${btn.bg} text-white shadow-lg scale-105` : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'}`}
                >
                    {btn.label}
                </button>
             ))}
        </div>

        <div className="mb-2 flex justify-between items-end">
            <label className={`text-xs uppercase tracking-widest font-bold text-${activeColor}-500 transition-colors`}>
                {isLoading ? "Council Session in Progress..." : (mode === SessionMode.RESEARCH ? "Deep Agentic Investigation" : mode === SessionMode.SWARM ? "Deploy Swarm Agents" : "Submit Agenda Item")}
            </label>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">{statusText}</span>
        </div>
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto">
                {attachments.map((att, i) => (
                    <div key={i} className="relative bg-slate-800 p-2 rounded border border-slate-600 flex items-center gap-2">
                        <button type="button" onClick={() => removeAttachment(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                        {att.type === 'link' ? (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                <span className="truncate w-24">{att.data}</span>
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-300 truncate w-16">{att.mimeType}</div>
                        )}
                    </div>
                ))}
            </div>
        )}

        <div className={`flex items-center gap-0 bg-slate-800 rounded-lg border focus-within:ring-1 transition-all shadow-inner relative border-slate-600 focus-within:border-${activeColor}-500 focus-within:ring-${activeColor}-500`}>
            
            {/* File Upload Button */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-white transition-colors"
                title="Attach Image or Video"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,audio/*" />

            {/* Link Button */}
            <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="p-3 text-slate-400 hover:text-white transition-colors"
                title="Attach URL / YouTube"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            </button>

            {/* Link Popover */}
            {showLinkInput && (
                <div className="absolute bottom-16 left-0 bg-slate-800 border border-slate-600 p-2 rounded shadow-xl flex gap-2 z-50 w-64 md:w-80">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Paste URL (Web or YouTube)..." 
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddLink(); } }}
                    />
                    <button onClick={handleAddLink} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2 rounded">Add</button>
                </div>
            )}

            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full bg-transparent px-2 md:px-4 py-4 text-white placeholder-slate-500 focus:outline-none font-serif text-base md:text-lg"
                disabled={isLoading}
            />
            
            {/* Mic Button */}
            <button
                type="button"
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-3 mr-2 rounded-full transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title="Record Audio"
            >
                {isRecording ? (
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                )}
            </button>

            <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className={`m-2 px-4 md:px-6 py-2 bg-gradient-to-r text-white font-bold uppercase tracking-wider text-xs md:text-sm rounded transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:grayscale from-${activeColor}-600 to-${activeColor}-700 hover:from-${activeColor}-500 hover:to-${activeColor}-600`}
            >
             SEND
            </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
