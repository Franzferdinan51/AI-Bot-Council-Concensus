
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, AuthorType, BotConfig, Settings, Attachment } from '../types';
import { VOICE_MAP, PUBLIC_MCP_REGISTRY } from '../constants';
import { searchBotContext } from './knowledgeService';

// --- HELPER: RANDOM JITTER DELAY ---
const waitWithJitter = (minMs: number, maxMs: number) => {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
};

// --- TOOL EXECUTION LOGIC (CLIENT SIDE) ---
const executePublicTool = async (name: string, args: any): Promise<any> => {
    console.log(`Executing Public Tool: ${name}`, args);
    try {
        switch (name) {
            case 'fetch_website':
                 try {
                     const res = await fetch(args.url);
                     if (!res.ok) throw new Error(`HTTP ${res.status}`);
                     const text = await res.text();
                     // Basic HTML to text (naïve)
                     const doc = new DOMParser().parseFromString(text, 'text/html');
                     return { content: doc.body.innerText.substring(0, 5000) }; // Limit context
                 } catch (e) {
                     return { error: `Failed to fetch URL (CORS or Network error): ${e}` };
                 }

            case 'web_search':
                // Simulation / Fallback for Local Models that can't use GoogleSearch
                return { result: `[Web Search Simulation]: Searched for "${args.query}". Please use Gemini models for live Google Search access.` };

            case 'read_github_content':
                try {
                    const { owner, repo, path = '', branch } = args;
                    let apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
                    if (branch) apiUrl += `?ref=${branch}`;
                    
                    const ghRes = await fetch(apiUrl, {
                        headers: { 'Accept': 'application/vnd.github.v3+json' }
                    });
                    
                    if (!ghRes.ok) throw new Error(`GitHub API ${ghRes.status}: ${ghRes.statusText}`);
                    const data = await ghRes.json();
                    
                    if (Array.isArray(data)) {
                        // Directory listing
                        return {
                            type: 'directory',
                            items: data.map((item: any) => ({
                                name: item.name,
                                type: item.type,
                                path: item.path
                            }))
                        };
                    } else if (data.content && data.encoding === 'base64') {
                        // File content
                        // Handle unicode decoding correctly
                        const text = decodeURIComponent(escape(atob(data.content)));
                        return {
                            type: 'file',
                            path: data.path,
                            content: text.substring(0, 20000) // Safety limit
                        };
                    } else {
                        return { error: "Unknown response format from GitHub." };
                    }
                } catch (e: any) {
                    return { error: `GitHub Read Failed: ${e.message}` };
                }

            case 'get_weather':
                const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&current=temperature_2m,wind_speed_10m`);
                return await weatherRes.json();
            
            case 'get_crypto_price':
                const coin = args.coinId.toLowerCase();
                const cryptoRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
                return await cryptoRes.json();
            
            case 'search_wikipedia':
                const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.query)}`);
                const wikiData = await wikiRes.json();
                return { title: wikiData.title, extract: wikiData.extract, url: wikiData.content_urls?.desktop?.page };
                
            case 'get_current_time':
                return { time: new Date().toLocaleString('en-US', { timeZone: args.timezone }) };
            
            case 'get_github_user':
                try {
                    const ghRes = await fetch(`https://api.github.com/users/${args.username}`);
                    if (!ghRes.ok) return { error: `GitHub API Error: ${ghRes.status}` };
                    const ghData = await ghRes.json();
                    return {
                        login: ghData.login,
                        name: ghData.name,
                        bio: ghData.bio,
                        public_repos: ghData.public_repos,
                        followers: ghData.followers,
                        url: ghData.html_url
                    };
                } catch (e: any) {
                    return { error: `GitHub Fetch Failed: ${e.message}` };
                }

            case 'math_evaluate':
                try {
                    // Safety check: only allow numbers, operators, and parenthesis
                    if (!/^[0-9+\-*/().\s]*$/.test(args.expression)) {
                        return { error: "Unsafe characters in expression." };
                    }
                    // Evaluate using Function constructor (sandbox-ish)
                    const result = new Function(`return ${args.expression}`)();
                    return { result: result };
                } catch (e: any) {
                    return { error: `Math Evaluation Failed: ${e.message}` };
                }

            case 'get_random_identity':
                try {
                    const nat = args.nationality ? `&nat=${args.nationality}` : '';
                    const randRes = await fetch(`https://randomuser.me/api/?inc=name,location,email,login${nat}`);
                    const randData = await randRes.json();
                    const user = randData.results[0];
                    return {
                        name: `${user.name.first} ${user.name.last}`,
                        location: `${user.location.city}, ${user.location.country}`,
                        email: user.email,
                        username: user.login.username
                    };
                } catch (e: any) {
                    return { error: `Random Identity Failed: ${e.message}` };
                }
                
            default:
                return { error: `Tool ${name} not found locally.` };
        }
    } catch (e: any) {
        return { error: `Tool execution failed: ${e.message}` };
    }
};

