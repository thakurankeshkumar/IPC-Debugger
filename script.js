/**
 * UI Handler and Logging Functions
 */

function log(message, type = 'info') {
    const logbox = document.getElementById("logs");
    const p = document.createElement("p");
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    p.textContent = logMessage;
    p.className = `log-${type}`;
    
    logbox.appendChild(p);
    
    // Auto scroll to bottom
    logbox.scrollTop = logbox.scrollHeight;
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
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event?.target?.classList?.add('active');
}

function clearLogs() {
    const logbox = document.getElementById("logs");
    logbox.innerHTML = '';
    log('Logs cleared', 'info');
}

// Keyboard shortcuts
document.addEventListener('DOMContentLoaded', function() {
    // Enter key to send message
    document.getElementById('msg')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // Initialize UI
    updateUI();
    log('IPC Debugger initialized', 'success');
    log('Waiting for process creation...', 'info');
});

// Auto-update UI periodically to show queue processing
setInterval(() => {
    // Process messages from queues
    processes.forEach(p => {
        if (p.queue.length > 0 && !p.waiting) {
            // Simulate processing
        }
    });
    updateUI();
}, 500);

// Add data validation to input fields
document.addEventListener('DOMContentLoaded', function() {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    
    [fromInput, toInput].forEach(input => {
        input?.addEventListener('input', function() {
            if (this.value < 1) this.value = '';
        });
    });
});
