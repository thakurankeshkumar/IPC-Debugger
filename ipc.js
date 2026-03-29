class Process {
    constructor(id, queueLimit = 5) {
        this.id = id;
        this.queue = [];
        this.queueLimit = queueLimit;
        this.waiting = false;
        this.busy = false;
        this.messageCount = 0;
    }

    receiveMessage(msg) {
        this.queue.push({
            content: msg,
            timestamp: new Date().toLocaleTimeString()
        });
        this.messageCount++;
        
        // Check if process becomes overloaded
        if (this.queue.length > this.queueLimit) {
            this.waiting = true;
            this.busy = true;
        } else {
            this.busy = true;
            // Simulate processing
            setTimeout(() => {
                this.busy = false;
            }, 500);
        }
    }

    getState() {
        if (this.waiting) return 'blocked';
        if (this.busy) return 'busy';
        return 'idle';
    }

    processQueue() {
        if (this.queue.length > 0) {
            this.queue.shift();
        }
        
        if (this.queue.length <= Math.ceil(this.queueLimit / 2)) {
            this.waiting = false;
        }
    }

    clearQueue() {
        this.queue = [];
        this.waiting = false;
        this.busy = false;
    }
}

// Global processes array
const processes = [];
const messageHistory = [];
const alerts = [];

let deadlockDetected = false;

function createProcess() {
    const queueLimit = parseInt(document.getElementById('queueLimit')?.value || 5);
    const id = processes.length + 1;
    const p = new Process(id, queueLimit);
    processes.push(p);
    log(`Process P${id} created`, 'success');
    updateUI();
    return p;
}

function sendMessage(fromId, toId, message) {
    // Validate
    if (!message || message.trim() === '') {
        logAlert('Empty message cannot be sent', 'error');
        return;
    }

    const sender = processes[fromId - 1];
    const receiver = processes[toId - 1];

    if (!sender) {
        logAlert(`Error: Process P${fromId} not found`, 'error');
        return;
    }

    if (!receiver) {
        logAlert(`Error: Process P${toId} not found`, 'error');
        return;
    }

    if (fromId === toId) {
        logAlert('Process cannot send message to itself', 'error');
        return;
    }

    // Send message
    receiver.receiveMessage(message);
    messageHistory.push({
        from: fromId,
        to: toId,
        message: message,
        timestamp: new Date().toLocaleTimeString()
    });

    log(`P${fromId} → P${toId}: "${message}"`, 'info');

    // Check for deadlock
    if (document.getElementById('autoDetect')?.checked) {
        detectDeadlock();
    }

    updateUI();
}

function terminateLastProcess() {
    if (processes.length === 0) {
        logAlert('No processes to terminate', 'error');
        return;
    }

    const removed = processes.pop();
    log(`Process P${removed.id} terminated`, 'warning');
    updateUI();
}

function clearAll() {
    processes.length = 0;
    messageHistory.length = 0;
    alerts.length = 0;
    deadlockDetected = false;
    log('All processes cleared', 'warning');
    updateUI();
}

function updateUI() {
    updateProcessContainer();
    updateStats();
    renderAlerts();
}

function updateProcessContainer() {
    const container = document.getElementById('processContainer');
    
    if (processes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No processes yet. Click "Create Process" to start.</p></div>';
        return;
    }

    container.innerHTML = processes.map(p => `
        <div class="process-box">
            <div class="process-header">
                <div class="process-id">P${p.id}</div>
                <div class="process-state state-${p.getState()}">${p.getState()}</div>
            </div>
            <div class="queue-info">
                <div class="queue-label">Queue (${p.queue.length}/${p.queueLimit})</div>
                <div class="queue-items">
                    ${p.queue.length === 0 
                        ? '<span class="queue-empty">Empty</span>' 
                        : p.queue.map((msg, i) => `
                            <div class="queue-item" title="${msg.content}">
                                ${i + 1}
                            </div>
                        `).join('')
                    }
                </div>
            </div>
            <div style="font-size: 0.85em; color: var(--text-secondary);">
                <div>Messages: ${p.messageCount}</div>
                <div>Waiting: ${p.waiting ? 'Yes' : 'No'}</div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('processCount').textContent = processes.length;
    document.getElementById('messageCount').textContent = messageHistory.length;
    
    const statusIndicator = document.getElementById('statusIndicator');
    if (deadlockDetected) {
        statusIndicator.textContent = '🚨 Deadlock!';
        statusIndicator.style.color = '#ef4444';
    } else {
        statusIndicator.textContent = 'Running';
        statusIndicator.style.color = '#10b981';
    }
}

function renderAlerts() {
    const alertsContainer = document.getElementById('alerts');
    
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<p class="empty">No alerts yet</p>';
        return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-title">${alert.type === 'error' ? '❌' : '⚠️'} ${alert.title}</div>
            <div>${alert.message}</div>
            <div class="alert-time">${alert.timestamp}</div>
        </div>
    `).join('');
}
