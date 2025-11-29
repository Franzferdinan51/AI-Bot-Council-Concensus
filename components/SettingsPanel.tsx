
import React, { useState } from 'react';
import { Settings, BotConfig, AuthorType, MCPTool } from '../types';
import { OPENROUTER_MODELS, DEFAULT_BOTS } from '../constants';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'council' | 'mcp' | 'api'>('council');
  const [editingBot, setEditingBot] = useState<BotConfig | null>(null);

  // --- Bot Management ---
  const toggleBot = (id: string) => {
      const newBots = settings.bots.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b);
      onSettingsChange({ ...settings, bots: newBots });
  };

  const deleteBot = (id: string) => {
      const newBots = settings.bots.filter(b => b.id !== id);
      onSettingsChange({ ...settings, bots: newBots });
  };

  const saveBot = (bot: BotConfig) => {
      const exists = settings.bots.find(b => b.id === bot.id);
      let newBots;
      if (exists) {
          newBots = settings.bots.map(b => b.id === bot.id ? bot : b);
      } else {
          newBots = [...settings.bots, bot];
      }
      onSettingsChange({ ...settings, bots: newBots });
      setEditingBot(null);
  };

  const addNewBot = () => {
      setEditingBot({
          id: `bot-${Date.now()}`,
          name: "New Member",
          role: "councilor",
          authorType: AuthorType.OPENAI_COMPATIBLE,
          model: "gpt-3.5-turbo",
          persona: "You are a new member of the council.",
          color: "from-slate-500 to-slate-700",
          enabled: true,
          endpoint: "",
          apiKey: ""
      });
  };

  // --- MCP Management ---
  const addTool = () => {
      const newTool: MCPTool = { name: "new_tool", description: "Description", schema: "{}" };
      onSettingsChange({ 
          ...settings, 
          mcp: { 
              ...settings.mcp, 
              customTools: [...settings.mcp.customTools, newTool] 
          } 
      });
  };

  const updateTool = (index: number, field: keyof MCPTool, value: string) => {
      const newTools = [...settings.mcp.customTools];
      newTools[index] = { ...newTools[index], [field]: value };
      onSettingsChange({ 
          ...settings, 
          mcp: { ...settings.mcp, customTools: newTools } 
      });
  };

  const removeTool = (index: number) => {
     const newTools = settings.mcp.customTools.filter((_, i) => i !== index);
     onSettingsChange({ 
          ...settings, 
          mcp: { ...settings.mcp, customTools: newTools } 
      });
  };

  return (
    <>
      <button 
        onClick={onToggle}
        className="fixed top-4 right-4 z-40 p-2 bg-slate-700 rounded-full text-white hover:bg-slate-600 shadow-xl transition-transform duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.78a2 2 0 0 1-.59 1.4l-4.12 4.12a2 2 0 0 0 0 2.82l4.12 4.12a2 2 0 0 1 .59 1.4v.78a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.78a2 2 0 0 1 .59-1.4l4.12-4.12a2 2 0 0 0 0-2.82l-4.12-4.12a2 2 0 0 1-.59-1.4V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>

      <div className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-md shadow-2xl z-30 transition-transform duration-300 w-full max-w-lg flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700 pt-16 px-4 md:px-6 bg-slate-900 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveTab('council')} className={`pb-3 px-3 md:px-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === 'council' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>Council</button>
            <button onClick={() => setActiveTab('mcp')} className={`pb-3 px-3 md:px-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === 'mcp' ? 'text-cyan-500 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'}`}>MCP / Tools</button>
            <button onClick={() => setActiveTab('api')} className={`pb-3 px-3 md:px-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === 'api' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>API Keys</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            
            {/* --- COUNCIL TAB --- */}
            {activeTab === 'council' && !editingBot && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-serif text-lg">Council Composition</h3>
                        <button onClick={addNewBot} className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded font-bold">ADD MEMBER</button>
                    </div>
                    {settings.bots.map(bot => (
                        <div key={bot.id} className={`p-3 rounded border flex items-center justify-between ${bot.enabled ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${bot.color} flex-shrink-0`}></div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-200 truncate">{bot.name}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider truncate">{bot.role} • {bot.authorType}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => toggleBot(bot.id)} className={`w-8 h-4 rounded-full relative transition-colors ${bot.enabled ? 'bg-green-600' : 'bg-slate-600'}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${bot.enabled ? 'left-4.5' : 'left-0.5'}`}></div>
                                </button>
                                <button onClick={() => setEditingBot(bot)} className="text-slate-400 hover:text-cyan-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                </button>
                                <button onClick={() => deleteBot(bot.id)} className="text-slate-400 hover:text-red-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- EDIT BOT FORM --- */}
            {activeTab === 'council' && editingBot && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setEditingBot(null)} className="text-slate-400 hover:text-white">← Back</button>
                        <h3 className="text-white font-bold">Edit Member</h3>
                    </div>
                    
                    <div>
                        <label className="text-xs text-slate-400">Name</label>
                        <input value={editingBot.name} onChange={e => setEditingBot({...editingBot, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-slate-400">Role</label>
                            <select value={editingBot.role} onChange={e => setEditingBot({...editingBot, role: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                                <option value="speaker">Speaker</option>
                                <option value="moderator">Moderator</option>
                                <option value="councilor">Councilor</option>
                                <option value="specialist">Specialist Agent</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Provider</label>
                            <select value={editingBot.authorType} onChange={e => setEditingBot({...editingBot, authorType: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                                <option value={AuthorType.GEMINI}>Gemini</option>
                                <option value={AuthorType.OPENROUTER}>OpenRouter</option>
                                <option value={AuthorType.LM_STUDIO}>LM Studio</option>
                                <option value={AuthorType.OPENAI_COMPATIBLE}>OpenAI Generic</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Model ID</label>
                        <input value={editingBot.model} onChange={e => setEditingBot({...editingBot, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="e.g. gemini-2.5-flash" />
                    </div>

                    {(editingBot.authorType === AuthorType.LM_STUDIO || editingBot.authorType === AuthorType.OPENAI_COMPATIBLE) && (
                        <div>
                            <label className="text-xs text-slate-400">API Endpoint</label>
                            <input value={editingBot.endpoint || ''} onChange={e => setEditingBot({...editingBot, endpoint: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="http://localhost:11434/v1/chat/completions" />
                        </div>
                    )}
                    
                    <div>
                        <label className="text-xs text-slate-400">System Persona</label>
                        <textarea value={editingBot.persona} onChange={e => setEditingBot({...editingBot, persona: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white h-24 text-sm" />
                    </div>
                    
                    <button onClick={() => saveBot(editingBot)} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded">SAVE MEMBER</button>
                </div>
            )}

            {/* --- MCP / TOOLS TAB --- */}
            {activeTab === 'mcp' && (
                <div className="space-y-6">
                    <div>
                        <label className="flex items-center cursor-pointer mb-4">
                            <input type="checkbox" className="w-4 h-4" checked={settings.mcp.enabled} onChange={e => onSettingsChange({...settings, mcp: {...settings.mcp, enabled: e.target.checked}})} />
                            <span className="ml-2 text-white font-bold">Enable Tools / MCP Context</span>
                        </label>
                        <p className="text-xs text-slate-400 mb-4">
                            Bots will be informed of these tools and may attempt to "call" them in their JSON output or reasoning.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-800 rounded border border-slate-700">
                        <label className="text-xs text-cyan-400 font-bold uppercase block mb-2">Docker / Remote MCP Endpoint</label>
                        <input 
                            type="text" 
                            value={settings.mcp.dockerEndpoint} 
                            onChange={e => onSettingsChange({...settings, mcp: {...settings.mcp, dockerEndpoint: e.target.value}})}
                            placeholder="http://localhost:8080/mcp (SSE Endpoint)"
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                        />
                    </div>

                    <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className="text-xs text-emerald-400 font-bold uppercase">JSON Tool Definitions</label>
                             <button onClick={addTool} className="text-xs text-emerald-400 hover:underline">+ Add Tool</button>
                         </div>
                         {settings.mcp.customTools.map((tool, idx) => (
                             <div key={idx} className="bg-slate-800 p-3 rounded mb-2 border border-slate-700">
                                 <div className="flex gap-2 mb-2">
                                    <input value={tool.name} onChange={e => updateTool(idx, 'name', e.target.value)} className="bg-slate-900 border-slate-600 border rounded px-2 py-1 text-white text-xs flex-1" placeholder="Tool Name" />
                                    <button onClick={() => removeTool(idx)} className="text-red-400 text-xs">Del</button>
                                 </div>
                                 <input value={tool.description} onChange={e => updateTool(idx, 'description', e.target.value)} className="w-full bg-slate-900 border-slate-600 border rounded px-2 py-1 text-white text-xs mb-2" placeholder="Description" />
                                 <textarea value={tool.schema} onChange={e => updateTool(idx, 'schema', e.target.value)} className="w-full bg-slate-900 border-slate-600 border rounded px-2 py-1 text-slate-300 text-[10px] font-mono h-16" placeholder="{ type: 'object', ... }" />
                             </div>
                         ))}
                    </div>
                </div>
            )}

            {/* --- API KEYS TAB --- */}
            {activeTab === 'api' && (
                <div className="space-y-4">
                     <div className="p-4 bg-slate-800 rounded border border-slate-700">
                        <label className="text-sm font-bold text-white block mb-2">Global OpenRouter Key</label>
                        <input 
                            type="password" 
                            value={settings.globalOpenRouterKey || ''} 
                            onChange={e => onSettingsChange({...settings, globalOpenRouterKey: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"
                            placeholder="sk-or-..."
                        />
                        <p className="text-xs text-slate-500 mt-2">Used for all OpenRouter bots unless overridden.</p>
                     </div>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
