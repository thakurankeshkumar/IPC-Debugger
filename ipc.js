/**
 * IPC (Inter-Process Communication) System
 * Simulates message passing between multiple processes with queue management
 */

class Process {
    constructor(id, queueLimit = 5) {
        this.id = id;
        this.queue = [];
        this.queueLimit = queueLimit;
        this.waiting = false;
        this.busy = false;
        this.messageCount = 0;
        this.bottleneckWarned = false;
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    }

    receiveMessage(msg) {
        this.queue.push({
            id: this.messageCount++,
            content: msg,
            timestamp: new Date().getTime(),
            displayTime: new Date().toLocaleTimeString()
        });

        this.busy = true;

        // Check if overloaded
        if (this.queue.length > this.queueLimit * 0.7) {
            this.waiting = true;
        }

        // Simulate processing
        setTimeout(() => {
            if (this.queue.length > 0) {
                this.queue.shift();
            }
            if (this.queue.length <= this.queueLimit * 0.3) {
                this.waiting = false;
            }
            this.busy = false;
        }, 1000 / getSpeed());
    }

    getState() {
        if (this.waiting) return 'blocked';
        if (this.busy) return 'busy';
        return 'idle';
    }

    getQueuePercentage() {
        return (this.queue.length / this.queueLimit) * 100;
    }
}

// Global state
let processes = [];
let messageHistory = [];
let alerts = [];
let deadlockDetected = false;
let messageAnimations = [];

function createProcess() {
    const queueLimit = parseInt(document.getElementById('queueLimit')?.value || 5);
    const id = processes.length + 1;
    const p = new Process(id, queueLimit);
    processes.push(p);
    log(`Process P${id} created`, 'success');
    updateUI();
    return p;
}

function createRandomProcess() {
    if (processes.length < 10) {
        createProcess();
    } else {
        logAlert('Maximum processes reached (10)', 'warning');
    }
}

function sendMessage(fromId, toId, messageText) {
    // Validation
    if (!messageText || messageText.trim() === '') {
        logAlert('Cannot send empty message', 'error');
        return;
    }

    const sender = processes[fromId - 1];
    const receiver = processes[toId - 1];

    if (!sender) {
        logAlert(`Process P${fromId} not found`, 'error');
        return;
    }

    if (!receiver) {
        logAlert(`Process P${toId} not found`, 'error');
        return;
    }

    if (fromId === toId) {
        logAlert('Cannot send message to self', 'error');
        return;
    }

    // Send the message
    receiver.receiveMessage(messageText);
    const messageObj = {
        id: messageHistory.length,
        from: fromId,
        to: toId,
        message: messageText,
        timestamp: new Date().getTime(),
        displayTime: new Date().toLocaleTimeString()
    };
    messageHistory.push(messageObj);

    // Add to timeline
    addTimelineItem(fromId, toId, messageText);

    // Add animation
    messageAnimations.push({
        from: fromId - 1,
        to: toId - 1,
        message: messageText,
        startTime: Date.now(),
        duration: 1000 / getSpeed()
    });

    log(`P${fromId} → P${toId}: "${messageText}"`, 'info');

    // Check deadlock
    if (document.getElementById('autoDetect')?.checked) {
        detectDeadlock();
    }

    updateUI();
}

function clearAll() {
    processes = [];
    messageHistory = [];
    alerts = [];
    deadlockDetected = false;
    messageAnimations = [];
    log('System cleared', 'warning');
    document.getElementById('logsDisplay').innerHTML = '';
    document.getElementById('timeline').innerHTML = '<p class="timeline-empty">Waiting for messages...</p>';
    updateUI();
}

function updateUI() {
    updateProcessContainer();
    updateStats();
    renderAlerts();
    renderAnalysis();
    drawNetwork();
}