// --- COST SAVING: CONTEXT PRUNING ---
const pruneHistory = (history: Message[], settings: Settings): Message[] => {
    if (!settings.cost.contextPruning || history.length <= settings.cost.maxContextTurns) {
        return history;
    }

    const preservedHistory: Message[] = [];
    
    if (history.length > 0 && history[0].authorType === AuthorType.SYSTEM) {
        preservedHistory.push(history[0]);
    }

    const lastN = history.slice(-settings.cost.maxContextTurns);
    
    lastN.forEach(msg => {
        if (!preservedHistory.find(m => m.id === msg.id)) {
            preservedHistory.push(msg);
        }
    });

    return preservedHistory;
};


// Helper to format chat history for Gemini
const formatHistoryForGemini = (history: Message[], settings: Settings) => {
  const prunedHistory = pruneHistory(history, settings);

  const contents = prunedHistory.map(msg => {
    const role: 'user' | 'model' = (msg.authorType === AuthorType.HUMAN || msg.authorType === AuthorType.SYSTEM) ? 'user' : 'model';
    
    // SAFETY: Default to empty string if content is missing/undefined
    const rawContent = msg.content || "";
    const cleanContent = rawContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
    
    // Construct the text part
    let text = `${msg.author} (${msg.roleLabel || 'Member'}): ${cleanContent}`;
    
    // SAFETY: Strictly ensure 'text' is never falsy. 
    // Gemini 400 error occurs if 'parts' contains an object like {} (which happens if text is undefined)
    // or if the text is empty/whitespace only in some contexts.
    if (!text || !text.trim()) {
        text = `${msg.author} (${msg.roleLabel || 'Member'}): (Silent/No Content)`;
    }

    if (msg.attachments && msg.attachments.length > 0) {
        const links = msg.attachments.filter(a => a.type === 'link').map(a => a.data).join(', ');
        if (links) {
            text += `\n\n[URGENT SYSTEM INSTRUCTION: The user has provided external sources via URL: ${links}.`;
            text += `\n1. You MUST use the 'googleSearch' tool IMMEDIATELY to access these URLs.`;
            text += `\n2. First, FETCH and SUMMARIZE the content of the link in your <thinking> block before answering.`;
            text += `\n3. Do NOT hallucinate the content. If you cannot access the specific URL directly, search for the page title or video ID to find a summary/transcript.`;
            
            if (links.includes('youtube.com') || links.includes('youtu.be')) {
                 text += `\n4. FOR YOUTUBE VIDEOS: You CANNOT watch the video directly. You MUST perform a Google Search for "transcript of youtube video ${links}" or "summary of youtube video ${links}" or the video title to understand its actual content. Extract the title and key arguments.`;
            }
            text += `]`;
        }
    }
    
    const parts: any[] = [{ text }];
    
    if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
            if (att.type === 'file' && att.mimeType && att.data) {
                parts.push({
                    inlineData: {
                        mimeType: att.mimeType,
                        data: att.data
                    }
                });
            }
        });
    }

    return { role, parts };
  });

  const mergedContents: { role: string; parts: any[] }[] = [];
  if (contents.length > 0) {
      let lastMessage = { ...contents[0] };
      for (let i = 1; i < contents.length; i++) {
        if (lastMessage.role === contents[i].role) {
            // Merge parts if same role to avoid Gemini "Consecutive user turns" error (though we handle roles well now)
            lastMessage.parts = [...lastMessage.parts, ...contents[i].parts];
        } else {
            mergedContents.push(lastMessage);
            lastMessage = { ...contents[i] };
        }
      }
      mergedContents.push(lastMessage);
  }

  // Gemini requires the LAST message to be from 'user'. If it's 'model', prompt it to continue.
  if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === 'model') {
    mergedContents.push({ role: 'user', parts: [{ text: "The floor is yours. Please proceed." }] });
  }

  return mergedContents;
};

