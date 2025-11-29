
import { GoogleGenAI } from "@google/genai";
import { Message, AuthorType, BotConfig, MCPSettings } from '../types';

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

const injectMCPContext = (systemPrompt: string, mcp: MCPSettings): string => {
    if (!mcp.enabled) return systemPrompt;

    let toolContext = "\n\n[AVAILABLE MCP TOOLS & RESOURCES]:\n";
    
    if (mcp.dockerEndpoint) {
        toolContext += `- Docker Connection Active: ${mcp.dockerEndpoint} (Container Control Available)\n`;
    }
    
    if (mcp.customTools.length > 0) {
        toolContext += "JSON Tool Definitions:\n" + mcp.customTools.map(t => `- ${t.name}: ${t.description}`).join('\n') + "\n";
        toolContext += "You may act as if you can invoke these tools. Format: [TOOL_CALL: name args]\n";
    }

    return systemPrompt + toolContext;
};

export const getBotResponse = async (
    bot: BotConfig, 
    history: Message[], 
    baseSystemInstruction: string,
    globalOpenRouterKey?: string,
    mcpSettings?: MCPSettings
): Promise<string> => {
    
    const systemPrompt = mcpSettings ? injectMCPContext(baseSystemInstruction, mcpSettings) : baseSystemInstruction;

    // --- GEMINI ---
    if (bot.authorType === AuthorType.GEMINI) {
        if (!process.env.API_KEY) throw new Error("Gemini API Key missing in environment.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
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
    let apiKey = bot.apiKey || globalOpenRouterKey || "";
    let headers: Record<string, string> = {
        "Content-Type": "application/json"
    };

    if (bot.authorType === AuthorType.LM_STUDIO || bot.authorType === AuthorType.OPENAI_COMPATIBLE) {
        url = bot.endpoint || "http://localhost:1234/v1/chat/completions";
        // Local models often don't need a key, but we send a dummy one if empty to prevent some parsers failing
        if (!apiKey) apiKey = "dummy"; 
    } else {
        // OpenRouter specific checks
        if (!apiKey) {
            throw new Error("OpenRouter API Key is missing. Please add it in Settings > API Keys.");
        }
        headers["HTTP-Referer"] = "AI Bot Council";
        headers["X-Title"] = "AI Bot Council";
    }
    headers["Authorization"] = `Bearer ${apiKey}`;

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
        console.error(`Error fetching response for ${bot.name}:`, error);
        throw new Error(`${error.message}`);
    }
};
