
import React, { useState, useEffect } from 'react';
import { Settings, BotConfig, AuthorType, MCPTool, RAGDocument } from '../types';
import { MCP_PRESETS, PERSONA_PRESETS } from '../constants';
import { getMemories } from '../services/knowledgeService';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState<'council' | 'providers' | 'audio' | 'mcp' | 'cost' | 'knowledge' | 'ui'>('council');
  const [editingBot, setEditingBot] = useState<BotConfig | null>(null);
  const [memories, setMemories] = useState(getMemories());
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  useEffect(() => {
      if (isOpen) setMemories(getMemories());
  }, [isOpen]);

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
          authorType: AuthorType.GEMINI,
          model: "gemini-2.5-flash",
          persona: "You are a new member of the council.",
          color: "from-slate-500 to-slate-700",
          enabled: true,
          endpoint: "",
          apiKey: ""
      });
  };

  const loadPersonaPreset = (presetName: string) => {
      if (!editingBot) return;
      const preset = PERSONA_PRESETS.find(p => p.name === presetName);
      if (preset) {
          setEditingBot({
              ...editingBot,
              name: presetName === "Custom" ? editingBot.name : presetName,
              persona: preset.persona || editingBot.persona
          });
      }
  };

  // --- Helpers ---
  const updateProvider = (field: keyof Settings['providers'], value: string) => {
      onSettingsChange({
          ...settings,
          providers: { ...settings.providers, [field]: value }
      });
  };

  const updateAudio = (field: keyof Settings['audio'], value: any) => {
      onSettingsChange({
          ...settings,
          audio: { ...settings.audio, [field]: value }
      });
  };
  
  const updateUI = (field: keyof Settings['ui'], value: any) => {
      onSettingsChange({
          ...settings,
          ui: { ...settings.ui, [field]: value }
      });
  };
  
  const updateCost = (field: keyof Settings['cost'], value: any) => {
      onSettingsChange({
          ...settings,
          cost: { ...settings.cost, [field]: value }
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

  const loadPreset = (presetName: string) => {
      if (!presetName) return;
      const preset = MCP_PRESETS.find(p => p.name === presetName);
      if (preset) {
           onSettingsChange({ 
              ...settings, 
              mcp: { 
                  ...settings.mcp, 
                  customTools: [...settings.mcp.customTools, preset] 
              } 
          });
      }
  };

  const quickSetEndpoint = (url: string) => {
      onSettingsChange({
          ...settings,
          mcp: { ...settings.mcp, dockerEndpoint: url }
      });
  };
  
  // --- KNOWLEDGE ---
  const addDocument = () => {
      if(!newDocTitle || !newDocContent) return;
      const newDoc: RAGDocument = {
          id: `doc-${Date.now()}`,
          title: newDocTitle,
          content: newDocContent,
          active: true
      };
      onSettingsChange({
          ...settings,
          knowledge: { documents: [...settings.knowledge.documents, newDoc] }
      });
      setNewDocTitle('');
      setNewDocContent('');
  };
  
  const deleteDoc = (id: string) => {
      const newDocs = settings.knowledge.documents.filter(d => d.id !== id);
      onSettingsChange({
          ...settings,
          knowledge: { documents: newDocs }
      });
  };

  return (
    <>
      <button 
        onClick={onToggle}
        className="fixed top-14 right-4 z-40 p-2 bg-slate-700 rounded-full text-white hover:bg-slate-600 shadow-xl transition-transform duration-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.78a2 2 0 0 1-.59 1.4l-4.12 4.12a2 2 0 0 0 0 2.82l4.12 4.12a2 2 0 0 1 .59 1.4v.78a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.78a2 2 0 0 1 .59-1.4l4.12-4.12a2 2 0 0 0 0-2.82l-4.12-4.12a2 2 0 0 1-.59-1.4V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>

      <div className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-md shadow-2xl z-30 transition-transform duration-300 w-full max-w-lg flex flex-col pt-[env(safe-area-inset-top)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700 pt-16 px-4 md:px-6 bg-slate-900 overflow-x-auto scrollbar-hide">
            {[
                { id: 'council', label: 'Council' },
                { id: 'knowledge', label: 'Knowledge' },
                { id: 'mcp', label: 'MCP' },
                { id: 'cost', label: 'Cost' },
                { id: 'providers', label: 'API' },
                { id: 'audio', label: 'Voice' },
                { id: 'ui', label: 'General' },
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`pb-3 px-3 md:px-4 text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap ${activeTab === tab.id ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
            
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
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
                                <option value={AuthorType.OLLAMA}>Ollama</option>
                                <option value={AuthorType.JAN_AI}>Jan AI</option>
                                <option value={AuthorType.OPENAI_COMPATIBLE}>Generic OpenAI</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Model ID</label>
                        <input value={editingBot.model} onChange={e => setEditingBot({...editingBot, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="e.g. gemini-2.5-flash" />
                    </div>

                    {/* Quick Load Persona */}
                     <div>
                        <label className="text-xs text-cyan-400 font-bold uppercase mb-1 block">Quick Load Persona Preset</label>
                        <select 
                            onChange={(e) => loadPersonaPreset(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs mb-2"
                        >
                            <option value="">-- Select a Preset to Overwrite Persona --</option>
                            {PERSONA_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="text-xs text-slate-400">System Persona</label>
                        <textarea value={editingBot.persona} onChange={e => setEditingBot({...editingBot, persona: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white h-24 text-sm" />
                    </div>
                    
                    <button onClick={() => saveBot(editingBot)} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded">SAVE MEMBER</button>
                </div>
            )}
            
            {/* --- KNOWLEDGE TAB (RAG/MEMORY) --- */}
            {activeTab === 'knowledge' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-2">Knowledge Base (RAG)</h3>
                    
                    {/* Add Document */}
                    <div className="bg-slate-800 p-4 rounded border border-slate-700 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Upload / Add Context Document</label>
                        <input 
                            value={newDocTitle} 
                            onChange={e => setNewDocTitle(e.target.value)} 
                            placeholder="Document Title (e.g. Constitution, Manifesto)" 
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm" 
                        />
                        <textarea 
                            value={newDocContent} 
                            onChange={e => setNewDocContent(e.target.value)} 
                            placeholder="Paste full text content here..." 
                            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs h-24" 
                        />
                        <button onClick={addDocument} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded">
                            ADD TO KNOWLEDGE STORE
                        </button>
                    </div>
                    
                    {/* List Documents */}
                    <div>
                         <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Active Documents</h4>
                         {settings.knowledge.documents.length === 0 ? (
                             <p className="text-xs text-slate-500 italic">No documents found.</p>
                         ) : (
                             settings.knowledge.documents.map(doc => (
                                 <div key={doc.id} className="bg-slate-800 p-2 rounded border border-slate-700 mb-2 flex justify-between items-center">
                                     <div>
                                        <div className="text-sm font-bold text-white">{doc.title}</div>
                                        <div className="text-[10px] text-slate-500">{doc.content.substring(0, 50)}...</div>
                                     </div>
                                     <button onClick={() => deleteDoc(doc.id)} className="text-red-400 text-xs hover:text-red-300">Delete</button>
                                 </div>
                             ))
                         )}
                    </div>

                    {/* Precedents */}
                     <div className="border-t border-slate-700 pt-4">
                        <h4 className="text-xs font-bold text-amber-500 uppercase mb-2">Legislative Precedents (Long-Term Memory)</h4>
                        {memories.length === 0 ? (
                             <p className="text-xs text-slate-500 italic">No laws enacted yet.</p>
                         ) : (
                             <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                 {memories.map(mem => (
                                     <div key={mem.id} className="bg-slate-900 p-2 rounded border border-slate-800">
                                         <div className="text-xs text-amber-200 font-bold mb-1">{mem.topic}</div>
                                         <div className="text-[10px] text-slate-400">{mem.content.substring(0, 100)}...</div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            )}
            
            {/* --- PROVIDERS TAB --- */}
            {activeTab === 'providers' && (
                <div className="space-y-4">
                    <h3 className="text-white font-serif text-lg mb-4">API Configuration</h3>
                    
                    <div className="p-4 bg-slate-800 rounded border border-slate-700">
                        <label className="text-sm font-bold text-amber-500 block mb-2">Google Gemini API Key</label>
                        <input 
                            type="password" 
                            value={settings.providers.geminiApiKey || ''} 
                            onChange={e => updateProvider('geminiApiKey', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-600"
                            placeholder="(Optional) Override environment key"
                        />
                    </div>
                    
                    <div className="p-4 bg-slate-800 rounded border border-slate-700">
                        <label className="text-sm font-bold text-emerald-500 block mb-2">OpenRouter API Key</label>
                        <input 
                            type="password" 
                            value={settings.providers.openRouterKey || ''} 
                            onChange={e => updateProvider('openRouterKey', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-600"
                            placeholder="sk-or-..."
                        />
                    </div>

                    <div className="p-4 bg-slate-800 rounded border border-slate-700 space-y-3">
                        <h4 className="text-sm font-bold text-blue-400 block">Local Providers (URLs)</h4>
                        <div>
                            <label className="text-xs text-slate-400">LM Studio Endpoint</label>
                            <input type="text" value={settings.providers.lmStudioEndpoint} onChange={e => updateProvider('lmStudioEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Ollama Endpoint</label>
                            <input type="text" value={settings.providers.ollamaEndpoint} onChange={e => updateProvider('ollamaEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Jan AI Endpoint</label>
                            <input type="text" value={settings.providers.janAiEndpoint} onChange={e => updateProvider('janAiEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- COST & PERFORMANCE TAB --- */}
            {activeTab === 'cost' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-2">Cost & Performance</h3>
                    
                    <div className="bg-slate-800 p-4 rounded border border-slate-700 space-y-4">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={settings.cost.economyMode} onChange={e => updateCost('economyMode', e.target.checked)} />
                            <div className="ml-3">
                                <span className="text-amber-400 font-bold block">Economy Mode (Save $$$)</span>
                                <span className="text-xs text-slate-400">Forces all Councilors/Agents to use cheaper models (Flash) and output concise answers. Speaker retains full power.</span>
                            </div>
                        </label>

                        <div className="border-t border-slate-700 pt-4">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={settings.cost.contextPruning} onChange={e => updateCost('contextPruning', e.target.checked)} />
                                <div className="ml-3">
                                    <span className="text-white font-bold block">Smart Context Pruning</span>
                                    <span className="text-xs text-slate-400">Saves tokens by limiting history sent to API.</span>
                                </div>
                            </label>
                        </div>

                        {settings.cost.contextPruning && (
                            <div className="ml-8">
                                <label className="text-xs text-slate-300 block mb-1">Max History Turns (Keep Last N)</label>
                                <input 
                                    type="number" 
                                    min="2" max="50"
                                    value={settings.cost.maxContextTurns} 
                                    onChange={e => updateCost('maxContextTurns', parseInt(e.target.value))}
                                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Keeps the original topic + last {settings.cost.maxContextTurns} messages.</p>
                            </div>
                        )}

                        <div className="border-t border-slate-700 pt-4">
                             <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={settings.cost.parallelProcessing} onChange={e => updateCost('parallelProcessing', e.target.checked)} />
                                <div className="ml-3">
                                    <span className="text-white font-bold block">Batch Processing (Parallel)</span>
                                    <span className="text-xs text-slate-400">Speeds up Research and Inquiry modes by running bots simultaneously.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* --- AUDIO TAB --- */}
            {activeTab === 'audio' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-2">Voice & Broadcast</h3>
                    
                    <div className="bg-slate-800 p-4 rounded border border-slate-700">
                        <label className="flex items-center cursor-pointer mb-4">
                            <input type="checkbox" className="w-5 h-5 accent-amber-500" checked={settings.audio.enabled} onChange={e => updateAudio('enabled', e.target.checked)} />
                            <span className="ml-3 text-white font-bold">Enable Broadcast Mode (TTS)</span>
                        </label>

                        {settings.audio.enabled && (
                            <div className="ml-8 space-y-4 animate-fade-in">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={settings.audio.useGeminiTTS} onChange={e => updateAudio('useGeminiTTS', e.target.checked)} />
                                    <span className="ml-2 text-slate-300 text-sm">Use Gemini Neural Voice (Recommended)</span>
                                </label>
                                <p className="text-xs text-slate-500">Requires Gemini API usage. Uncheck to use standard browser voices.</p>

                                <div>
                                    <label className="text-xs text-slate-300 block mb-1">Speech Rate ({settings.audio.speechRate}x)</label>
                                    <input 
                                        type="range" min="0.5" max="2.0" step="0.1" 
                                        value={settings.audio.speechRate} 
                                        onChange={e => updateAudio('speechRate', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={settings.audio.autoPlay} onChange={e => updateAudio('autoPlay', e.target.checked)} />
                                    <span className="ml-2 text-slate-300 text-sm">Auto-play new messages</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MCP / TOOLS TAB --- */}
            {activeTab === 'mcp' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-4">Model Context Protocol (MCP)</h3>
                    <div>
                        <label className="flex items-center cursor-pointer mb-4">
                            <input type="checkbox" className="w-4 h-4" checked={settings.mcp.enabled} onChange={e => onSettingsChange({...settings, mcp: {...settings.mcp, enabled: e.target.checked}})} />
                            <span className="ml-2 text-white font-bold">Enable Tools / MCP Context</span>
                        </label>
                        <p className="text-xs text-slate-400 mb-4">
                            Bots will be informed of these tools and may attempt to "call" them.
                        </p>
                    </div>

                    <div className="p-4 bg-slate-800 rounded border border-slate-700">
                        <label className="text-xs text-cyan-400 font-bold uppercase block mb-2">Docker / Remote MCP Endpoint</label>
                        <div className="flex gap-2 mb-2">
                             <input 
                                type="text" 
                                value={settings.mcp.dockerEndpoint} 
                                onChange={e => onSettingsChange({...settings, mcp: {...settings.mcp, dockerEndpoint: e.target.value}})}
                                placeholder="http://localhost:8080/mcp (SSE Endpoint)"
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                            />
                            <div className="flex flex-col gap-1">
                                <button onClick={() => quickSetEndpoint('http://localhost:3000/sse')} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">3000</button>
                                <button onClick={() => quickSetEndpoint('http://localhost:8080/sse')} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded">8080</button>
                            </div>
                        </div>
                    </div>

                    <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className="text-xs text-emerald-400 font-bold uppercase">JSON Tool Definitions</label>
                             <div className="flex gap-2">
                                 <select 
                                    onChange={(e) => { loadPreset(e.target.value); e.target.value = ''; }}
                                    className="bg-slate-700 border-none text-white text-[10px] rounded px-2 py-1"
                                 >
                                     <option value="">Load Preset...</option>
                                     {MCP_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                 </select>
                                 <button onClick={addTool} className="text-xs text-emerald-400 hover:underline">+ New</button>
                             </div>
                         </div>
                         {settings.mcp.customTools.map((tool, idx) => (
                             <div key={idx} className="bg-slate-800 p-3 rounded mb-2 border border-slate-700 animate-fade-in">
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
            
            {/* --- GENERAL UI TAB --- */}
            {activeTab === 'ui' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-4">General Preferences</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Debate Speed (Delay)</label>
                            <select 
                                value={settings.ui.debateDelay} 
                                onChange={e => updateUI('debateDelay', parseInt(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
                            >
                                <option value={1000}>Fast (1s)</option>
                                <option value={2000}>Normal (2s)</option>
                                <option value={4000}>Slow (4s)</option>
                                <option value={6000}>Contemplative (6s)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Font Size</label>
                            <select 
                                value={settings.ui.fontSize} 
                                onChange={e => updateUI('fontSize', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white"
                            >
                                <option value="small">Compact</option>
                                <option value="medium">Default</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                        <div>
                             <label className="text-sm text-slate-300 block mb-1">Custom Prime Directive (Override)</label>
                             <textarea 
                                value={settings.ui.customDirective || ''} 
                                onChange={e => updateUI('customDirective', e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-2 text-white text-xs h-24"
                                placeholder="Overwrite the core prompt here (e.g. 'You are all pirates...')"
                             />
                             <p className="text-[10px] text-slate-500 mt-1">Leave empty to use default Council rules.</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