// Helper for OpenAI / OpenRouter / LM Studio
const formatHistoryForOpenAI = (history: Message[], settings: Settings) => {
    const prunedHistory = pruneHistory(history, settings);
    return prunedHistory.map(msg => {
        const cleanContent = (msg.content || "").replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        let content = `${msg.author}: ${cleanContent}`;
        if (!content.trim()) content = `${msg.author}: (No content)`;
        
        const links = msg.attachments?.filter(a => a.type === 'link').map(a => a.data).join(', ');
        if (links) content += `\n[Context URLs: ${links}]`;
        
        return {
            role: (msg.authorType === AuthorType.HUMAN || msg.authorType === AuthorType.SYSTEM) ? 'user' : 'assistant',
            content
        };
    });
};

const injectMCPContext = (systemPrompt: string, settings: Settings, bot: BotConfig, lastUserMessage: string): string => {
    let finalPrompt = systemPrompt;

    const memoryContext = searchBotContext(bot.id, lastUserMessage);
    if (memoryContext) {
        finalPrompt += memoryContext;
    }

    if (!settings.mcp.enabled) return finalPrompt;
    return finalPrompt;
};

export const transcribeAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const buffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
                { text: "Transcribe this audio exactly as spoken." }
            ]
        }
    });

    return response.text || "";
};

export const generateSpeech = async (text: string, botRole: string, apiKey: string): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        let voiceName = 'Zephyr';
        const roleKey = Object.keys(VOICE_MAP).find(k => botRole.toLowerCase().includes(k));
        if (roleKey) voiceName = VOICE_MAP[roleKey];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName }
                    }
                }
            }
        });

        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS Generation failed:", e);
        return null;
    }
};

