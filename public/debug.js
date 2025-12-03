// debug.js

// State
let tools = [];
let logs = [];
let activeFilter = 'ALL';
let currentTab = 'dashboard';

// DOM Elements
const els = {
    toolSelect: document.getElementById('tool-select'),
    toolDesc: document.getElementById('tool-description'),
    toolArgs: document.getElementById('tool-args'),
    runBtn: document.getElementById('run-tool'),
    formatBtn: document.getElementById('format-json'),
    toolOutput: document.getElementById('tool-output'),
    fullLogView: document.getElementById('full-log-view'),
    activityLog: document.getElementById('activity-log'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    pageTitle: document.getElementById('page-title'),
    executionTime: document.getElementById('execution-time'),
    stats: {
        uptime: document.getElementById('stat-uptime'),
        memory: document.getElementById('stat-memory'),
        sessions: document.getElementById('stat-sessions'),
        requests: document.getElementById('stat-requests')
    },
    config: {
        gemini: document.getElementById('cfg-gemini'),
        openrouter: document.getElementById('cfg-openrouter'),
        search: document.getElementById('cfg-search'),
        searchKey: document.getElementById('cfg-search-key')
    },
    sessionsList: document.getElementById('sessions-list')
};

// Initialize
async function init() {
    try {
        await fetchTools();
        await fetchConfig();
        setupEventSource();
        setupListeners();
        startStatsLoop();
    } catch (e) {
        console.error("Initialization failed:", e);
        showToast("Failed to connect to server", "error");
        els.statusDot.classList.remove('bg-green-500');
        els.statusDot.classList.add('bg-red-500');
        els.statusText.textContent = "Offline";
    }
}

// --- Navigation ---
window.switchTab = (tabId) => {
    currentTab = tabId;

    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(el => {
        if (el.dataset.tab === tabId) {
            el.classList.add('bg-gray-800', 'text-white');
            el.classList.remove('text-gray-400');
        } else {
            el.classList.remove('bg-gray-800', 'text-white');
            el.classList.add('text-gray-400');
        }
    });

    // Update View
    ['dashboard', 'tools', 'logs', 'sessions', 'config'].forEach(id => {
        const view = document.getElementById(`view-${id}`);
        if (id === tabId) {
            view.classList.remove('hidden');
            // Trigger specific refreshes
            if (id === 'sessions') refreshSessions();
        } else {
            view.classList.add('hidden');
        }
    });

    // Update Title
    const titles = {
        dashboard: 'Dashboard',
        tools: 'Tool Tester',
        logs: 'Server Logs',
        sessions: 'Active Sessions',
        config: 'Configuration'
    };
    els.pageTitle.textContent = titles[tabId];
};

// --- Tools ---
async function fetchTools() {
    const res = await fetch('/list-tools');
    const data = await res.json();
    tools = data.tools;

    els.toolSelect.innerHTML = '<option value="" disabled selected>Select a tool...</option>';
    tools.forEach(tool => {
        const opt = document.createElement('option');
        opt.value = tool.name;
        opt.textContent = tool.name;
        els.toolSelect.appendChild(opt);
    });
}

// --- Config ---
async function fetchConfig() {
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        const p = data.providers;

        els.config.gemini.value = p.geminiApiKey || '';
        els.config.openrouter.value = p.openRouterKey || '';
        els.config.search.value = p.searchProvider || 'duckduckgo';

        // Set search key based on provider
        updateSearchKeyPlaceholder();
    } catch (e) { console.error("Config fetch error", e); }

    // Fetch Bots
    try {
        const res = await fetch('/api/config');
        const data = await res.json();
        renderBotConfig(data.bots);
    } catch (e) { console.error("Bot config fetch error", e); }
}

