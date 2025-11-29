
import { GoogleGenAI } from "@google/genai";
import { Message, AuthorType, BotConfig, Settings } from '../types';

// Helper to format chat history for Gemini
const formatHistoryForGemini = (history: Message[]) => {
  const contents = history.map(msg => {
    const role: 'user' | 'model' = (msg.authorType === AuthorType.HUMAN || msg.authorType === AuthorType.SYSTEM) ? 'user' : 'model';
    const text = `${msg.author} (${msg.roleLabel || 'Member'}): ${msg.content}`;
    return {
      role,
      parts: [{ text }]
    };
  });

  // Consolidate consecutive roles
  const mergedContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  if (contents.length > 0) {
      let lastMessage = { ...contents[0] };
      for (let i = 1; i < contents.length; i++) {
        if (lastMessage.role === contents[i].role) {
            lastMessage.parts[0].text += `\n\n${contents[i].parts[0].text}`;
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
const formatHistoryForOpenAI = (history: Message[]) => {
    return history.map(msg => ({
        role: (msg.authorType === AuthorType.HUMAN || msg.authorType === AuthorType.SYSTEM) ? 'user' : 'assistant',
        content: `${msg.author}: ${msg.content}`
    }));
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

export const getBotResponse = async (
    bot: BotConfig, 
    history: Message[], 
    baseSystemInstruction: string,
    settings: Settings
): Promise<string> => {
    
    const systemPrompt = injectMCPContext(baseSystemInstruction, settings);

    // --- GEMINI ---
    if (bot.authorType === AuthorType.GEMINI) {
        const apiKey = settings.providers.geminiApiKey || process.env.API_KEY;
        if (!apiKey) throw new Error("Gemini API Key missing. Please check Settings.");
        
        const ai = new GoogleGenAI({ apiKey });
        
        // Enable Google Search tool and disable Safety Blocks
        const response = await ai.models.generateContent({
            model: bot.model || 'gemini-2.5-flash',
            contents: formatHistoryForGemini(history),
            config: { 
                systemInstruction: systemPrompt,
                tools: [{ googleSearch: {} }], // Enable native search
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
                ]
            }
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
        ...formatHistoryForOpenAI(history)
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