export const streamBotResponse = async (
    bot: BotConfig,
    history: Message[],
    baseSystemInstruction: string,
    settings: Settings,
    onChunk: (text: string) => void
): Promise<string> => {
    
    let effectiveModel = bot.model;
    let effectiveSystemPrompt = baseSystemInstruction;
    
    if (settings.cost.economyMode && bot.role !== 'speaker') {
        effectiveModel = 'gemini-2.5-flash';
        effectiveSystemPrompt += "\n\n[ECONOMY MODE ACTIVE: Be concise. Skip pleasantries. Use standard logic, no advanced reasoning required.]";
    }

    const lastUserMsg = history.filter(m => m.authorType === AuthorType.HUMAN || m.authorType === AuthorType.SYSTEM).pop()?.content || "";
    const systemPrompt = injectMCPContext(effectiveSystemPrompt, settings, bot, lastUserMsg);

    await waitWithJitter(200, 800);

    if (bot.authorType === AuthorType.GEMINI) {
        const apiKey = settings.providers.geminiApiKey || process.env.API_KEY;
        if (!apiKey) throw new Error("Gemini API Key missing.");

        const ai = new GoogleGenAI({ apiKey });
        const config: any = { 
            systemInstruction: systemPrompt,
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
            ]
        };

        if (effectiveModel.includes('gemini-3-pro')) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        const tools: any[] = [];
        const functionDeclarations: any[] = [];
        
        if (settings.mcp.enabled) {
            
            if (settings.mcp.publicToolIds && settings.mcp.publicToolIds.length > 0) {
                const publicTools = PUBLIC_MCP_REGISTRY.filter(t => settings.mcp.publicToolIds?.includes(t.id));
                publicTools.forEach(t => {
                    if (t.functionDeclaration) functionDeclarations.push(t.functionDeclaration);
                });
            }

            if (settings.mcp.customTools && settings.mcp.customTools.length > 0) {
                 settings.mcp.customTools.forEach(t => {
                     try {
                        const schema = JSON.parse(t.schema);
                        functionDeclarations.push({
                            name: t.name,
                            description: t.description,
                            parameters: schema
                        });
                     } catch (e) {
                         console.error("Invalid JSON Schema for tool:", t.name);
                     }
                 });
            }
        }

        // CRITICAL FIX: Ensure mutual exclusivity between Google Search and Function Declarations.
        // Mixing them often causes 400 Bad Request on specific Gemini models.
        if (functionDeclarations.length > 0) {
            tools.push({ functionDeclarations });
        } else {
            tools.push({ googleSearch: {} });
        }
        
        config.tools = tools;

        let currentHistory: { role: string; parts: any[] }[] = formatHistoryForGemini(history, settings);
        let maxTurns = 5; 
        let finalFullText = "";
        let finalSources: string[] = [];

        while (maxTurns > 0) {
            maxTurns--;
            try {
                const result = await ai.models.generateContentStream({
                    model: effectiveModel,
                    contents: currentHistory,
                    config
                });

                let chunkText = "";
                let functionCalls: any[] = [];
                
                for await (const chunk of result) {
                    const text = chunk.text; 
                    if (text) {
                        chunkText += text;
                        finalFullText += text;
                        onChunk(finalFullText);
                    }
                    
                    const chunkSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
                        ?.map((c: any) => c.web ? `• ${c.web.title}: ${c.web.uri}` : null)
                        .filter(Boolean);
                    if (chunkSources) finalSources.push(...chunkSources);

                    const calls = chunk.functionCalls;
                    if (calls) functionCalls.push(...calls);
                }
                
                if (functionCalls.length === 0) {
                    const uniqueSources = Array.from(new Set(finalSources));
                    if (uniqueSources.length > 0) {
                        const sourceText = `\n\n**Verified Sources:**\n${uniqueSources.join('\n')}`;
                        finalFullText += sourceText;
                        onChunk(finalFullText);
                    }
                    // SAFETY: If the model returned absolutely nothing (no text, no calls), return a placeholder.
                    // This prevents empty strings in history.
                    if (!finalFullText.trim()) return "(No response generated)";
                    return finalFullText;
                }

                onChunk(finalFullText + "\n\n[Using Tools...]");
                
                currentHistory.push({
                    role: 'model',
                    parts: [{ functionCalls: functionCalls }]
                });

                const functionResponses: any[] = [];
                for (const call of functionCalls) {
                    const result = await executePublicTool(call.name, call.args);
                    functionResponses.push({
                        name: call.name,
                        response: { result: result } 
                    });
                }

                const responseParts = functionResponses.map(fr => ({
                    functionResponse: {
                        name: fr.name,
                        response: fr.response
                    }
                }));
                
                currentHistory.push({
                    role: 'function',
                    parts: responseParts
                });

            } catch (e: any) {
                 if (e.message?.includes('429') || e.message?.includes('Quota')) {
                     throw new Error("Rate Limit Exceeded. Slowing down...");
                }
                throw new Error(`Gemini Stream Error: ${e.message}`);
            }
        }

        return finalFullText || "(Session Concluded)";
    }

    const text = await getBotResponse(bot, history, baseSystemInstruction, settings);
    onChunk(text);
    return text || "(No response)";
};


