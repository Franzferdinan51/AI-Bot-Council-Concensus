import { COUNCIL_SYSTEM_INSTRUCTION, DEFAULT_BOTS, OPENROUTER_MODELS } from '../types/constants.js';

console.log('--- Verifying Configuration Loading ---');

console.log(`Loaded ${DEFAULT_BOTS.length} default bots.`);
if (DEFAULT_BOTS.length > 0) {
    console.log(`First bot: ${DEFAULT_BOTS[0].name} (${DEFAULT_BOTS[0].model})`);
} else {
    console.error('FAILED: No bots loaded.');
    process.exit(1);
}

console.log(`Loaded ${OPENROUTER_MODELS.length} OpenRouter models.`);

if (COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL && COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER) {
    console.log('System instructions loaded successfully.');
    console.log('Snippet of PROPOSAL.SPEAKER:', COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER.substring(0, 100) + '...');

    if (COUNCIL_SYSTEM_INSTRUCTION.PROPOSAL.SPEAKER.includes('PRIME DIRECTIVE')) {
        console.log('SUCCESS: Directives expanded correctly.');
    } else {
        console.error('FAILED: Directives not expanded.');
        process.exit(1);
    }
} else {
    console.error('FAILED: System instructions missing or malformed.');
    process.exit(1);
}

console.log('--- Configuration Verification Complete ---');
