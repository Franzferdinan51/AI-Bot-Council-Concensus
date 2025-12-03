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
    sessionsList: document.getElementById('sessions-list'),
    // New Elements
    modeForm: document.getElementById('mode-form'),
    modeJson: document.getElementById('mode-json'),
    toolFormContainer: document.getElementById('tool-form-container'),
    toolHistory: document.getElementById('tool-history'),
    outTabPreview: document.getElementById('out-tab-preview'),
    outTabJson: document.getElementById('out-tab-json')
};

let toolMode = 'form'; // 'form' | 'json'
let toolHistory = [];
let lastResult = null;

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
            renderToolForm(tool.inputSchema); // Generate form
        }
    });

    // Mode Toggles
    els.modeForm.addEventListener('click', () => setToolMode('form'));
    els.modeJson.addEventListener('click', () => setToolMode('json'));

    // Output Tabs
    els.outTabPreview.addEventListener('click', () => setOutputTab('preview'));
    els.outTabJson.addEventListener('click', () => setOutputTab('json'));

    // Sync Form -> JSON
    els.toolFormContainer.addEventListener('input', (e) => {
        if (toolMode === 'form') syncFormToJson();
    });

    // Sync JSON -> Form
    els.toolArgs.addEventListener('input', () => {
        // Optional: sync back to form if valid JSON
        // For now, we only sync Form -> JSON to avoid complexity
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
            lastResult = result;
            renderOutput(result);
            addToHistory(toolName, args, result, duration); // Add to history

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
    const tab = els.outTabPreview.classList.contains('text-indigo-400') ? 'preview' : 'json';
    els.toolOutput.innerHTML = '';

    if (tab === 'json') {
        const pre = document.createElement('pre');
        pre.className = "text-gray-300 whitespace-pre-wrap font-mono text-xs";
        pre.innerHTML = highlight(data);
        els.toolOutput.appendChild(pre);
        return;
    }

    // Preview Mode
    if (data.content && Array.isArray(data.content)) {
        data.content.forEach(item => {
            if (item.type === 'text') {
                // Check if text is JSON
                try {
                    const json = JSON.parse(item.text);
                    const pre = document.createElement('pre');
                    pre.className = "whitespace-pre-wrap text-green-400";
                    pre.innerHTML = highlight(json);
                    els.toolOutput.appendChild(pre);
                } catch (e) {
                    const div = document.createElement('div');
                    div.className = "text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed";
                    div.textContent = item.text;
                    els.toolOutput.appendChild(div);
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

// --- New Helpers ---

function setToolMode(mode) {
    toolMode = mode;
    if (mode === 'form') {
        els.modeForm.classList.add('bg-indigo-600', 'text-white');
        els.modeForm.classList.remove('text-gray-400');
        els.modeJson.classList.remove('bg-indigo-600', 'text-white');
        els.modeJson.classList.add('text-gray-400');
        els.toolFormContainer.classList.remove('hidden');
        els.toolArgs.classList.add('hidden');
        // Sync JSON -> Form (try to parse)
        try {
            const json = JSON.parse(els.toolArgs.value);
            // TODO: Populate form values from JSON
        } catch (e) { }
    } else {
        els.modeJson.classList.add('bg-indigo-600', 'text-white');
        els.modeJson.classList.remove('text-gray-400');
        els.modeForm.classList.remove('bg-indigo-600', 'text-white');
        els.modeForm.classList.add('text-gray-400');
        els.toolArgs.classList.remove('hidden');
        els.toolFormContainer.classList.add('hidden');
    }
}

function setOutputTab(tab) {
    if (tab === 'preview') {
        els.outTabPreview.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-400');
        els.outTabPreview.classList.remove('text-gray-500');
        els.outTabJson.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-400');
        els.outTabJson.classList.add('text-gray-500');
    } else {
        els.outTabJson.classList.add('text-indigo-400', 'border-b-2', 'border-indigo-400');
        els.outTabJson.classList.remove('text-gray-500');
        els.outTabPreview.classList.remove('text-indigo-400', 'border-b-2', 'border-indigo-400');
        els.outTabPreview.classList.add('text-gray-500');
    }
    if (lastResult) renderOutput(lastResult);
}

function renderToolForm(schema) {
    els.toolFormContainer.innerHTML = '';
    if (!schema || !schema.properties) {
        els.toolFormContainer.innerHTML = '<div class="text-gray-500 text-sm">No arguments required.</div>';
        return;
    }

    for (const key in schema.properties) {
        const prop = schema.properties[key];
        const required = schema.required && schema.required.includes(key);

        const wrapper = document.createElement('div');
        wrapper.className = "space-y-1";

        const label = document.createElement('label');
        label.className = "text-[10px] uppercase font-bold text-gray-400";
        label.textContent = key + (required ? ' *' : '');
        wrapper.appendChild(label);

        let input;
        if (prop.enum) {
            input = document.createElement('select');
            input.className = "w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none form-input";
            input.dataset.key = key;
            input.dataset.type = 'string'; // Enums are usually strings
            input.dataset.required = required;
            prop.enum.forEach(val => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                input.appendChild(opt);
            });
            if (prop.default) input.value = prop.default;
        } else if (prop.type === 'boolean') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = "ml-2 form-input";
            input.dataset.key = key;
            input.dataset.type = 'boolean';
            input.dataset.required = required;
            if (prop.default) input.checked = prop.default;
            // Wrap for checkbox
            const checkWrapper = document.createElement('div');
            checkWrapper.className = "flex items-center";
            checkWrapper.appendChild(input);
            wrapper.appendChild(checkWrapper);
            input = null; // Already appended
        } else if (prop.type === 'number' || prop.type === 'integer') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = "w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none form-input";
            input.dataset.key = key;
            input.dataset.type = 'number';
            input.dataset.required = required;
            if (prop.default) input.value = prop.default;
        } else if (prop.type === 'object' || prop.type === 'array') {
            input = document.createElement('textarea');
            input.className = "w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none form-input font-mono h-24";
            input.dataset.key = key;
            input.dataset.type = prop.type;
            input.dataset.required = required;
            input.placeholder = prop.type === 'array' ? '["item1", "item2"]' : '{"key": "value"}';
            if (prop.default) input.value = JSON.stringify(prop.default, null, 2);
            else input.value = prop.type === 'array' ? '[]' : '{}';
        } else {
            // Default to text
            input = document.createElement('input');
            input.type = 'text';
            input.className = "w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-indigo-500 outline-none form-input";
            input.dataset.key = key;
            input.dataset.type = 'string';
            input.dataset.required = required;
            if (prop.default) input.value = prop.default;
        }

        if (input) wrapper.appendChild(input);

        if (prop.description) {
            const desc = document.createElement('p');
            desc.className = "text-[10px] text-gray-500";
            desc.textContent = prop.description;
            wrapper.appendChild(desc);
        }

        els.toolFormContainer.appendChild(wrapper);
    }
}

function syncFormToJson() {
    const inputs = els.toolFormContainer.querySelectorAll('.form-input');
    const args = {};
    inputs.forEach(input => {
        const key = input.dataset.key;
        const type = input.dataset.type;
        const required = input.dataset.required === 'true';

        if (type === 'boolean') {
            args[key] = input.checked;
        } else if (type === 'number') {
            if (input.value === '' && !required) return; // Omit empty optional numbers
            args[key] = Number(input.value);
        } else if (type === 'object' || type === 'array') {
            if (input.value === '' && !required) return; // Omit empty optional objects
            try {
                args[key] = JSON.parse(input.value);
            } catch (e) {
                args[key] = input.value;
            }
        } else {
            if (input.value === '' && !required) return; // Omit empty optional strings
            args[key] = input.value;
        }
    });
    els.toolArgs.value = JSON.stringify(args, null, 2);
}

function addToHistory(toolName, args, result, duration) {
    const item = {
        id: Date.now(),
        toolName,
        args,
        result,
        duration,
        timestamp: new Date().toISOString()
    };
    toolHistory.unshift(item);
    if (toolHistory.length > 20) toolHistory.pop();
    renderHistory();
}

function renderHistory() {
    els.toolHistory.innerHTML = '';
    if (toolHistory.length === 0) {
        els.toolHistory.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">No recent runs.</div>';
        return;
    }

    toolHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = "p-3 border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors group";
        div.onclick = () => restoreHistoryItem(item);

        const success = !item.result.error;
        const color = success ? 'text-green-400' : 'text-red-400';

        div.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-xs text-white">${item.toolName}</span>
                <span class="text-[10px] font-mono text-gray-500">${new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-[10px] ${color}">${success ? 'Success' : 'Error'}</span>
                <span class="text-[10px] text-gray-600">${item.duration}ms</span>
            </div>
        `;
        els.toolHistory.appendChild(div);
    });
}

function restoreHistoryItem(item) {
    els.toolSelect.value = item.toolName;
    // Trigger change to load schema but keep args
    const tool = tools.find(t => t.name === item.toolName);
    if (tool) {
        els.toolDesc.textContent = tool.description;
        renderToolForm(tool.inputSchema);
    }

    els.toolArgs.value = JSON.stringify(item.args, null, 2);
    // TODO: Sync JSON -> Form

    lastResult = item.result;
    renderOutput(item.result);
    els.executionTime.textContent = `${item.duration}ms (History)`;
}

// Helper to highlight JSON
function highlight(json) {
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