export const getBotResponse = async (
    bot: BotConfig, 
    history: Message[], 
    baseSystemInstruction: string,
    settings: Settings
): Promise<string> => {
    
    await waitWithJitter(200, 800);
    
    const lastUserMsg = history.filter(m => m.authorType === AuthorType.HUMAN || m.authorType === AuthorType.SYSTEM).pop()?.content || "";
    const systemPrompt = injectMCPContext(baseSystemInstruction, settings, bot, lastUserMsg);

    if (bot.authorType === AuthorType.GEMINI) {
        let text = "";
        await streamBotResponse(bot, history, baseSystemInstruction, settings, (t) => text = t);
        return text;
    }

    let url = "https://openrouter.ai/api/v1/chat/completions";
    let apiKey = bot.apiKey || "";

    switch(bot.authorType) {
        case AuthorType.OPENROUTER:
            url = "https://openrouter.ai/api/v1/chat/completions";
            apiKey = apiKey || settings.providers.openRouterKey || "";
            if (!apiKey) throw new Error("OpenRouter API Key is missing.");
            break;
        case AuthorType.LM_STUDIO:
            url = settings.providers.lmStudioEndpoint;
            apiKey = "dummy"; 
            break;
        case AuthorType.OLLAMA:
            url = settings.providers.ollamaEndpoint;
            apiKey = "ollama";
            break;
        case AuthorType.JAN_AI:
            url = settings.providers.janAiEndpoint;
            apiKey = "jan";
            break;
        
        // --- NEW PROVIDERS ---
        case AuthorType.MOONSHOT:
            url = settings.providers.moonshotEndpoint || "https://api.moonshot.cn/v1/chat/completions";
            apiKey = settings.providers.moonshotApiKey || "";
            if (!apiKey) throw new Error("Moonshot API Key is missing.");
            break;
        case AuthorType.MINIMAX:
            url = settings.providers.minimaxEndpoint || "https://api.minimax.chat/v1/text/chatcompletion_v2";
            apiKey = settings.providers.minimaxApiKey || "";
            if (!apiKey) throw new Error("Minimax API Key is missing.");
            break;
        case AuthorType.ZAI:
            url = settings.providers.zaiEndpoint || "https://api.zai.com/v1/chat/completions";
            apiKey = settings.providers.zaiApiKey || "";
            if (!apiKey) throw new Error("Z.ai API Key is missing.");
            break;

        case AuthorType.OPENAI_COMPATIBLE:
            url = bot.endpoint || settings.providers.genericOpenAIEndpoint || "http://localhost:1234/v1/chat/completions";
            apiKey = apiKey || settings.providers.genericOpenAIKey || "dummy";
            break;
    }

    let headers: Record<string, string> = {
        "Content-Type": "application/json"
    };
    
    if (bot.authorType === AuthorType.OPENROUTER) {
        headers["HTTP-Referer"] = "AI Bot Council";
        headers["X-Title"] = "AI Bot Council";
    }
    
    if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...formatHistoryForOpenAI(history, settings)
    ];

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: bot.model,
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error ${response.status}: ${err}`);
        }

        const data = await response.json();
        
        // Some APIs (like Minimax V2) might have different response structures. 
        // We try standard OpenAI first, then fallback or check specific fields.
        let content = data.choices?.[0]?.message?.content;
        
        // Minimax legacy/v2 structure check if standard fails
        if (!content && data.reply) {
            content = data.reply; 
        }
        // General fallback
        if (!content && data.base_resp?.status_msg) {
             throw new Error(`Provider Error: ${data.base_resp.status_msg}`);
        }

        return content || "(No response generated)";

    } catch (error: any) {
        console.error(`Error fetching response for ${bot.name} at ${url}:`, error);
        throw new Error(`${error.message}`);
    }
};
