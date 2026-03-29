import { useState, useCallback } from 'react';
import {
  TabBar,
  DeliberationTab,
  CouncilorsTab,
  ConsensusTab,
  SettingsTab,
  MotionInputBottom,
  CouncilorPickerFAB,
} from './components';
import { DeliberationModeId, councilors } from './data/councilors';

type TabId = 'deliberation' | 'councilors' | 'consensus' | 'settings';

interface Message {
  id: string;
  role: 'councilor' | 'user' | 'system';
  councilorName?: string;
  councilorEmoji?: string;
  councilorColor?: string;
  content: string;
  timestamp: Date;
}

function App() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('deliberation');
  const [selectedCouncilors, setSelectedCouncilors] = useState<number[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  const [consensus, setConsensus] = useState(0);
  const [deliberationMode, setDeliberationMode] = useState<DeliberationModeId>('DELIBERATION');
  const [isProcessing, setIsProcessing] = useState(false);

  // Toggle councilor selection
  const handleToggleCouncilor = useCallback((id: number) => {
    setSelectedCouncilors((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  // Simulate streaming response (demo)
  const simulateStream = useCallback(async (msg: Message, fullContent: string) => {
    setCurrentStreamingId(msg.id);
    let currentContent = '';

    const words = fullContent.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 50));
      currentContent += (i > 0 ? ' ' : '') + words[i];
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, content: currentContent } : m
        )
      );
    }

    setCurrentStreamingId(null);

    const newConsensus = Math.floor(50 + Math.random() * 40);
    setConsensus(newConsensus);
  }, []);

  // Handle motion submission
  const handleSubmitMotion = useCallback(
    async (motion: string, mode: DeliberationModeId, selected: number[]) => {
      setIsProcessing(true);
      setDeliberationMode(mode);
      setConsensus(0);
      setMessages([]);
      setActiveTab('deliberation');

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: motion,
        timestamp: new Date(),
      };
      setMessages([userMsg]);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const selectedCouncilorData = councilors.filter((c) => selected.includes(c.id));
      const systemMsg: Message = {
        id: `system-${Date.now()}`,
        role: 'system',
        content: `Council deliberation initiated with ${selected.length} councilors in ${mode} mode.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMsg]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const responseTemplates = [
        (name: string) => `As the ${name}, I believe this motion raises important considerations that warrant careful analysis. We must weigh the implications carefully.`,
        (name: string) => `${name} here. From my perspective, there are both opportunities and risks to consider. A measured approach would serve us best.`,
        (name: string) => `This is ${name}. I have analyzed the proposal thoroughly. While there are merits, we should address the potential drawbacks before proceeding.`,
        (name: string) => `${name} weighs in: the data suggests we should proceed with caution. Implementation will require careful planning.`,
        (name: string) => `From ${name}'s viewpoint, this aligns with long-term objectives but requires stakeholder buy-in. Consensus building is essential.`,
      ];

      for (let i = 0; i < Math.min(selected.length, 5); i++) {
        const councilor = selectedCouncilorData[i];
        if (!councilor) continue;

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const templateIndex = i % responseTemplates.length;
        const responseContent = responseTemplates[templateIndex](councilor.role);

        const councilorMsg: Message = {
          id: `councilor-${Date.now()}-${i}`,
          role: 'councilor',
          councilorName: councilor.name,
          councilorEmoji: councilor.emoji,
          councilorColor: councilor.color,
          content: '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, councilorMsg]);
        await simulateStream(councilorMsg, responseContent);
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      const synthesisMsg: Message = {
        id: `synthesis-${Date.now()}`,
        role: 'system',
        councilorName: 'Facilitator',
        councilorEmoji: '⚖️',
        councilorColor: '#8B5CF6',
        content: `Deliberation complete. The council has reached ${Math.floor(
          50 + Math.random() * 40
        )}% consensus on this matter. Further deliberation may be warranted.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, synthesisMsg]);
      setIsProcessing(false);
    },
    [simulateStream]
  );

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'deliberation':
        return (
          <DeliberationTab
            messages={messages}
            currentStreamingId={currentStreamingId}
          />
        );
      case 'councilors':
        return (
          <CouncilorsTab
            selectedCouncilors={selectedCouncilors}
            onToggleCouncilor={handleToggleCouncilor}
          />
        );
      case 'consensus':
        return <ConsensusTab consensus={consensus} messages={messages} />;
      case 'settings':
        return (
          <SettingsTab
            deliberationMode={deliberationMode}
            onModeChange={setDeliberationMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        consensus={consensus}
        selectedCount={selectedCouncilors.length}
      />

      {/* Tab Content */}
      <main className="flex-1 overflow-hidden">
        {renderTabContent()}
      </main>

      {/* Bottom Input Bar */}
      <MotionInputBottom
        onSubmit={handleSubmitMotion}
        disabled={isProcessing}
        selectedCouncilors={selectedCouncilors}
        deliberationMode={deliberationMode}
        onModeChange={setDeliberationMode}
      />

      {/* FAB for quick councilor picker */}
      <CouncilorPickerFAB
        selectedCouncilors={selectedCouncilors}
        onToggleCouncilor={handleToggleCouncilor}
      />
    </div>
  );
}

export default App;
