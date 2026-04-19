/**
 * OrchestrationPanel.tsx
 * Advanced orchestration control panel for AI Council
 * 
 * Features:
 * - Pattern selector (5 coordination patterns)
 * - Meta-agent toggle (Plan/Execute/Critic/Heal/Learn cycle)
 * - Quality gate configuration
 * - Dynamic councilor selection preview
 * - Live orchestration status
 * - Concurrency and delay controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BotConfig, Settings, SessionMode, Message } from '../types';
import { CoordinationPattern, OrchestratorSession } from '../services/CouncilOrchestrationService';
import { CouncilOrchestrationService } from '../services/CouncilOrchestrationService';

// Minimal types for the service (we import it from the service file)
interface OrchDashboard {
  activeSession: OrchestratorSession | null;
  eventLogCount: number;
  sharedStateKeys: string[];
  patterns: CoordinationPattern[];
}

interface OrchestrationPanelProps {
  enabledCouncilors: BotConfig[];
  settings: Settings;
  sessionMode: SessionMode;
  onOrchestratorReady?: (service: CouncilOrchestrationService, selectCouncilors: (topic: string) => BotConfig[], runByPattern: any) => void;
}

const PATTERN_DESCRIPTIONS = {
  'orchestrator-subagent': { icon: '🎛️', label: 'Orchestrator-Subagent', desc: 'Hierarchical task decomposition with leader dispatching sub-tasks', best: 'Swarm Coding, Government, Research' },
  'agent-teams': { icon: '👥', label: 'Agent Teams', desc: 'Parallel independent agents executing simultaneously', best: 'Swarm Hive, Prediction' },
  'generator-verifier': { icon: '🔄', label: 'Generator-Verifier', desc: 'Generate → Quality gate → Retry loop until verified', best: 'Inspector, Prediction' },
  'message-bus': { icon: '🚌', label: 'Message Bus', desc: 'Event-driven pipeline with pub/sub and async triggers', best: 'Inquiry, Emergency' },
  'shared-state': { icon: '📊', label: 'Shared State', desc: 'Collaborative building with shared memory and incremental progress', best: 'Proposal, Deliberation' },
};

const MODE_LABELS: Record<string, string> = {
  [SessionMode.PROPOSAL]: '⚖️ Proposal',
  [SessionMode.DELIBERATION]: '🗣️ Deliberation',
  [SessionMode.INQUIRY]: '🔍 Inquiry',
  [SessionMode.RESEARCH]: '📊 Deep Research',
  [SessionMode.SWARM]: '🐝 Swarm Hive',
  [SessionMode.SWARM_CODING]: '⚡ Swarm Coding',
  [SessionMode.PREDICTION]: '🎯 Prediction',
  [SessionMode.GOVERNMENT]: '🏛️ Legislature',
  [SessionMode.INSPECTOR]: '🔬 Inspector',
};

const OrchestrationPanel: React.FC<OrchestrationPanelProps> = ({
  enabledCouncilors,
  settings,
  sessionMode,
  onOrchestratorReady,
}) => {
  const [pattern, setPattern] = useState<CoordinationPattern>('orchestrator-subagent');
  const [metaAgentEnabled, setMetaAgentEnabled] = useState(true);
  const [qualityGatesEnabled, setQualityGatesEnabled] = useState(true);
  const [sharedMemoryEnabled, setSharedMemoryEnabled] = useState(true);
  const [maxConcurrency, setMaxConcurrency] = useState(2);
  const [debateDelay, setDebateDelay] = useState(1500);
  const [selectedCouncilors, setSelectedCouncilors] = useState<BotConfig[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [orchestrationStatus, setOrchestrationStatus] = useState<{
    phase: string;
    tasksTotal: number;
    tasksDone: number;
    qualityAvg: number;
    metaCycles: number;
  } | null>(null);
  const [topic, setTopic] = useState('');

  const [service] = useState(() => new CouncilOrchestrationService());

  // Subscribe to orchestration events
  useEffect(() => {
    const unsubPhase = service.onEvent('phase', (e) => {
      setOrchestrationStatus(prev => ({ ...(prev || { phase: '', tasksTotal: 0, tasksDone: 0, qualityAvg: 0, metaCycles: 0 }), phase: e.data.phase }));
    });
    const unsubTask = service.onEvent('task', (e) => {
      setOrchestrationStatus(prev => {
        const tasksDone = (prev?.tasksDone || 0) + (e.data.status === 'done' ? 1 : 0);
        const qualityAvg = e.data.quality || prev?.qualityAvg || 0;
        return { ...(prev || { phase: '', tasksTotal: 0, tasksDone: 0, qualityAvg: 0, metaCycles: 0 }), tasksDone, qualityAvg };
      });
    });
    const unsubMeta = service.onEvent('meta', (e) => {
      setOrchestrationStatus(prev => ({ ...(prev || { phase: '', tasksTotal: 0, tasksDone: 0, qualityAvg: 0, metaCycles: 0 }), metaCycles: (prev?.metaCycles || 0) + 1 }));
    });
    const unsubCouncilor = service.onEvent('councilor', (e) => {
      // Show selected councilors with scores
      setSelectedCouncilors(e.data.selected || []);
    });

    return () => { unsubPhase(); unsubTask(); unsubMeta(); unsubCouncilor(); };
  }, [service]);

  // Notify parent when service is ready
  useEffect(() => {
    if (onOrchestratorReady) {
      onOrchestratorReady(
        service,
        (t: string) => service.selectCouncilorsForTopic(enabledCouncilors, t, sessionMode),
        (topic: string, councilors: BotConfig[], speaker: BotConfig | undefined, history: Message[], settings: Settings, mode: SessionMode, injectTopic: (t: string) => string, processBotTurn: any) =>
          service.runByPattern(topic, councilors, speaker, history, settings, mode, injectTopic, processBotTurn)
      );
    }
  }, [service, enabledCouncilors, sessionMode, onOrchestratorReady]);

  const handlePreviewCouncilors = useCallback(() => {
    if (!topic.trim()) return;
    const selected = service.selectCouncilorsForTopic(enabledCouncilors, topic, sessionMode);
    setSelectedCouncilors(selected);
  }, [service, enabledCouncilors, topic, sessionMode]);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'plan': return 'text-blue-400';
      case 'execute': return 'text-green-400';
      case 'critic': return 'text-yellow-400';
      case 'heal': return 'text-orange-400';
      case 'learn': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const inferredPattern = service.getSession()?.pattern || pattern;

  if (!showPanel) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/40">
        <span className="text-xs text-slate-400">Orchestration:</span>
        <span className="text-xs text-cyan-400 font-mono">{PATTERN_DESCRIPTIONS[inferredPattern]?.icon} {PATTERN_DESCRIPTIONS[inferredPattern]?.label}</span>
        {metaAgentEnabled && <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">🧠 Meta</span>}
        {qualityGatesEnabled && <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">✅ Quality</span>}
        <button
          onClick={() => setShowPanel(true)}
          className="text-xs text-slate-400 hover:text-white transition-colors ml-1"
        >
          [Configure]
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          🎛️ Orchestration Engine
        </h3>
        <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white text-xs">
          [Collapse]
        </button>
      </div>

      {/* Topic + Preview */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter topic to preview councilor selection..."
            className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={handlePreviewCouncilors}
            className="px-3 py-1.5 bg-cyan-600/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 hover:bg-cyan-600/30 transition-colors"
          >
            Preview
          </button>
        </div>

        {/* Selected Councilors Preview */}
        {selectedCouncilors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedCouncilors.map((c) => (
              <div key={c.id} className={`px-2 py-0.5 rounded-full text-xs bg-gradient-to-r ${c.color || 'from-slate-500 to-slate-600'} text-white opacity-90`}>
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pattern Selector */}
      <div className="space-y-1.5">
        <label className="text-xs text-slate-400 font-medium">Coordination Pattern</label>
        <div className="grid grid-cols-1 gap-1.5">
          {(Object.entries(PATTERN_DESCRIPTIONS) as [string, { icon: string; label: string; desc: string; best: string }][]).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setPattern(key)}
              className={`text-left px-3 py-2 rounded-lg border transition-all text-xs ${
                pattern === key
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white'
                  : 'bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{p.icon}</span>
                <span className="font-medium text-white">{p.label}</span>
                {pattern === key && <span className="ml-auto text-cyan-400">●</span>}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 ml-6">
                {p.desc} — <span className="text-slate-400">Best for: {p.best}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Recommendation */}
      <div className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
        <span className="text-xs text-slate-400">Recommended for <span className="text-white">{MODE_LABELS[sessionMode]}</span>:</span>
        <span className="text-xs font-mono text-cyan-400">{PATTERN_DESCRIPTIONS[inferredPattern]?.icon} {PATTERN_DESCRIPTIONS[inferredPattern]?.label}</span>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-3 gap-2">
        <Toggle label="🧠 Meta-Agent" checked={metaAgentEnabled} onChange={setMetaAgentEnabled} desc="Plan→Execute→Critic→Heal→Learn" />
        <Toggle label="✅ Quality Gates" checked={qualityGatesEnabled} onChange={setQualityGatesEnabled} desc="Auto-retry on low quality" />
        <Toggle label="📊 Shared Memory" checked={sharedMemoryEnabled} onChange={setSharedMemoryEnabled} desc="Cross-councilor context" />
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-3">
        <Slider label="Concurrency" value={maxConcurrency} min={1} max={6} step={1} onChange={setMaxConcurrency} display={`${maxConcurrency} agents`} />
        <Slider label="Debate Delay" value={debateDelay} min={500} max={5000} step={500} onChange={setDebateDelay} display={`${(debateDelay/1000).toFixed(1)}s`} />
      </div>

      {/* Live Status */}
      {orchestrationStatus && (
        <div className="bg-slate-800/60 rounded-lg p-3 space-y-1.5">
          <div className="text-xs text-slate-400 font-medium">Live Orchestration Status</div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <StatusBadge label="Phase" value={orchestrationStatus.phase} color={getPhaseColor(orchestrationStatus.phase)} />
            <StatusBadge label="Tasks" value={`${orchestrationStatus.tasksDone}/${orchestrationStatus.tasksTotal}`} />
            <StatusBadge label="Quality" value={orchestrationStatus.qualityAvg ? `${Math.round(orchestrationStatus.qualityAvg)}%` : '—'} />
            <StatusBadge label="Meta" value={String(orchestrationStatus.metaCycles)} />
            <StatusBadge label="Pattern" value={inferredPattern.split('-')[0]} />
          </div>
        </div>
      )}

      {/* Meta-Agent Phase Legend */}
      {metaAgentEnabled && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {(['plan', 'execute', 'critic', 'heal', 'learn'] as const).map((phase) => (
            <div key={phase} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${getPhaseColor(phase)} bg-slate-800/60`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {phase.charAt(0).toUpperCase() + phase.slice(1)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; desc: string }> = ({ label, checked, onChange, desc }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`text-left px-2 py-1.5 rounded-lg border transition-all ${checked ? 'bg-green-500/20 border-green-500/40' : 'bg-slate-800/40 border-slate-700/30'}`}
  >
    <div className="text-xs font-medium text-white">{label}</div>
    <div className="text-[10px] text-slate-500">{desc}</div>
  </button>
);

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string }> = ({ label, value, min, max, step, onChange, display }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-400">{label}</span>
      <span className="text-cyan-400 font-mono">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
    />
  </div>
);

const StatusBadge: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color = 'text-white' }) => (
  <div className="bg-slate-900/60 rounded-lg py-1.5">
    <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
    <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
  </div>
);

export default OrchestrationPanel;
