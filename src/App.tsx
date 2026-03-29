import { useState, useEffect, useRef, useCallback } from 'react'
import { councilApi } from './services/apiService'
import { miniMaxService, VOICES, ASPECT_RATIOS } from './services/minimaxService'
import { prepare, layout } from '@chenglou/pretext'

interface Message {
  id: string
  role: 'user' | 'councilor' | 'system'
  content: string
  councilorName?: string
  timestamp: number
  measuredHeight?: number // Pre-measured height in px to prevent reflow
}

// Pre-measure text height without DOM reflow using @chenglou/pretext
function preMeasureHeight(content: string, maxWidth: number, fontSize = 14, lineHeight = 1.5): number {
  if (!content || content.trim() === '') return 0
  if (maxWidth <= 0) return 0
  try {
    const prepared = prepare(content, `${fontSize}px sans-serif`)
    const result = layout(prepared, maxWidth, lineHeight)
    return Math.ceil(result.lineCount * fontSize * lineHeight + 16) // +16px padding
  } catch {
    return 0
  }
}

// Pre-measure a message at creation time
function withPreMeasure(msg: Omit<Message, 'measuredHeight'>, chatWidth: number): Message {
  const isUser = msg.role === 'user'
  const maxWidth = isUser ? chatWidth * 0.85 : chatWidth * 0.85
  return { ...msg, measuredHeight: preMeasureHeight(msg.content, maxWidth) }
}

const COUNCILORS = [
  { id: 'speaker', name: 'Speaker', emoji: '🎙️', specialty: 'Orchestrates debate' },
  { id: 'technocrat', name: 'Technocrat', emoji: '⚙️', specialty: 'Technical analysis' },
  { id: 'ethicist', name: 'Ethicist', emoji: '⚖️', specialty: 'Moral reasoning' },
  { id: 'pragmatist', name: 'Pragmatist', emoji: '🎯', specialty: 'Practical solutions' },
  { id: 'skeptic', name: 'Skeptic', emoji: '🤔', specialty: 'Critical thinking' },
  { id: 'sentinel', name: 'Sentinel', emoji: '🛡️', specialty: 'Risk assessment' },
  { id: 'scientist', name: 'Scientist', emoji: '🔬', specialty: 'Evidence-based' },
  { id: 'economist', name: 'Economist', emoji: '📊', specialty: 'Cost-benefit' },
]

