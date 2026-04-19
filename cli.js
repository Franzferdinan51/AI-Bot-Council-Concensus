#!/usr/bin/env node

/**
 * AI Council CLI - Use the council from command line
 * Usage: node cli.js "Your question here"
 */

const API_URL = process.env.COUNCIL_API || 'http://localhost:3000/api';

const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
🤖 AI Council CLI

Usage: node cli.js [options] "Your question"

Options:
  --mode <mode>     Set deliberation mode (deliberation, inquiry, proposal, swarm)
  --list            List available councilors
  --status          Check council status
  --clear           Clear session
  --help            Show this help

Examples:
  node cli.js "What is the meaning of life?"
  node cli.js --mode swarm "Fix this bug in my code"
  node cli.js --list
  `);
    process.exit(0);
}

async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_URL}${endpoint}`, opts);
        return await res.json();
    } catch (e) {
        console.error('API Error:', e.message);
        return null;
    }
}

async function main() {
    // Handle flags
    if (args.includes('--help')) {
        console.log(`
🤖 AI Council CLI

Usage: node cli.js [options] "Your question"

Options:
  --mode <mode>     Set deliberation mode (deliberation, inquiry, proposal, swarm)
  --list            List available councilors
  --status          Check council status
  --clear           Clear session
  --help            Show this help
`);
        process.exit(0);
    }

    if (args.includes('--list')) {
        const councilors = await apiCall('/councilors');
        console.log('\n📜 Available Councilors:\n');
        councilors.forEach(c => {
            console.log(`  ${c.enabled ? '✅' : '❌'} ${c.name} (${c.role})`);
        });
        process.exit(0);
    }

    if (args.includes('--status')) {
        const status = await apiCall('/status');
        console.log('\n⚡ Council Status:');
        console.log(`  Mode: ${status.mode}`);
        console.log(`  Active: ${status.activeCouncilors} councilors`);
        console.log(`  Messages: ${status.messageCount}`);
        process.exit(0);
    }

    if (args.includes('--clear')) {
        await apiCall('/clear', 'POST');
        console.log('✅ Session cleared');
        process.exit(0);
    }

    // Find the question (everything not starting with --)
    const question = args.filter(a => !a.startsWith('--')).join(' ');
    const modeIndex = args.indexOf('--mode');
    const mode = modeIndex >= 0 ? args[modeIndex + 1] : 'deliberation';

    if (!question) {
        console.error('❌ Please provide a question');
        process.exit(1);
    }

    console.log(`\n🗣️  Asking: "${question}"`);
    console.log(`📌 Mode: ${mode}\n`);

    const response = await apiCall('/deliberate', 'POST', { 
        question, 
        mode 
    });

    if (response) {
        console.log('💬 Council Response:\n');
        console.log(response.result || response);
    }
}

main();