function renderBotConfig(bots) {
    const container = document.getElementById('bot-config-container');
    if (!container) return;

    if (!bots || bots.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 col-span-2">No bots configured.</div>';
        return;
    }

    container.innerHTML = bots.map((bot, index) => `
        <div class="glass-panel p-4 rounded-xl space-y-3">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <label class="text-[10px] text-gray-500 uppercase font-bold">Bot ID</label>
                    <div class="text-sm font-mono text-indigo-400">${bot.id}</div>
                </div>
                <div class="flex-1">
                    <label class="text-[10px] text-gray-500 uppercase font-bold">Name</label>
                    <input type="text" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none bot-name" data-index="${index}" value="${bot.name}">
                </div>
            </div>
            <div>
                <label class="text-[10px] text-gray-500 uppercase font-bold">Model</label>
                <input type="text" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 outline-none bot-model" data-index="${index}" value="${bot.model}">
            </div>
            <div>
                <label class="text-[10px] text-gray-500 uppercase font-bold">Persona / Instructions</label>
                <textarea class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:border-indigo-500 outline-none bot-instructions h-20 resize-none" data-index="${index}">${bot.instructions || ''}</textarea>
            </div>
        </div>
    `).join('');
}
window.refreshSessions = async () => {
    els.sessionsList.innerHTML = '<div class="text-center text-gray-500 py-10">Loading sessions...</div>';
    try {
        // We don't have a direct list-sessions endpoint in httpBridge yet, 
        // but we can use the tool `council_list_sessions` via /call-tool
        const res = await fetch('/call-tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'council_list_sessions', arguments: {} })
        });
        const data = await res.json();

        // Parse the text output from the tool
        const text = data.content?.[0]?.text || "[]";
        // The tool returns a JSON string in the text field usually, or a formatted string.
        // Let's assume for now we might need to parse it or display it.
        // Actually, let's try to hit /api/system which has activeSessions count, 
        // but for details we rely on the tool.

        // If the tool returns JSON string:
        let sessions = [];
        try {
            sessions = JSON.parse(text);
        } catch (e) {
            // If not JSON, maybe it's a message "No active sessions".
            if (text.includes("No active sessions")) sessions = [];
        }

        renderSessions(sessions);

    } catch (e) {
        els.sessionsList.innerHTML = `<div class="text-red-400 text-center">Failed to load sessions: ${e.message}</div>`;
    }
};

function renderSessions(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        els.sessionsList.innerHTML = '<div class="text-center text-gray-500 py-10 bg-gray-900/30 rounded-xl border border-gray-800">No active sessions found.</div>';
        return;
    }

    els.sessionsList.innerHTML = sessions.map(s => `
        <div class="glass-panel p-4 rounded-xl flex justify-between items-center">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-indigo-400 font-mono text-xs">#${s.id.substring(0, 8)}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-300 uppercase">${s.status}</span>
                </div>
                <div class="font-medium text-white text-sm">${s.topic || 'Untitled Session'}</div>
            </div>
            <div class="flex gap-2">
                <button onclick="controlSession('${s.id}', 'pause')" class="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-amber-400" title="Pause/Resume">
                    ⏸
                </button>
                <button onclick="controlSession('${s.id}', 'stop')" class="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400" title="Stop">
                    ⏹
                </button>
            </div>
        </div>
    `).join('');
}