function updateProcessContainer() {
    const container = document.getElementById('processContainer');

    if (processes.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <div class="empty-icon">⚡</div>
            <p>No processes created yet</p>
            <small>Click "Create Process" to begin</small>
        </div>`;
        return;
    }

    container.innerHTML = processes.map(p => {
        const queuePercent = p.getQueuePercentage();
        return `
            <div class="process-box ${p.getState() === 'busy' ? 'active' : ''}">
                <div class="process-header">
                    <div class="process-id">P${p.id}</div>
                    <div class="process-state state-${p.getState()}">${p.getState()}</div>
                </div>
                <div class="queue-info">
                    <div class="queue-label">Queue (${p.queue.length}/${p.queueLimit})</div>
                    <div class="queue-bar">
                        <div class="queue-fill" style="width: ${queuePercent}%"></div>
                    </div>
                    <div class="queue-items">
                        ${p.queue.length === 0
                            ? '<span class="queue-empty">Empty</span>'
                            : p.queue.map((msg, i) => `
                                <div class="queue-item ${queuePercent > 80 ? 'warning' : ''} ${queuePercent > 100 ? 'error' : ''}">
                                    ${msg.content.substring(0, 10)}${msg.content.length > 10 ? '...' : ''}
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
                <div class="process-stats">
                    <div class="stat">
                        <div>${p.messageCount}</div>
                        <small>Messages</small>
                    </div>
                    <div class="stat">
                        <div>${p.waiting ? '🔴' : '🟢'}</div>
                        <small>Status</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateStats() {
    document.getElementById('processCount').textContent = processes.length;
    document.getElementById('messageCount').textContent = messageHistory.length;

    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');

    if (deadlockDetected) {
        statusIcon.textContent = '🚨';
        statusText.textContent = 'Deadlock!';
    } else if (processes.some(p => p.waiting)) {
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'Warning';
    } else {
        statusIcon.textContent = '✅';
        statusText.textContent = 'Normal';
    }

    // Queue utilization
    if (processes.length > 0) {
        const avgUtil = (processes.reduce((sum, p) => sum + p.getQueuePercentage(), 0) / processes.length).toFixed(0);
        document.getElementById('queueUtil').textContent = avgUtil + '%';
    }
}

function addTimelineItem(from, to, msg) {
    const timeline = document.getElementById('timeline');
    if (timeline.innerHTML.includes('Waiting for messages')) {
        timeline.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
        <div class="timeline-time">${new Date().toLocaleTimeString()}</div>
        <div class="timeline-msg"><strong>P${from} → P${to}:</strong> "${msg}"</div>
    `;
    timeline.insertBefore(item, timeline.firstChild);

    // Keep only last 20 items
    while (timeline.children.length > 20) {
        timeline.removeChild(timeline.lastChild);
    }
}

function updateQueueLimit(value) {
    document.getElementById('queueLimit').value = value;
    processes.forEach(p => {
        p.queueLimit = parseInt(value);
    });
}

function simulateLoad() {
    if (processes.length < 2) {
        logAlert('Need at least 2 processes', 'warning');
        return;
    }

    log('Simulating load...', 'info');
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const from = Math.floor(Math.random() * processes.length) + 1;
            let to = Math.floor(Math.random() * processes.length) + 1;
            while (to === from) to = Math.floor(Math.random() * processes.length) + 1;

            sendMessage(from, to, `Load Test ${i + 1}`);
        }, i * 300);
    }
}

function testDeadlock() {
    if (processes.length < 3) {
        logAlert('Need at least 3 processes for deadlock test', 'warning');
        return;
    }

    log('Testing deadlock scenario...', 'warning');
    const indices = [0, 1, 2];
    
    // Create circular dependency
    sendMessage(1, 2, 'Waiting for P3');
    setTimeout(() => sendMessage(2, 3, 'Waiting for P1'), 300);
    setTimeout(() => sendMessage(3, 1, 'Waiting for P2'), 600);
}

function getSpeed() {
    return parseFloat(document.getElementById('speed')?.value || 1);
}

function terminals() {
    logAlert('Process exchange simulated', 'success', 'Messages routed through all processes');
    simulateLoad();
}
