import { BotConfig } from '../types/index.js';

// Mock bots based on bots.json
const mockBots: BotConfig[] = [
    { id: 'speaker', name: 'Speaker', role: 'speaker', enabled: true } as BotConfig,
    { id: 'mod', name: 'Moderator', role: 'moderator', enabled: true } as BotConfig,
    { id: 'c1', name: 'Technocrat', role: 'councilor', enabled: false } as BotConfig, // Disabled
    { id: 's1', name: 'Scientist', role: 'specialist', enabled: true } as BotConfig,  // Enabled Specialist
    { id: 's2', name: 'Coder', role: 'specialist', enabled: true } as BotConfig     // Enabled Specialist
];

function getCouncilMembers(allBots: BotConfig[]) {
    const enabledBots = allBots.filter(b => b.enabled);
    const speaker = enabledBots.find(b => b.role === 'speaker');
    const moderator = enabledBots.find(b => b.role === 'moderator');

    // FIXED LOGIC
    const initialCouncilors = enabledBots.filter(b => b.role !== 'speaker' && b.role !== 'moderator');

    return { speaker, moderator, initialCouncilors };
}

console.log('--- Testing Council Selection Logic ---');
const { speaker, moderator, initialCouncilors } = getCouncilMembers(mockBots);

console.log(`Speaker: ${speaker?.name}`);
console.log(`Moderator: ${moderator?.name}`);
console.log(`Councilors Found: ${initialCouncilors.length}`);
initialCouncilors.forEach(c => console.log(` - ${c.name} (${c.role})`));

if (initialCouncilors.length === 0) {
    console.error('FAIL: No councilors found despite enabled specialists!');
    process.exit(1);
} else {
    console.log('SUCCESS: Councilors found.');
}
