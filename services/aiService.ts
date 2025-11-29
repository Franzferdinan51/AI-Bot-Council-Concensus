
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, AuthorType, BotConfig, Settings, Attachment } from '../types';
import { VOICE_MAP } from '../constants';

// --- HELPER: RANDOM JITTER DELAY ---
const waitWithJitter = (minMs: number, maxMs: number) => {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
};

// --- COST SAVING: CONTEXT PRUNING ---
const pruneHistory = (history: Message[], settings: Settings): Message[] => {
    if (!settings.cost.contextPruning || history.length <= settings.cost.maxContextTurns) {
        return history;
    }

    // Always keep:
    // 1. System/Clerk Init Message (Index 0 usually)
    // 2. The last N messages
    
    const preservedHistory: Message[] = [];
    
    // Add first system message if exists
    if (history.length > 0 && history[0].authorType === AuthorType.SYSTEM) {
        preservedHistory.push(history[0]);
    }

    // Get last N messages
    const lastN = history.slice(-settings.cost.maxContextTurns);
    
    // Merge without duplicates
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
    
    // Construct Text Part
    // COST SAVING: Strip previous "Thinking" blocks to save tokens
    const cleanContent = msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
    let text = `${msg.author} (${msg.roleLabel || 'Member'}): ${cleanContent}`;
    
    // Inject link data into text with STRICT instructions
    if (msg.attachments && msg.attachments.length > 0) {
        const links = msg.attachments.filter(a => a.type === 'link').map(a => a.data).join(', ');
        if (links) {
            text += `\n\n[URGENT SYSTEM INSTRUCTION: The user has provided external sources via URL: ${links}.`;
            text += `\n1. You MUST use the 'googleSearch' tool IMMEDIATELY to access these URLs.`;
            text += `\n2. Do NOT hallucinate the content. If you cannot access the specific URL, search for the page title or video ID to find a summary.`;
            
            // Specific YouTube Handling
            if (links.includes('youtube.com') || links.includes('youtu.be')) {
                 text += `\n3. FOR YOUTUBE VIDEOS: You CANNOT watch the video directly. You MUST perform a Google Search for "transcript of youtube video ${links}" or "summary of youtube video ${links}" or the video title to understand its actual content. Do NOT guess based on the ID.`;
            }
            text += `]`;
        }
    }
    
    const parts: any[] = [{ text }];
    
    // Handle File Attachments (Images/Video)
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

  // Consolidate consecutive roles
  const mergedContents: { role: 'user' | 'model'; parts: any[] }[] = [];
  if (contents.length > 0) {
      let lastMessage = { ...contents[0] };
      for (let i = 1; i < contents.length; i++) {
        if (lastMessage.role === contents[i].role) {
            // Merge parts
            lastMessage.parts = [...lastMessage.parts, ...contents[i].parts];
        } else {
            mergedContents.push(lastMessage);
            lastMessage = { ...contents[i] };
        }
      }
      mergedContents.push(lastMessage);
  }

  // Ensure conversation ends with user (Gemini requirement if we want a model response)
  if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === 'model') {
    mergedContents.push({ role: 'user', parts: [{ text: "The floor is yours. Please proceed." }] });
  }

  return mergedContents;
};

// Helper for OpenAI / OpenRouter / LM Studio
const formatHistoryForOpenAI = (history: Message[], settings: Settings) => {
    const prunedHistory = pruneHistory(history, settings);
    return prunedHistory.map(msg => {
        // COST SAVING: Strip previous "Thinking" blocks
        const cleanContent = msg.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        let content = `${msg.author}: ${cleanContent}`;
        
        const links = msg.attachments?.filter(a => a.type === 'link').map(a => a.data).join(', ');
        if (links) content += `\n[Context URLs: ${links}]`;
        
        return {
            role: (msg.authorType === AuthorType.HUMAN || msg.authorType === AuthorType.SYSTEM) ? 'user' : 'assistant',
            content
        };
    });
};

const injectMCPContext = (systemPrompt: string, settings: Settings): string => {
    if (!settings.mcp.enabled) return systemPrompt;

    let toolContext = "\n\n[AVAILABLE MCP TOOLS & RESOURCES]:\n";
    
    if (settings.mcp.dockerEndpoint) {
        toolContext += `- Docker Connection Active: ${settings.mcp.dockerEndpoint} (Container Control Available)\n`;
    }
    
    if (settings.mcp.customTools.length > 0) {
        toolContext += "JSON Tool Definitions:\n" + settings.mcp.customTools.map(t => `- ${t.name}: ${t.description}`).join('\n') + "\n";
        toolContext += "You may act as if you can invoke these tools. Format: [TOOL_CALL: name args]\n";
    }

    return systemPrompt + toolContext;
};

