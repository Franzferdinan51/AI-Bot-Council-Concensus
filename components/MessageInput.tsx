
import React, { useState, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  statusText: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, statusText }) => {
  const [content, setContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onstart = () => setIsListening(true);
        recog.onend = () => setIsListening(false);
        recog.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
        };
        recog.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setContent(prev => prev ? `${prev} ${transcript}` : transcript);
        };
        setRecognition(recog);
    }
  }, []);

  const toggleListen = () => {
      if (!recognition) return;
      if (isListening) recognition.stop();
      else recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-slate-900 border-t border-slate-700 shadow-2xl z-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2 flex justify-between items-end">
            <label className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                {isLoading ? "Council Session in Progress..." : "Submit Agenda Item"}
            </label>
            <span className="text-xs text-slate-500 font-mono hidden md:inline">{statusText}</span>
        </div>
        <div className="flex items-center gap-0 bg-slate-800 rounded-lg border border-slate-600 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all shadow-inner relative">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isListening ? "Listening..." : (isLoading ? "Please wait for the floor to clear..." : "Enter a subject for the Council to debate...")}
                className="w-full bg-transparent px-4 md:px-6 py-4 text-white placeholder-slate-500 focus:outline-none font-serif text-base md:text-lg"
                disabled={isLoading}
            />
            
            {/* Mic Button */}
            {recognition && (
                <button
                    type="button"
                    onClick={toggleListen}
                    disabled={isLoading}
                    className={`p-2 mr-2 rounded-full transition-all ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-700'}`}
                    title="Toggle Voice Input"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
            )}

            <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="m-2 px-4 md:px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold uppercase tracking-wider text-xs md:text-sm rounded hover:from-amber-500 hover:to-amber-600 transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:grayscale"
            >
             PROPOSE
            </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
