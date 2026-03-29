import { useMemo } from 'react';

export type TabId = 'deliberation' | 'councilors' | 'consensus' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'deliberation', label: 'Deliberation', icon: '💬' },
  { id: 'councilors', label: 'Councilors', icon: '👥' },
  { id: 'consensus', label: 'Consensus', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  consensus?: number;
  selectedCount?: number;
}

export function TabBar({ activeTab, onTabChange, consensus = 0, selectedCount = 0 }: TabBarProps) {
  return (
    <header className="flex-none h-[50px] border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex items-end px-4 relative">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-6 pb-1.5">
        <span className="text-xl">🏛️</span>
        <span className="font-bold text-sm text-white hidden sm:block">AI Council</span>
      </div>

      {/* Tabs */}
      <nav className="flex items-end h-full relative">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-3 py-2 text-sm font-medium transition-colors duration-200
                ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
              `}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {tab.id === 'consensus' && consensus > 0 && (
                <span
                  className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: consensus >= 66 ? '#22C55E30' : consensus >= 33 ? '#F59E0B30' : '#EF444430',
                    color: consensus >= 66 ? '#22C55E' : consensus >= 33 ? '#F59E0B' : '#EF4444',
                  }}
                >
                  {consensus}%
                </span>
              )}
              {tab.id === 'councilors' && selectedCount > 0 && (
                <span className="ml-1.5 text-xs font-bold bg-purple-500/30 text-purple-400 px-1.5 py-0.5 rounded-full">
                  {selectedCount}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mode-tab-active"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Status indicators */}
      <div className="ml-auto flex items-center gap-3 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="hidden sm:inline">Pretext Active</span>
        </div>
      </div>
    </header>
  );
}