// --- AUDIO TRANSCRIPTION ---
export const transcribeAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert Blob to Base64
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

// --- SPEECH GENERATION (TTS) ---
export const generateSpeech = async (text: string, botRole: string, apiKey: string): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Map Role to Voice
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

// --- STREAMING RESPONSE ---
export const streamBotResponse = async (
    bot: BotConfig,
    history: Message[],
    baseSystemInstruction: string,
    settings: Settings,
    onChunk: (text: string) => void
): Promise<string> => {
    
    // ECONOMY MODE LOGIC: Force lighter model if active and not Speaker
    let effectiveModel = bot.model;
    let effectiveSystemPrompt = baseSystemInstruction;
    
    if (settings.cost.economyMode && bot.role !== 'speaker') {
        effectiveModel = 'gemini-2.5-flash';
        effectiveSystemPrompt += "\n\n[ECONOMY MODE ACTIVE: Be concise. Skip pleasantries. Use standard logic, no advanced reasoning required.]";
    }

    const systemPrompt = injectMCPContext(effectiveSystemPrompt, settings);

    // SAFETY DELAY: Prevent API rate limits with small jitter
    await waitWithJitter(200, 800);

    // GEMINI STREAMING
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

        // Only use thinking for Pro models, unless Economy mode downgraded it
        if (effectiveModel.includes('gemini-3-pro')) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }
        config.tools = [{ googleSearch: {} }];

        try {
            const result = await ai.models.generateContentStream({
                model: effectiveModel,
                contents: formatHistoryForGemini(history, settings),
                config
            });

            let fullText = "";
            for await (const chunk of result) {
                const text = chunk.text; // Fixed: accessing property directly as per SDK requirements
                if (text) {
                    fullText += text;
                    onChunk(fullText);
                }
            }
            return fullText;
        } catch (e: any) {
            // Enhanced Error handling for Rate Limits
            if (e.message?.includes('429') || e.message?.includes('Quota')) {
                 throw new Error("Rate Limit Exceeded. Slowing down...");
            }
            throw new Error(`Gemini Stream Error: ${e.message}`);
        }
    }

    // Fallback to non-streaming for other providers
    const text = await getBotResponse(bot, history, baseSystemInstruction, settings);
    onChunk(text);
    return text;
};


export const getBotResponse = async (
    bot: BotConfig, 
    history: Message[], 
    baseSystemInstruction: string,
    settings: Settings
): Promise<string> => {
    
    // SAFETY DELAY
    await waitWithJitter(200, 800);
    
    const systemPrompt = injectMCPContext(baseSystemInstruction, settings);

    // --- GEMINI ---
    if (bot.authorType === AuthorType.GEMINI) {
        const apiKey = settings.providers.geminiApiKey || process.env.API_KEY;
        if (!apiKey) throw new Error("Gemini API Key missing. Please check Settings.");
        
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

        if (bot.model.includes('gemini-3-pro')) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }

        config.tools = [{ googleSearch: {} }];

        const response = await ai.models.generateContent({
            model: bot.model,
            contents: formatHistoryForGemini(history, settings),
            config
        });

        let text = response.text || "I have nothing to add.";
        
        // Extract and append Grounding Metadata (Sources)
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            const sources = groundingChunks
                .map((chunk: any) => chunk.web ? `• ${chunk.web.title}: ${chunk.web.uri}` : null)
                .filter(Boolean);
            
            if (sources.length > 0) {
                text += `\n\n**Verified Sources:**\n${sources.join('\n')}`;
            }
        }

        return text;
    }

    // --- OPENROUTER / LM STUDIO / GENERIC ---
    let url = "https://openrouter.ai/api/v1/chat/completions";
    let apiKey = bot.apiKey || "";

    // Determine URL and Key based on Provider Type
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
        case AuthorType.OPENAI_COMPATIBLE:
            url = bot.endpoint || "http://localhost:1234/v1/chat/completions";
            apiKey = apiKey || "dummy";
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
        return data.choices?.[0]?.message?.content || "(No response generated)";

    } catch (error: any) {
        console.error(`Error fetching response for ${bot.name} at ${url}:`, error);
        throw new Error(`${error.message}`);
    }
};
