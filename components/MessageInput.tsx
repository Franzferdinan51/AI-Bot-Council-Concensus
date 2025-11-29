
import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  statusText: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, statusText }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim());
      setContent('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-900 border-t border-slate-700 shadow-2xl z-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2 flex justify-between items-end">
            <label className="text-xs uppercase tracking-widest text-amber-500 font-bold">
                {isLoading ? "Council Session in Progress..." : "Submit Agenda Item"}
            </label>
            <span className="text-xs text-slate-500 font-mono">{statusText}</span>
        </div>
        <div className="flex items-center gap-0 bg-slate-800 rounded-lg border border-slate-600 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all shadow-inner">
            <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isLoading ? "Please wait for the floor to clear..." : "Enter a subject for the Council to debate..."}
            className="w-full bg-transparent px-6 py-4 text-white placeholder-slate-500 focus:outline-none font-serif text-lg"
            disabled={isLoading}
            />
            <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="m-2 px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold uppercase tracking-wider text-sm rounded hover:from-amber-500 hover:to-amber-600 transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:grayscale"
            >
             PROPOSE
            </button>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;
