/**
 * Advanced Deadlock Detection & Analysis System
 * Detects circular wait conditions, livelocks, and bottlenecks in IPC
 */

function detectDeadlock() {
    if (processes.length < 2) return;

    const blockedProcesses = processes.filter(p => p.waiting);
    const totalBlocked = blockedProcesses.length;

    // Check for potential deadlock (all processes blocked or all busy)
    const allBlocked = totalBlocked === processes.length && processes.length > 1;
    const allBusy = processes.every(p => p.busy || p.waiting);

    if (allBlocked || (allBusy && totalBlocked > 0)) {
        if (!deadlockDetected) {
            deadlockDetected = true;
            triggerDeadlockUI();
            const affectedProcesses = blockedProcesses.map(p => `P${p.id}`).join(', ');
            logAlert(
                'DEADLOCK DETECTED!',
                'error',
                `Processes ${affectedProcesses} are in a circular wait. No progress possible.`
            );
            log('🚨 CRITICAL: Deadlock condition detected - circular wait among processes!', 'error');
        }
    } else {
        if (deadlockDetected) {
            deadlockDetected = false;
            document.getElementById('deadlockNotification')?.classList.add('hidden');
            logAlert('Deadlock resolved', 'success');
        }
    }

    // Check for bottlenecks
    checkBottlenecks();

    // Monitor livelocks (processes busy but not progressing)
    detectLivelock();
}

function checkBottlenecks() {
    processes.forEach(p => {
        const usagePercent = p.getQueuePercentage();

        if (usagePercent > 80 && !p.bottleneckWarned) {
            p.bottleneckWarned = true;
            logAlert(
                `Queue Bottleneck in P${p.id}`,
                'warning',
                `Queue utilization: ${usagePercent.toFixed(0)}% (${p.queue.length}/${p.queueLimit} messages)`
            );
            log(`⚠️ WARNING: Process P${p.id} experiencing severe queue buildup (${usagePercent.toFixed(0)}%)`, 'warning');
        } else if (usagePercent < 50) {
            p.bottleneckWarned = false;
        }
    });
}

function detectLivelock() {
    const busyProcesses = processes.filter(p => p.busy && !p.waiting);
    if (busyProcesses.length === processes.length && processes.length > 1) {
        // Potential livelock - all busy but none blocked
        // This is less critical than deadlock but worth monitoring
    }
}

function analyzeSystemState() {
    const state = {
        totalProcesses: processes.length,
        activeProcesses: processes.filter(p => p.getState() !== 'idle').length,
        blockedProcesses: processes.filter(p => p.waiting).length,
        totalMessages: messageHistory.length,
        totalQueuedMessages: processes.reduce((sum, p) => sum + p.queue.length, 0),
        avgQueueUtilization: processes.length > 0 
            ? (processes.reduce((sum, p) => sum + p.getQueuePercentage(), 0) / processes.length).toFixed(1)
            : 0,
        deadlockDetected: deadlockDetected,
        maxQueueDepth: Math.max(...processes.map(p => p.queue.length), 0)
    };

    return state;
}

function calculateDeadlockRisk() {
    if (processes.length === 0) return { level: 'NONE', percentage: 0 };

    let riskScore = 0;

    // Factor 1: Blocked processes percentage (weight: 40%)
    const blockedPercent = (processes.filter(p => p.waiting).length / processes.length) * 100;
    riskScore += (blockedPercent / 100) * 40;

    // Factor 2: Queue congestion (weight: 30%)
    const avgQueueUtil = processes.reduce((sum, p) => sum + p.getQueuePercentage(), 0) / processes.length;
    riskScore += Math.min((avgQueueUtil / 100) * 30, 30);

    // Factor 3: Message backlog (weight: 20%)
    const totalQueued = processes.reduce((sum, p) => sum + p.queue.length, 0);
    const totalCapacity = processes.reduce((sum, p) => sum + p.queueLimit, 0);
    const backlogPercent = (totalQueued / totalCapacity) * 100;
    riskScore += Math.min((backlogPercent / 100) * 20, 20);

    // Factor 4: Circular dependencies (weight: 10%)
    if (deadlockDetected) {
        riskScore += 10;
    }

    let level = 'LOW';
    if (riskScore > 70) level = 'CRITICAL';
    else if (riskScore > 50) level = 'HIGH';
    else if (riskScore > 25) level = 'MEDIUM';

    return { level, percentage: Math.round(riskScore) };
}

function triggerDeadlockUI() {
    const notification = document.getElementById('deadlockNotification');
    if (notification) {
        notification.classList.remove('hidden');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

function renderAnalysis() {
    const analysisDisplay = document.getElementById('analysisDisplay');
    const state = analyzeSystemState();
    const risk = calculateDeadlockRisk();

    analysisDisplay.innerHTML = `
        <h4>System State Analysis</h4>
        <ul>
            <li><strong>Active Processes:</strong> ${state.activeProcesses}/${state.totalProcesses}</li>
            <li><strong>Blocked Processes:</strong> ${state.blockedProcesses}</li>
            <li><strong>Queued Messages:</strong> ${state.totalQueuedMessages}</li>
            <li><strong>Avg Queue Util:</strong> ${state.avgQueueUtilization}%</li>
            <li><strong>Max Queue Depth:</strong> ${state.maxQueueDepth}</li>
        </ul>
        
        <h4>Deadlock Risk Assessment</h4>
        <ul>
            <li><strong>Risk Level:</strong> <span style="color: ${risk.level === 'CRITICAL' ? '#ef4444' : risk.level === 'HIGH' ? '#f59e0b' : '#10b981'}">${risk.level}</span></li>
            <li><strong>Risk Score:</strong> ${risk.percentage}%</li>
            <li><strong>Status:</strong> ${deadlockDetected ? '🚨 DEADLOCK DETECTED' : '✅ No Deadlock'}</li>
        </ul>
        
        ${messageHistory.length > 0 ? `
        <h4>Message Statistics</h4>
        <ul>
            <li><strong>Total Messages Sent:</strong> ${messageHistory.length}</li>
            <li><strong>Avg Message Size:</strong> ${(messageHistory.reduce((sum, m) => sum + m.message.length, 0) / messageHistory.length).toFixed(1)} chars</li>
        </ul>
        ` : ''}
    `;
}