window.controlSession = async (sessionId, action) => {
    try {
        await fetch(`/api/session/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
        showToast(`Session ${action} command sent`, "success");
        setTimeout(refreshSessions, 500);
    } catch (e) { showToast(`Failed to ${action} session`, "error"); }
};


// --- Logs & Events ---
function setupEventSource() {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
        els.statusDot.classList.add('bg-green-500');
        els.statusDot.classList.remove('bg-red-500');
        els.statusText.textContent = "Online";
        els.statusDot.classList.remove('bg-green-500');
        els.statusDot.classList.add('bg-red-500');
        els.statusText.textContent = "Reconnecting...";
    };

    // Poll logs
    setInterval(async () => {
        try {
            const res = await fetch('/api/logs?since=' + (Date.now() - 5000));
            if (res.ok) {
                const newLogs = await res.json();
                newLogs.forEach(l => addLog(l));
            }
        } catch (e) { }
    }, 5000);
}

function addLog(log) {
    logs.push(log);
    if (logs.length > 500) logs.shift(); // Keep last 500

    // Render to Activity Log (Dashboard) - Only last 20
    const activityItem = document.createElement('div');
    activityItem.className = "px-4 py-2 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors";
    activityItem.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-500 font-mono">${new Date(log.timestamp).toLocaleTimeString()}</span>
            <span class="text-[10px] font-bold ${getLogColorClass(log.level)}">${log.level || 'INFO'}</span>
        </div>
        <div class="text-gray-300 mt-0.5 truncate">${log.message}</div>
    `;
    els.activityLog.prepend(activityItem);
    if (els.activityLog.children.length > 20) els.activityLog.lastElementChild.remove();

    // Render to Full Log View (Logs Tab)
    renderFullLogItem(log);
}

function renderFullLogItem(log) {
    if (activeFilter !== 'ALL' && log.level !== activeFilter) return;
    if (activeFilter === 'TOOL' && !log.message.includes('[TOOL]')) return;

    const div = document.createElement('div');
    div.className = `font-mono border-b border-gray-800/50 pb-1 mb-1 hover:bg-gray-900/50 px-2 ${getLogColorClass(log.level)}`;
    div.textContent = `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level || 'INFO'}] ${log.message}`;
    els.fullLogView.prepend(div);
}

window.filterLogs = (filter) => {
    activeFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(el => {
        if (el.dataset.filter === filter) el.classList.add('bg-gray-800', 'text-white');
        else el.classList.remove('bg-gray-800', 'text-white');
    });

    // Re-render all logs
    els.fullLogView.innerHTML = '';
    logs.forEach(renderFullLogItem);
};

window.clearLogs = () => {
    logs = [];
    els.fullLogView.innerHTML = '';
    els.activityLog.innerHTML = '';
};

function getLogColorClass(level) {
    if (level === 'ERROR') return 'text-red-400';
    if (level === 'WARN') return 'text-amber-400';
    if (level === 'EVENT') return 'text-blue-400';
    return 'text-gray-400';
}

// --- Listeners ---
function setupListeners() {
    els.toolSelect.addEventListener('change', () => {
        const tool = tools.find(t => t.name === els.toolSelect.value);
        if (tool) {
            els.toolDesc.textContent = tool.description;
            const template = generateTemplate(tool.inputSchema);
            els.toolArgs.value = JSON.stringify(template, null, 2);
        }
    });

    els.formatBtn.addEventListener('click', () => {
        try {
            const json = JSON.parse(els.toolArgs.value);
            els.toolArgs.value = JSON.stringify(json, null, 2);
        } catch (e) { showToast("Invalid JSON", "error"); }
    });

    els.runBtn.addEventListener('click', async () => {
        const toolName = els.toolSelect.value;
        if (!toolName) return;

        let args = {};
        try {
            args = JSON.parse(els.toolArgs.value);
        } catch (e) {
            showToast("Invalid JSON arguments", "error");
            return;
        }

        els.runBtn.disabled = true;
        els.runBtn.innerHTML = '<span class="animate-spin">↻</span> Running...';
        els.toolOutput.innerHTML = '<div class="text-center text-gray-500 mt-10 animate-pulse">Executing tool...</div>';
        els.executionTime.textContent = '';

        const start = Date.now();
        try {
            const res = await fetch('/call-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: toolName, arguments: args })
            });
            const result = await res.json();
            const duration = Date.now() - start;

            els.executionTime.textContent = `${duration}ms`;
            renderOutput(result);

            // Log this run
            addLog({ timestamp: new Date().toISOString(), level: 'TOOL', message: `Executed ${toolName} (${duration}ms)` });

        } catch (e) {
            els.toolOutput.innerHTML = `<div class="text-red-400 font-bold">Error: ${e.message}</div>`;
        } finally {
            els.runBtn.disabled = false;
            els.runBtn.innerHTML = '<span>▶</span> Execute Tool';
        }
    });

    els.config.search.addEventListener('change', updateSearchKeyPlaceholder);
}

window.saveConfig = async () => {
    // Save Providers
    const updates = {
        providers: {
            geminiApiKey: els.config.gemini.value,
            openRouterKey: els.config.openrouter.value,
            searchProvider: els.config.search.value,
        }
    };

    // Add specific search key
    const sp = els.config.search.value;
    if (sp === 'brave') updates.providers.braveApiKey = els.config.searchKey.value;
    if (sp === 'tavily') updates.providers.tavilyApiKey = els.config.searchKey.value;
    if (sp === 'serper') updates.providers.serperApiKey = els.config.searchKey.value;

    try {
        // Save Provider Config
        const res1 = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        // Save Bot Config
        const botInputs = document.querySelectorAll('.bot-name');
        const bots = [];
        botInputs.forEach((input, idx) => {
            const name = input.value;
            const model = document.querySelector(`.bot-model[data-index="${idx}"]`).value;
            const instructions = document.querySelector(`.bot-instructions[data-index="${idx}"]`).value;
            const id = input.parentElement.previousElementSibling.querySelector('.text-indigo-400').textContent;

            bots.push({ id, name, model, instructions, enabled: true });
        });

        const res2 = await fetch('/api/config/bots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bots })
        });

        if (res1.ok && res2.ok) showToast("Configuration saved successfully", "success");
        else showToast("Failed to save configuration", "error");
    } catch (e) { showToast("Network error saving config", "error"); }
};

