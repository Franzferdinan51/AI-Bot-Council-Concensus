
import React, { useState, useEffect } from 'react';
import { Settings, BotConfig, AuthorType, MCPTool, RAGDocument, BotMemory } from '../types';
import { MCP_PRESETS, PERSONA_PRESETS, PUBLIC_MCP_REGISTRY } from '../constants';
import { getMemories, getBotMemories, addBotMemory, deleteBotMemory } from '../services/knowledgeService';

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
  
  // Bot Memory State
  const [botMemories, setBotMemories] = useState<BotMemory[]>([]);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryType, setNewMemoryType] = useState<'fact'|'directive'|'observation'>('fact');

  // MCP Import State
  const [toolImportUrl, setToolImportUrl] = useState('');
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
      if (isOpen) setMemories(getMemories());
  }, [isOpen]);

  // Load specific bot memories when editing
  useEffect(() => {
      if (editingBot) {
          setBotMemories(getBotMemories(editingBot.id));
      }
  }, [editingBot]);

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

  // --- Bot Memory Handlers ---
  const handleAddBotMemory = () => {
      if (!editingBot || !newMemoryContent.trim()) return;
      const mem = addBotMemory(editingBot.id, newMemoryContent, newMemoryType);
      setBotMemories([...botMemories, mem]);
      setNewMemoryContent('');
  };

  const handleDeleteBotMemory = (id: string) => {
      deleteBotMemory(id);
      setBotMemories(botMemories.filter(m => m.id !== id));
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

  const handleImportToolFromUrl = async () => {
      if (!toolImportUrl) return;
      setImportStatus("Fetching...");
      try {
          const res = await fetch(toolImportUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          
          const toolsToAdd: MCPTool[] = [];
          
          // Handle Array of tools or Single tool object
          const items = Array.isArray(data) ? data : [data];
          
          items.forEach((item: any) => {
              if (item.name && item.description) {
                  // Attempt to normalize schema. 
                  // Handles standard Gemini functionDeclaration or raw JSON schema in 'parameters' or 'input_schema'
                  const schemaObj = item.parameters || item.input_schema || item.schema || {};
                  
                  toolsToAdd.push({
                      name: item.name,
                      description: item.description,
                      schema: JSON.stringify(schemaObj, null, 2)
                  });
              }
          });

          if (toolsToAdd.length > 0) {
              onSettingsChange({
                  ...settings,
                  mcp: {
                      ...settings.mcp,
                      customTools: [...settings.mcp.customTools, ...toolsToAdd]
                  }
              });
              setImportStatus(`Successfully imported ${toolsToAdd.length} tools.`);
              setToolImportUrl('');
          } else {
              setImportStatus("No valid tool definitions found in JSON.");
          }
      } catch (e: any) {
          setImportStatus(`Error: ${e.message}`);
      }
  };

  const quickSetEndpoint = (url: string) => {
      onSettingsChange({
          ...settings,
          mcp: { ...settings.mcp, dockerEndpoint: url }
      });
  };

  const togglePublicTool = (toolId: string) => {
      const currentIds = settings.mcp.publicToolIds || [];
      let newIds;
      if (currentIds.includes(toolId)) {
          newIds = currentIds.filter(id => id !== toolId);
      } else {
          newIds = [...currentIds, toolId];
      }
      onSettingsChange({
          ...settings,
          mcp: { ...settings.mcp, publicToolIds: newIds }
      });
  };

  const toggleAllPublicTools = (enable: boolean) => {
      onSettingsChange({
          ...settings,
          mcp: { 
              ...settings.mcp, 
              publicToolIds: enable ? PUBLIC_MCP_REGISTRY.map(t => t.id) : [] 
          }
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
      <div className={`fixed top-0 right-0 h-full bg-slate-900/95 backdrop-blur-md shadow-2xl z-30 transition-transform duration-300 w-full max-w-lg flex flex-col pt-[env(safe-area-inset-top)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700 pt-4 md:pt-16 px-4 md:px-6 bg-slate-900 overflow-x-auto scrollbar-hide relative">
             <button onClick={onToggle} className="absolute top-4 right-4 text-slate-400 hover:text-white z-50 p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
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
                    
                    {/* Bot Basic Info */}
                    <div className="grid grid-cols-2 gap-2">
                         <div>
                            <label className="text-xs text-slate-400">Name</label>
                            <input value={editingBot.name} onChange={e => setEditingBot({...editingBot, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Role</label>
                            <select value={editingBot.role} onChange={e => setEditingBot({...editingBot, role: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                                <option value="speaker">Speaker</option>
                                <option value="moderator">Moderator</option>
                                <option value="councilor">Councilor</option>
                                <option value="specialist">Specialist Agent</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Bot Provider Info */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-slate-400">Provider</label>
                            <select value={editingBot.authorType} onChange={e => setEditingBot({...editingBot, authorType: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                                <option value={AuthorType.GEMINI}>Gemini</option>
                                <option value={AuthorType.OPENROUTER}>OpenRouter</option>
                                <option value={AuthorType.LM_STUDIO}>LM Studio / Local</option>
                                <option value={AuthorType.OLLAMA}>Ollama</option>
                                <option value={AuthorType.JAN_AI}>Jan AI</option>
                                <option value={AuthorType.ZAI}>Z.ai</option>
                                <option value={AuthorType.MOONSHOT}>Moonshot (Kimi)</option>
                                <option value={AuthorType.MINIMAX}>Minimax (M2)</option>
                                <option value={AuthorType.OPENAI_COMPATIBLE}>Generic OpenAI</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Model ID</label>
                            <input value={editingBot.model} onChange={e => setEditingBot({...editingBot, model: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white" placeholder="e.g. gemini-2.5-flash" />
                        </div>
                    </div>

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

                    {/* --- MEMORY BANK --- */}
                    <div className="border-t border-slate-700 pt-4 mt-2">
                        <h4 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">Agent Memory Bank</h4>
                        <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-3 space-y-2">
                            <input 
                                value={newMemoryContent} 
                                onChange={e => setNewMemoryContent(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" 
                                placeholder="Add a persistent fact, directive, or memory..."
                            />
                            <div className="flex gap-2">
                                <select 
                                    value={newMemoryType} 
                                    onChange={e => setNewMemoryType(e.target.value as any)}
                                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                                >
                                    <option value="fact">Fact</option>
                                    <option value="directive">Directive</option>
                                    <option value="observation">Observation</option>
                                </select>
                                <button onClick={handleAddBotMemory} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded">ADD MEMORY</button>
                            </div>
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {botMemories.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No custom memories saved for this agent.</p>
                            ) : (
                                botMemories.map(mem => (
                                    <div key={mem.id} className="flex justify-between items-start bg-slate-900 p-2 rounded border border-slate-800">
                                        <div>
                                            <span className={`text-[9px] uppercase font-bold mr-2 px-1 rounded ${
                                                mem.type === 'directive' ? 'bg-red-900 text-red-300' :
                                                mem.type === 'fact' ? 'bg-blue-900 text-blue-300' : 'bg-slate-700 text-slate-300'
                                            }`}>{mem.type}</span>
                                            <span className="text-xs text-slate-300">{mem.content}</span>
                                        </div>
                                        <button onClick={() => handleDeleteBotMemory(mem.id)} className="text-red-500 hover:text-white ml-2">×</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <button onClick={() => saveBot(editingBot)} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded mt-4">SAVE MEMBER</button>
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

                    <div className="p-4 bg-slate-800 rounded border border-slate-700 mt-4 space-y-4">
                        <label className="text-sm font-bold text-pink-400 block border-b border-slate-700 pb-2">Specialized / International Providers</label>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Moonshot (Kimi) API Key</label>
                            <input type="password" value={settings.providers.moonshotApiKey || ''} onChange={e => updateProvider('moonshotApiKey', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                            <label className="text-[10px] text-slate-500">Endpoint</label>
                            <input type="text" value={settings.providers.moonshotEndpoint || ''} onChange={e => updateProvider('moonshotEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-400 text-[10px]" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Minimax (M2) API Key</label>
                            <input type="password" value={settings.providers.minimaxApiKey || ''} onChange={e => updateProvider('minimaxApiKey', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                            <label className="text-[10px] text-slate-500">Endpoint</label>
                            <input type="text" value={settings.providers.minimaxEndpoint || ''} onChange={e => updateProvider('minimaxEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-400 text-[10px]" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Z.ai API Key</label>
                            <input type="password" value={settings.providers.zaiApiKey || ''} onChange={e => updateProvider('zaiApiKey', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" />
                            <label className="text-[10px] text-slate-500">Endpoint</label>
                            <input type="text" value={settings.providers.zaiEndpoint || ''} onChange={e => updateProvider('zaiEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-400 text-[10px]" />
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800 rounded border border-slate-700 mt-4">
                        <label className="text-sm font-bold text-violet-400 block mb-2">Generic OpenAI-Compatible API</label>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400">Base URL (v1/chat/completions)</label>
                                <input type="text" value={settings.providers.genericOpenAIEndpoint || ''} onChange={e => updateProvider('genericOpenAIEndpoint', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-600 text-xs" placeholder="https://api.groq.com/openai/v1/chat/completions" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">API Key</label>
                                <input type="password" value={settings.providers.genericOpenAIKey || ''} onChange={e => updateProvider('genericOpenAIKey', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-600 text-xs" placeholder="sk-..." />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800 rounded border border-slate-700 space-y-3">
                        <h4 className="text-sm font-bold text-blue-400 block">Local Providers (Network / Tailscale)</h4>
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
                                <div>
                                    <label className="text-xs text-slate-300 block mb-1">Speech Rate ({settings.audio.speechRate}x)</label>
                                    <input type="range" min="0.5" max="2.0" step="0.1" value={settings.audio.speechRate} onChange={e => updateAudio('speechRate', parseFloat(e.target.value))} className="w-full" />
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
            
            {/* --- COST TAB (RESTORED) --- */}
            {activeTab === 'cost' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-2">Cost & Performance</h3>
                    <div className="bg-slate-800 p-4 rounded border border-slate-700 space-y-6">
                        {/* Economy Mode */}
                        <label className="flex items-start cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" className="w-5 h-5 accent-emerald-500 peer" checked={settings.cost.economyMode} onChange={e => updateCost('economyMode', e.target.checked)} />
                            </div>
                            <div className="ml-3">
                                <span className="text-amber-400 font-bold block group-hover:text-amber-300 transition-colors">Economy Mode (Save $$$)</span>
                                <span className="text-xs text-slate-400">Forces all Councilors/Agents to use cheaper models (Flash) and output concise answers. Speaker retains full power.</span>
                            </div>
                        </label>

                        <div className="border-t border-slate-700 pt-4">
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="checkbox" className="w-4 h-4 accent-blue-500" checked={settings.cost.contextPruning} onChange={e => updateCost('contextPruning', e.target.checked)} />
                                <span className="ml-2 text-white font-bold text-sm">Smart Context Pruning</span>
                            </label>
                            <p className="text-xs text-slate-400 mb-2 pl-6">Automatically remove old messages to save tokens while keeping the System Prompt.</p>
                            {settings.cost.contextPruning && (
                                <div className="pl-6 space-y-1">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>Max History Turns</span>
                                        <span className="font-mono text-blue-400">{settings.cost.maxContextTurns}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="2" 
                                        max="30" 
                                        step="1"
                                        value={settings.cost.maxContextTurns} 
                                        onChange={e => updateCost('maxContextTurns', parseInt(e.target.value))} 
                                        className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-700 pt-4">
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="checkbox" className="w-4 h-4 accent-purple-500" checked={settings.cost.parallelProcessing} onChange={e => updateCost('parallelProcessing', e.target.checked)} />
                                <span className="ml-2 text-white font-bold text-sm">Parallel Processing</span>
                            </label>
                            <p className="text-xs text-slate-400 mb-2 pl-6">Run councilor debates simultaneously to save time (uses more rate limit quota).</p>
                            {settings.cost.parallelProcessing && (
                                <div className="pl-6 space-y-1">
                                    <div className="flex justify-between text-xs text-slate-300">
                                        <span>Max Concurrent Requests</span>
                                        <span className="font-mono text-purple-400">{settings.cost.maxConcurrentRequests}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max="10" 
                                        step="1"
                                        value={settings.cost.maxConcurrentRequests} 
                                        onChange={e => updateCost('maxConcurrentRequests', parseInt(e.target.value))} 
                                        className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MCP TAB (RESTORED) --- */}
             {activeTab === 'mcp' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-4">Model Context Protocol (MCP)</h3>
                    <div>
                        <label className="flex items-center cursor-pointer mb-4">
                            <input type="checkbox" className="w-4 h-4 accent-pink-500" checked={settings.mcp.enabled} onChange={e => onSettingsChange({...settings, mcp: {...settings.mcp, enabled: e.target.checked}})} />
                            <span className="ml-2 text-white font-bold">Enable Tools / MCP Context</span>
                        </label>
                        <p className="text-xs text-slate-400 mb-4">Bots will be informed of these tools and may attempt to "call" them to perform actions.</p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Remote MCP Server (Docker/SSE)</label>
                        <div className="flex gap-2 mb-2">
                            <input 
                                value={settings.mcp.dockerEndpoint} 
                                onChange={e => onSettingsChange({...settings, mcp: {...settings.mcp, dockerEndpoint: e.target.value}})} 
                                placeholder="http://localhost:8000/sse" 
                                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" 
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => quickSetEndpoint("http://localhost:8080/sse")} className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">Local 8080</button>
                            <button onClick={() => quickSetEndpoint("")} className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300">Clear</button>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs text-cyan-400 font-bold uppercase">Public / Built-in Tools</label>
                            <div className="flex gap-2">
                                <button onClick={() => toggleAllPublicTools(true)} className="text-[10px] text-emerald-400 hover:underline">Select All</button>
                                <span className="text-[10px] text-slate-600">|</span>
                                <button onClick={() => toggleAllPublicTools(false)} className="text-[10px] text-slate-400 hover:text-white hover:underline">None</button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                             {PUBLIC_MCP_REGISTRY.map(tool => (
                                 <div key={tool.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30">
                                     <div className="mr-4">
                                         <div className="text-sm font-bold text-slate-200">{tool.name}</div>
                                         <div className="text-[10px] text-slate-500">{tool.description}</div>
                                     </div>
                                     <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input type="checkbox" className="sr-only peer" checked={settings.mcp.publicToolIds?.includes(tool.id)} onChange={() => togglePublicTool(tool.id)} />
                                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-purple-400 uppercase">Custom Client-Side Tools</label>
                            <button onClick={addTool} className="text-[10px] bg-purple-700 px-2 py-1 rounded text-white hover:bg-purple-600">Add Tool</button>
                        </div>
                        
                        <div className="space-y-3">
                            {settings.mcp.customTools.map((tool, idx) => (
                                <div key={idx} className="bg-slate-900 p-3 rounded border border-slate-600">
                                    <div className="flex justify-between mb-2">
                                        <input value={tool.name} onChange={e => updateTool(idx, 'name', e.target.value)} className="bg-transparent border-b border-slate-500 text-sm font-bold text-white w-1/3 focus:outline-none" placeholder="tool_name" />
                                        <button onClick={() => removeTool(idx)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                                    </div>
                                    <input value={tool.description} onChange={e => updateTool(idx, 'description', e.target.value)} className="w-full bg-transparent text-xs text-slate-400 mb-2 border-b border-slate-700 focus:outline-none" placeholder="Description..." />
                                    <textarea value={tool.schema} onChange={e => updateTool(idx, 'schema', e.target.value)} className="w-full bg-slate-950 text-[10px] font-mono text-green-400 p-2 rounded h-20" placeholder='{"type": "object", "properties": {...}}' />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <label className="text-xs text-slate-400 block mb-1">Import from URL (JSON)</label>
                            <div className="flex gap-2">
                                <input value={toolImportUrl} onChange={e => setToolImportUrl(e.target.value)} className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs" placeholder="https://example.com/tools.json" />
                                <button onClick={handleImportToolFromUrl} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 rounded">Import</button>
                            </div>
                            {importStatus && <p className="text-[10px] text-amber-400 mt-1">{importStatus}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- KNOWLEDGE TAB (RESTORED) --- */}
             {activeTab === 'knowledge' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-2">Knowledge Base (RAG)</h3>
                    
                    <div className="bg-slate-800 p-4 rounded border border-slate-700 mb-4">
                        <h4 className="text-sm font-bold text-slate-300 mb-2">Active Documents</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2 mb-2">
                            {settings.knowledge.documents.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No documents uploaded. The Council relies on general knowledge.</p>
                            ) : (
                                settings.knowledge.documents.map(doc => (
                                    <div key={doc.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-600">
                                        <span className="text-xs text-white truncate max-w-[200px]">{doc.title}</span>
                                        <button onClick={() => deleteDoc(doc.id)} className="text-red-400 hover:text-white text-xs">Delete</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                     <div className="bg-slate-800 p-4 rounded border border-slate-700 space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Upload / Add Context Document</label>
                        <input value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} placeholder="Document Title" className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-sm" />
                        <textarea value={newDocContent} onChange={e => setNewDocContent(e.target.value)} placeholder="Paste full text..." className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs h-24" />
                        <button onClick={addDocument} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded">ADD TO KNOWLEDGE STORE</button>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded border border-slate-700 mt-4">
                        <h4 className="text-sm font-bold text-slate-300 mb-2">Long-Term Memory</h4>
                        <div className="text-xs text-slate-400 mb-2">The Council automatically remembers passed resolutions.</div>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                            {memories.map((mem, i) => (
                                <div key={i} className="bg-slate-900 p-2 rounded border border-slate-800 opacity-70 hover:opacity-100">
                                    <div className="font-bold text-amber-500">{mem.topic}</div>
                                    <div className="truncate">{mem.content}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
             )}

            {activeTab === 'ui' && (
                <div className="space-y-6">
                    <h3 className="text-white font-serif text-lg mb-4">General Preferences</h3>
                    <div className="space-y-4">
                         {/* ... UI Settings ... */}
                        <div>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={settings.ui.enableCodingMode} onChange={e => updateUI('enableCodingMode', e.target.checked)} />
                                <div className="ml-3">
                                    <span className="text-white font-bold block">Enable Swarm Coding Mode</span>
                                    <span className="text-xs text-slate-400">Show the developer-focused Swarm Coding mode in the input selector.</span>
                                </div>
                            </label>
                        </div>
                        {settings.ui.enableCodingMode && (
                            <div className="pl-8 pt-2">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-pink-500" checked={settings.ui.proCodingUI || false} onChange={e => updateUI('proCodingUI', e.target.checked)} />
                                    <div className="ml-3">
                                        <span className="text-white font-bold block">Enable Pro Coding UI</span>
                                        <span className="text-xs text-slate-400">Switch to an IDE-style layout when in Swarm Coding mode.</span>
                                    </div>
                                </label>
                            </div>
                        )}
                        <div className="border-t border-slate-700 pt-4">
                            <label className="text-sm text-slate-300 block mb-1">Debate Speed (Delay)</label>
                            <select value={settings.ui.debateDelay} onChange={e => updateUI('debateDelay', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                                <option value={1000}>Fast (1s)</option>
                                <option value={2000}>Normal (2s)</option>
                                <option value={4000}>Slow (4s)</option>
                                <option value={6000}>Contemplative (6s)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-slate-300 block mb-1">Font Size</label>
                            <select value={settings.ui.fontSize} onChange={e => updateUI('fontSize', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white">
                                <option value="small">Compact</option>
                                <option value="medium">Default</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                        <div className="border-t border-slate-700 pt-4">
                             <label className="text-sm text-slate-300 block mb-2">Default View Mode</label>
                             <div className="flex bg-slate-800 rounded p-1 border border-slate-700">
                                 <button onClick={() => updateUI('chatViewMode', 'list')} className={`flex-1 py-1.5 text-xs font-bold rounded ${settings.ui.chatViewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Standard List</button>
                                 <button onClick={() => updateUI('chatViewMode', 'grid')} className={`flex-1 py-1.5 text-xs font-bold rounded ${settings.ui.chatViewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Grid Layout</button>
                             </div>
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