const MODES = [
  { id: 'legislative', name: 'Legislative', emoji: '⚖️', desc: 'Formal debate' },
  { id: 'swarm', name: 'Swarm Coding', emoji: '🐝', desc: 'Parallel dev' },
  { id: 'research', name: 'Deep Research', emoji: '🔬', desc: 'Investigation' },
  { id: 'prediction', name: 'Prediction', emoji: '📊', desc: 'Forecasting' },
  { id: 'inquiry', name: 'Inquiry', emoji: '❓', desc: 'Q&A' },
]

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'deliberate' | 'tts' | 'image' | 'settings'>('home')
  const [topic, setTopic] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMode, setSelectedMode] = useState('legislative')
  const [selectedCouncilors, setSelectedCouncilors] = useState<string[]>(['speaker', 'technocrat'])
  const [inputText, setInputText] = useState('')
  const [isLMStudioOnline, setIsLMStudioOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Chat container width for pre-measuring text (default ~400px, will be updated on mount)
  const [chatWidth, setChatWidth] = useState(400)

  // TTS state
  const [ttsText, setTtsText] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('English_expressive_narrator')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Image state
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageAspect, setImageAspect] = useState('16:9')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    checkLMStudio()
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
  }, [])

  const checkLMStudio = async () => {
    try {
      const res = await fetch('http://localhost:1234/v1/models')
      setIsLMStudioOnline(res.ok)
    } catch {
      setIsLMStudioOnline(false)
    }
  }

  // Deliberation functions
  const startDeliberation = async () => {
    if (!topic.trim() || selectedCouncilors.length === 0) return
    
    setIsLoading(true)
    setMessages([
      withPreMeasure({ id: '1', role: 'system', content: `Starting ${MODES.find(m => m.id === selectedMode)?.name} deliberation...`, timestamp: Date.now() }, chatWidth),
      withPreMeasure({ id: '2', role: 'system', content: `Using: 💻 LM Studio (Free)`, timestamp: Date.now() + 1 }, chatWidth)
    ])
    setCurrentView('deliberate')
    setIsLoading(false)
  }

  const sendMessage = async () => {
    if (!inputText.trim()) return
    
    setIsLoading(true)
    const userMsg: Message = withPreMeasure({ id: Date.now().toString(), role: 'user', content: inputText, timestamp: Date.now() }, chatWidth)
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    
    try {
      const councilor = COUNCILORS.find(c => c.id === selectedCouncilors[0])
      const systemPrompt = `You are ${councilor?.name} in an AI Council. Topic: "${topic}". Mode: ${selectedMode}. Be thoughtful.`
      
      const response = await councilApi.sendMessage(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: inputText }],
        councilor?.name || 'Councilor'
      )

      const councilorMsg: Message = withPreMeasure({
        id: (Date.now() + 1).toString(),
        role: 'councilor',
        content: response,
        councilorName: councilor?.name,
        timestamp: Date.now(),
      }, chatWidth)
      setMessages(prev => [...prev, councilorMsg])
    } catch (error: any) {
      setMessages(prev => [...prev, withPreMeasure({
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `❌ ${error.message}`,
        timestamp: Date.now()
      }, chatWidth)])
    }
    
    setIsLoading(false)
  }

  const toggleCouncilor = (id: string) => {
    setSelectedCouncilors(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  // TTS functions
  const handleSpeak = async () => {
    if (!ttsText.trim() || isSpeaking) return
    
    setIsSpeaking(true)
    try {
      const result = await miniMaxService.textToSpeech(ttsText, selectedVoice)
      setCurrentAudioUrl(result.audioUrl)
      
      if (audioRef.current) {
        audioRef.current.src = result.audioUrl
        audioRef.current.play()
      }
    } catch (error: any) {
      console.error('TTS Error:', error)
      alert(`TTS Error: ${error.message}`)
    }
    setIsSpeaking(false)
  }

  // Image functions
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGenerating) return
    
    setIsGenerating(true)
    setGeneratedImages([])
    
    try {
      const result = await miniMaxService.generateImage(imagePrompt, imageAspect, 1)
      setGeneratedImages(result.urls)
    } catch (error: any) {
      console.error('Image Error:', error)
      alert(`Image Error: ${error.message}`)
    }
    
    setIsGenerating(false)
  }

  return (
    <div className="h-full h-[100dvh] flex flex-col bg-[#0a0c10] text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-[#0a0c10] border-b border-slate-800 safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-amber-500">🏛️ AI Council</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isLMStudioOnline ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {isLMStudioOnline ? '💻 LM' : '☁️ Cloud'}
            </span>
          </div>
          <button onClick={() => setCurrentView('settings')} className="p-2 rounded-lg hover:bg-slate-800">⚙️</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Home */}
        {currentView === 'home' && (
          <div className="p-4 space-y-4">
            {/* MiniMax Banner */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✨</span>
                <span className="font-bold text-purple-400">MiniMax Plus Active</span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div>🎤 Speech: 4,000 chars/day</div>
                <div>🖼️ Images: 50/day</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCurrentView('tts')}
                className="p-4 rounded-xl bg-gradient-to-br from-pink-900/50 to-purple-900/50 border border-pink-500/30 hover:border-pink-500/50 transition-touch"
              >
                <div className="text-2xl mb-1">🎤</div>
                <div className="text-sm font-medium">Text-to-Speech</div>
                <div className="text-xs text-slate-400">4,000 chars/day</div>
              </button>
              <button
                onClick={() => setCurrentView('image')}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border border-blue-500/30 hover:border-blue-500/50 transition-touch"
              >
                <div className="text-2xl mb-1">🖼️</div>
                <div className="text-sm font-medium">Image Gen</div>
                <div className="text-xs text-slate-400">50 images/day</div>
              </button>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Topic</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should we deliberate on?"
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500/50"
                rows={3}
              />
            </div>

            {/* Mode */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-3 rounded-xl border text-left transition-touch ${
                      selectedMode === mode.id ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="text-lg">{mode.emoji}</div>
                    <div className="text-sm font-medium mt-1">{mode.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Councilors */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Councilors ({selectedCouncilors.length})</label>
              <div className="grid grid-cols-2 gap-2">
                {COUNCILORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleCouncilor(c.id)}
                    className={`p-3 rounded-xl border text-left transition-touch ${
                      selectedCouncilors.includes(c.id) ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start */}
            <button
              onClick={startDeliberation}
              disabled={!topic.trim() || selectedCouncilors.length === 0}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold text-lg transition-touch"
            >
              🚀 Start Deliberation
            </button>
          </div>
        )}

        {/* Deliberate */}
        {currentView === 'deliberate' && (
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
              <span className="text-xs text-slate-400">Topic: <span className="text-amber-400">{topic}</span></span>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' ? 'bg-amber-600 text-white rounded-br-md' :
                      msg.role === 'system' ? 'bg-slate-800 text-slate-400 text-sm text-center w-full' :
                      'bg-slate-800 rounded-bl-md'
                    }`}
                    style={msg.measuredHeight ? { minHeight: `${msg.measuredHeight}px` } : undefined}
                  >
                    {msg.role === 'councilor' && (
                      <div className="text-xs text-amber-400 font-medium mb-1">{msg.councilorName}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-none p-4 border-t border-slate-800 safe-bottom">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                  placeholder="Add to deliberation..."
                  className="flex-1 p-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <button onClick={sendMessage} disabled={isLoading} className="p-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 rounded-xl">➤</button>
              </div>
            </div>
          </div>
        )}

        {/* TTS */}
        {currentView === 'tts' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-purple-400">🎤 Text-to-Speech</h2>
              <span className="text-xs text-slate-400">4,000 chars/day</span>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none"
              >
                {VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name} ({voice.lang})</option>
                ))}
              </select>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Text ({ttsText.length} chars)</label>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none"
                rows={5}
              />
              <div className="text-xs text-slate-500 text-right">{4000 - ttsText.length} remaining</div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleSpeak}
              disabled={!ttsText.trim() || isSpeaking}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-bold text-lg transition-touch"
            >
              {isSpeaking ? '🎵 Generating...' : '🎤 Generate Speech'}
            </button>

            {/* Audio Player */}
            {currentAudioUrl && (
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <audio ref={audioRef} controls className="w-full" />
              </div>
            )}
          </div>
        )}

        {/* Image Generation */}
        {currentView === 'image' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-400">🖼️ Image Generation</h2>
              <span className="text-xs text-slate-400">50 images/day</span>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.slice(0, 4).map(ratio => (
                  <button
                    key={ratio.id}
                    onClick={() => setImageAspect(ratio.id)}
                    className={`p-2 rounded-lg border text-center text-xs transition-touch ${
                      imageAspect === ratio.id ? 'border-blue-500 bg-blue-500/20' : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    <div className="text-lg">{ratio.icon}</div>
                    <div>{ratio.id}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 font-medium">Prompt</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none"
                rows={3}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateImage}
              disabled={!imagePrompt.trim() || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-bold text-lg transition-touch"
            >
              {isGenerating ? '🖼️ Generating...' : '🖼️ Generate Image'}
            </button>

            {/* Generated Images */}
            {generatedImages.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm text-slate-400 font-medium">Generated</label>
                <div className="grid gap-4">
                  {generatedImages.map((url, i) => (
                    <img key={i} src={url} alt={`Generated ${i + 1}`} className="w-full rounded-xl" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {currentView === 'settings' && (
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-bold text-amber-500">⚙️ Settings</h2>
            
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-3">✨ MiniMax Plus</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>🎤 Speech</span>
                  <span className="text-green-400">4,000 chars/day</span>
                </div>
                <div className="flex justify-between">
                  <span>🖼️ Images</span>
                  <span className="text-green-400">50/day</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-medium text-slate-400 mb-2">🔌 Status</h3>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isLMStudioOnline ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                <span>{isLMStudioOnline ? 'LM Studio Online (Free)' : 'Using Cloud API'}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="flex-none bg-[#0a0c10] border-t border-slate-800 safe-bottom">
        <div className="flex justify-around py-2">
          {[
            { id: 'home', icon: '🏛️', label: 'Home' },
            { id: 'deliberate', icon: '💬', label: 'Chat' },
            { id: 'tts', icon: '🎤', label: 'Speech' },
            { id: 'image', icon: '🖼️', label: 'Image' },
            { id: 'settings', icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg ${currentView === item.id ? 'text-amber-500' : 'text-slate-400'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
