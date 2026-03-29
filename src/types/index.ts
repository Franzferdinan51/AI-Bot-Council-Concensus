export type DeliberationMode = 'legislative' | 'research' | 'swarm';

export interface Councilor {
  id: string;
  name: string;
  emoji: string;
  role: string;
  specialty: string;
  color: string;
  bgColor: string;
  borderColor: string;
  model: string;
  personality: string;
  stance: 'support' | 'oppose' | 'neutral' | 'analyze';
  active: boolean;
  speaking: boolean;
}

export interface Message {
  id: string;
  councilorId: string;
  councilorName: string;
  councilorEmoji: string;
  councilorColor: string;
  role: 'user' | 'councilor' | 'system';
  content: string;
  timestamp: number;
  streaming?: boolean;
}

export interface Motion {
  id: string;
  content: string;
  submittedBy: string;
  timestamp: number;
  votesFor: number;
  votesAgainst: number;
  consensus: number;
  status: 'pending' | 'voting' | 'decided' | 'rejected';
}

export interface CouncilState {
  mode: DeliberationMode;
  isDeliberating: boolean;
  consensusLevel: number;
  activeCouncilors: string[];
  currentMotion: string;
  messages: Message[];
  transcript: string;
}
