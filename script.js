/**
 * UI Handler, Logging, and Canvas Drawing Functions
 */

// Logging System
function log(message, type = 'info') {
    const logsDisplay = document.getElementById("logsDisplay");
    const entry = document.createElement("div");
    
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    entry.textContent = logMessage;
    entry.className = `log-entry ${type}`;
    
    logsDisplay.insertBefore(entry, logsDisplay.firstChild);
    
    // Keep only last 50 logs
    while (logsDisplay.children.length > 50) {
        logsDisplay.removeChild(logsDisplay.lastChild);
    }
}

function logAlert(title, type = 'warning', details = '') {
    const alert = {
        title: title,
        message: details || title,
        type: type,
        timestamp: new Date().toLocaleTimeString()
    };

    alerts.push(alert);

    // Keep only last 20 alerts
    if (alerts.length > 20) {
        alerts.shift();
    }

    renderAlerts();
}

function renderAlerts() {
    const alertsDisplay = document.getElementById('alertsDisplay');

    if (alerts.length === 0) {
        alertsDisplay.innerHTML = '<p class="empty">No alerts</p>';
        return;
    }

    alertsDisplay.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            <div class="alert-title">${alert.type === 'error' ? '❌' : alert.type === 'success' ? '✅' : '⚠️'} ${alert.title}</div>
            <div>${alert.message}</div>
            <div class="alert-time">${alert.timestamp}</div>
        </div>
    `).join('');
}

// Message Handling
function handleSend() {
    const from = parseInt(document.getElementById('from')?.value || 0);
    const to = parseInt(document.getElementById('to')?.value || 0);
    const msg = document.getElementById('msg')?.value || '';

    // Validation
    if (!from || !to || !msg.trim()) {
        logAlert('Invalid input', 'error', 'Please fill in all fields (From, To, and Message)');
        return;
    }

    sendMessage(from, to, msg);

    // Clear input
    document.getElementById('msg').value = '';
    document.getElementById('charCount').textContent = '0/50';
}

// Tab Switching
function switchTab(event, tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-panel`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    event.target.classList.add('active');
}

function clearLogs() {
    document.getElementById('logsDisplay').innerHTML = '';
    log('Logs cleared', 'info');
}

// Canvas Network Visualization
function drawNetwork() {
    const canvas = document.getElementById('networkCanvas');
    if (!canvas || processes.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Calculate process positions in a circle
    const radius = Math.min(width, height) / 2 - 60;
    const centerX = width / 2;
    const centerY = height / 2;

    const processPositions = processes.map((p, i) => {
        const angle = (i / processes.length) * Math.PI * 2;
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            process: p
        };
    });

    // Draw message animations
    messageAnimations.forEach((anim, idx) => {
        const elapsed = Date.now() - anim.startTime;
        const progress = Math.min(elapsed / anim.duration, 1);

        if (progress < 1) {
            const fromPos = processPositions[anim.from];
            const toPos = processPositions[anim.to];

            // Interpolate position
            const x = fromPos.x + (toPos.x - fromPos.x) * progress;
            const y = fromPos.y + (toPos.y - fromPos.y) * progress;

            // Draw message packet
            ctx.fillStyle = '#667eea';
            ctx.shadowColor = 'rgba(102, 126, 234, 0.8)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'transparent';

            // Draw message text
            ctx.fillStyle = '#f1f5f9';
            ctx.font = '10px Courier';
            ctx.textAlign = 'center';
            ctx.fillText(anim.message.substring(0, 3), x, y - 12);
        } else {
            // Remove completed animation
            messageAnimations.splice(idx, 1);
        }
    });

    // Draw process nodes
    processPositions.forEach(pos => {
        const p = pos.process;
        const isDeadlocked = p.waiting;
        const isBusy = p.busy;

        // Draw node circle
        ctx.fillStyle = isDeadlocked ? '#ef5350' : isBusy ? '#fbbf24' : '#60a5fa';
        ctx.shadowColor = isDeadlocked ? 'rgba(239, 83, 80, 0.6)' : isBusy ? 'rgba(251, 191, 36, 0.6)' : 'rgba(96, 165, 250, 0.3)';
        ctx.shadowBlur = isDeadlocked ? 15 : 8;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
        ctx.fill();

        // Draw border
        ctx.strokeStyle = isDeadlocked ? '#dc2626' : isBusy ? '#f59e0b' : '#60a5fa';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw process ID
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`P${p.id}`, pos.x, pos.y - 2);

        // Draw queue count
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px Arial';
        ctx.fillText(`Q:${p.queue.length}`, pos.x, pos.y + 12);

        ctx.shadowColor = 'transparent';
    });

    // Draw connections between processes
    ctx.strokeStyle = 'rgba(100, 150, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let i = 0; i < processPositions.length; i++) {
        for (let j = i + 1; j < processPositions.length; j++) {
            ctx.beginPath();
            ctx.moveTo(processPositions[i].x, processPositions[i].y);
            ctx.lineTo(processPositions[j].x, processPositions[j].y);
            ctx.stroke();
        }
    }

    ctx.setLineDash([]);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Enter key to send message
    document.getElementById('msg')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Character counter
    document.getElementById('msg')?.addEventListener('input', function() {
        document.getElementById('charCount').textContent = `${this.value.length}/50`;
    });

    // Speed slider
    document.getElementById('speed')?.addEventListener('input', function() {
        document.getElementById('speedValue').textContent = `${this.value}x`;
    });

    // Initialize UI
    updateUI();
    log('🚀 IPC Debugger initialized successfully', 'success');
    log('💡 Create processes and send messages to begin simulation', 'info');
});

// Auto-update UI and animation loop
let animationFrame;
function animate() {
    drawNetwork();
    updateUI();
    animationFrame = requestAnimationFrame(animate);
}
animate();

// Input validation
document.addEventListener('DOMContentLoaded', function() {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');

    [fromInput, toInput].forEach(input => {
        input?.addEventListener('input', function() {
            if (this.value < 1) this.value = '';
            if (this.value > 100) this.value = 100;
        });
    });
});