function updateSearchKeyPlaceholder() {
    const provider = els.config.search.value;
    const keyInput = els.config.searchKey;
    if (provider === 'duckduckgo') {
        keyInput.disabled = true;
        keyInput.placeholder = "No API key required";
    } else {
        keyInput.disabled = false;
        keyInput.placeholder = `Enter ${provider.charAt(0).toUpperCase() + provider.slice(1)} API Key...`;
    }
}

// --- Helpers ---
function generateTemplate(schema) {
    if (!schema || !schema.properties) return {};
    const template = {};
    for (const key in schema.properties) {
        const prop = schema.properties[key];
        if (prop.type === 'string') template[key] = prop.default || "";
        else if (prop.type === 'number') template[key] = prop.default || 0;
        else if (prop.type === 'boolean') template[key] = prop.default || false;
        else if (prop.type === 'array') template[key] = [];
        else if (prop.type === 'object') template[key] = {};
    }
    return template;
}

function renderOutput(data) {
    els.toolOutput.innerHTML = '';

    // Helper to highlight JSON
    const highlight = (json) => {
        return JSON.stringify(json, null, 2)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) cls = 'json-key';
                    else cls = 'json-string';
                } else if (/true|false/.test(match)) cls = 'json-boolean';
                else if (/null/.test(match)) cls = 'json-null';
                return '<span class="' + cls + '">' + match + '</span>';
            });
    };

    if (data.content && Array.isArray(data.content)) {
        data.content.forEach(item => {
            if (item.type === 'text') {
                // Check if text is JSON
                try {
                    const json = JSON.parse(item.text);
                    const pre = document.createElement('pre');
                    pre.className = "whitespace-pre-wrap";
                    pre.innerHTML = highlight(json);
                    els.toolOutput.appendChild(pre);
                } catch (e) {
                    const pre = document.createElement('pre');
                    pre.className = "text-gray-300 whitespace-pre-wrap";
                    pre.textContent = item.text;
                    els.toolOutput.appendChild(pre);
                }
            } else if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = `data:${item.mimeType};base64,${item.data}`;
                img.className = "max-w-full rounded border border-gray-700 mt-2";
                els.toolOutput.appendChild(img);
            }
        });
    } else if (data.error) {
        els.toolOutput.innerHTML = `<div class="text-red-400 font-bold border border-red-900/50 bg-red-900/20 p-4 rounded">${data.error}</div>`;
    } else {
        const pre = document.createElement('pre');
        pre.className = "text-gray-400";
        pre.innerHTML = highlight(data);
        els.toolOutput.appendChild(pre);
    }
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in z-50 ${type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white border border-gray-700'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function startStatsLoop() {
    setInterval(async () => {
        try {
            const res = await fetch('/api/system');
            const stats = await res.json();

            // Format uptime
            const h = Math.floor(stats.uptime / 3600).toString().padStart(2, '0');
            const m = Math.floor((stats.uptime % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(stats.uptime % 60).toString().padStart(2, '0');
            els.stats.uptime.textContent = `${h}:${m}:${s}`;

            // Memory
            const mem = Math.round(stats.memory.heapUsed / 1024 / 1024);
            els.stats.memory.textContent = `${mem} MB`;

            // Sessions
            els.stats.sessions.textContent = stats.activeSessions;

            // Requests (Mocked for now as endpoint returns 0 placeholder)
            // els.stats.requests.textContent = stats.totalRequests;

        } catch (e) { }
    }, 1000);
}

// Start
init();
