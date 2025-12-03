import { webSearchTool } from '../tools/agentTools/webSearch.js';

async function verifySearch() {
    console.log('--- Verifying Search Providers ---');

    // Test 1: Default (DuckDuckGo)
    console.log('\nTesting Default (DuckDuckGo)...');
    const ddgResult = await webSearchTool.execute({ query: 'latest typescript version' });
    console.log(ddgResult.substring(0, 500) + '...');

    if (ddgResult.includes('DuckDuckGo Search Results')) {
        console.log('SUCCESS: DuckDuckGo search worked.');
    } else {
        console.error('FAILED: DuckDuckGo search failed.');
    }

    // Test 2: Brave (Expect Error without Key)
    console.log('\nTesting Brave (No Key)...');
    process.env.SEARCH_PROVIDER = 'brave';
    const braveResult = await webSearchTool.execute({ query: 'brave search api' });
    console.log(braveResult);

    if (braveResult.includes('BRAVE_API_KEY is not set')) {
        console.log('SUCCESS: Brave correctly reported missing key.');
    } else {
        console.error('FAILED: Brave did not report missing key.');
    }

    // Reset
    delete process.env.SEARCH_PROVIDER;
}

verifySearch().catch(console.error);
