document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;

            // Update Nav
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update View
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === tabId) view.classList.add('active');
            });
        });
    });

    // Dashboard Stats
    async function updateStats() {
        try {
            const res = await fetch('/api/system');
            const data = await res.json();

            document.getElementById('uptime-value').textContent = formatUptime(data.uptime);
            document.getElementById('memory-value').textContent = `${Math.round(data.memory.heapUsed / 1024 / 1024)} MB`;
            document.getElementById('sessions-value').textContent = data.activeSessions || 0;
            document.getElementById('requests-value').textContent = data.totalRequests || 0;
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }

    setInterval(updateStats, 5000);
    updateStats();

    // Console Logs
    const logContainer = document.getElementById('log-container');
    const autoScroll = document.getElementById('auto-scroll');
    let lastLogId = 0;

    async function fetchLogs() {
        try {
            const res = await fetch(`/api/logs?since=${lastLogId}`);
            const logs = await res.json();

            if (logs.length > 0) {
                logs.forEach(log => {
                    const div = document.createElement('div');
                    div.className = 'log-entry';
                    div.innerHTML = `
                        <span class="log-time">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span class="log-level ${log.level.toLowerCase()}">${log.level}</span>: 
                        <span class="log-message">${log.message}</span>
                    `;
                    logContainer.appendChild(div);
                    lastLogId = Math.max(lastLogId, log.id || Date.now());
                });

                if (autoScroll.checked) {
                    logContainer.scrollTop = logContainer.scrollHeight;
                }
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    }

    setInterval(fetchLogs, 2000);

    document.getElementById('clear-logs').addEventListener('click', () => {
        logContainer.innerHTML = '';
    });

    // Tool Tester
    const toolSelect = document.getElementById('tool-select');

    async function loadTools() {
        try {
            const res = await fetch('/list-tools');
            const data = await res.json();

            toolSelect.innerHTML = '<option value="">Select a tool...</option>';
            data.tools.forEach(tool => {
                const opt = document.createElement('option');
                opt.value = tool.name;
                opt.textContent = tool.name;
                opt.title = tool.description;
                toolSelect.appendChild(opt);
            });
        } catch (err) {
            console.error('Failed to load tools:', err);
        }
    }
    loadTools();

    // Populate arguments template when tool changes
    toolSelect.addEventListener('change', async () => {
        const toolName = toolSelect.value;
        if (!toolName) return;

        try {
            const res = await fetch('/list-tools');
            const data = await res.json();
            const tool = data.tools.find(t => t.name === toolName);

            if (tool && tool.inputSchema) {
                // Generate template from schema
                const template = {};
                if (tool.inputSchema.properties) {
                    Object.keys(tool.inputSchema.properties).forEach(key => {
                        template[key] = ""; // Placeholder
                    });
                }
                document.getElementById('tool-args').value = JSON.stringify(template, null, 2);
            }
        } catch (err) {
            console.error('Failed to load tool details:', err);
        }
    });

    document.getElementById('execute-tool').addEventListener('click', async () => {
        const toolName = toolSelect.value;
        const argsText = document.getElementById('tool-args').value;
        const resultPre = document.getElementById('tool-result');

        if (!toolName) {
            alert('Please select a tool');
            return;
        }

        let args = {};
        try {
            if (argsText.trim()) {
                args = JSON.parse(argsText);
            }
        } catch (e) {
            alert('Invalid JSON arguments');
            return;
        }

        resultPre.textContent = 'Executing...';
        resultPre.className = ''; // Reset class

        const startTime = Date.now();

        try {
            const res = await fetch('/call-tool', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: toolName, arguments: args })
            });
            const result = await res.json();
            const duration = Date.now() - startTime;

            resultPre.textContent = `// Duration: ${duration}ms\n` + JSON.stringify(result, null, 2);

            if (result.isError) {
                resultPre.style.borderLeft = '4px solid var(--error)';
            } else {
                resultPre.style.borderLeft = '4px solid var(--success)';
            }

        } catch (err) {
            resultPre.textContent = `Error: ${err.message}`;
            resultPre.style.borderLeft = '4px solid var(--error)';
        }
    });

    // Configuration
    async function loadConfig() {
        try {
            const res = await fetch('/api/config');
            const config = await res.json();

            // Populate fields (example)
            if (config.providers) {
                document.getElementById('search-provider').value = config.providers.searchProvider || 'duckduckgo';
            }
        } catch (err) {
            console.error('Failed to load config:', err);
        }
    }
    loadConfig();

    document.getElementById('save-config').addEventListener('click', async () => {
        // Implementation for saving config would go here
        alert('Config saving not yet implemented in backend');
    });

    // Helper
    function formatUptime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h}h ${m}m ${s}s`;
    }
});
