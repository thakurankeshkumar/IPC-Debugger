/**
 * Advanced Deadlock Detection Algorithm
 * Detects circular wait conditions in inter-process communication
 */

function detectDeadlock() {
    if (processes.length < 2) return;

    // Get all blocked processes
    const blockedProcesses = processes.filter(p => p.waiting);
    
    if (blockedProcesses.length === 0) {
        if (deadlockDetected) {
            deadlockDetected = false;
            logAlert('Deadlock resolved', 'success');
        }
        return;
    }

    // Check if all processes are blocked (potential deadlock)
    const totalBlocked = processes.filter(p => p.waiting || p.busy).length;
    const totalProcesses = processes.length;

    if (totalBlocked === totalProcesses && totalProcesses > 1) {
        if (!deadlockDetected) {
            deadlockDetected = true;
            const affectedProcesses = blockedProcesses.map(p => `P${p.id}`).join(', ');
            logAlert(
                `Deadlock detected among processes: ${affectedProcesses}`,
                'error',
                `All ${totalProcesses} processes are now blocked. No progress can be made.`
            );
            log('⚠️  DEADLOCK DETECTED! All processes are blocked.', 'error');
        }
    }

    // Detect high queue buildup (bottleneck)
    checkBottlenecks();
}

function checkBottlenecks() {
    processes.forEach(p => {
        const usagePercent = (p.queue.length / p.queueLimit) * 100;
        
        if (usagePercent > 80 && !p.bottleneckWarned) {
            p.bottleneckWarned = true;
            logAlert(
                `High queue usage in P${p.id}`,
                'warning',
                `Queue is ${usagePercent.toFixed(0)}% full (${p.queue.length}/${p.queueLimit})`
            );
            log(`⚠️  Bottleneck warning: P${p.id} queue at ${usagePercent.toFixed(0)}%`, 'warning');
        } else if (usagePercent <= 50) {
            p.bottleneckWarned = false;
        }
    });
}

function analyzeDeadlockRisk() {
    let riskLevel = 'LOW';
    let riskFactors = [];

    // Factor 1: Number of waiting processes
    const waitingCount = processes.filter(p => p.waiting).length;
    const waitingPercent = (waitingCount / processes.length) * 100;
    
    if (waitingPercent >= 75) {
        riskLevel = 'CRITICAL';
        riskFactors.push(`${waitingPercent.toFixed(0)}% of processes are waiting`);
    } else if (waitingPercent >= 50) {
        riskLevel = 'HIGH';
        riskFactors.push(`${waitingPercent.toFixed(0)}% of processes are waiting`);
    } else if (waitingPercent >= 25) {
        riskLevel = 'MEDIUM';
        riskFactors.push(`${waitingPercent.toFixed(0)}% of processes are waiting`);
    }

    // Factor 2: Queue congestion
    const congested = processes.filter(p => p.queue.length > p.queueLimit * 0.7).length;
    if (congested > 0) {
        riskFactors.push(`${congested} process(es) with high queue usage`);
        if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }

    // Factor 3: Total messages in system
    const totalQueueLength = processes.reduce((sum, p) => sum + p.queue.length, 0);
    if (totalQueueLength > processes.length * processes.length) {
        riskFactors.push('High total message count in system');
        if (riskLevel === 'LOW' || riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    }

    return { riskLevel, riskFactors };
}

function suggestOptimizations() {
    const suggestions = [];

    // Suggestion 1: Queue limit
    const avgQueueUsage = processes.reduce((sum, p) => sum + (p.queue.length / p.queueLimit), 0) / processes.length;
    if (avgQueueUsage > 0.7) {
        suggestions.push('Consider increasing queue limits for processes experiencing bottlenecks');
    }

    // Suggestion 2: Process count
    const totalMessages = processes.reduce((sum, p) => sum + p.messageCount, 0);
    if (processes.length < 3 && totalMessages > 10) {
        suggestions.push('Consider creating more processes to distribute load');
    }

    // Suggestion 3: Message patterns
    const messagePerProcess = messageHistory.length / Math.max(processes.length, 1);
    if (messagePerProcess > 5) {
        suggestions.push('High message volume detected - review communication patterns');
    }

    return suggestions;
}

function getDeadlockReport() {
    const { riskLevel, riskFactors } = analyzeDeadlockRisk();
    const suggestions = suggestOptimizations();

    return {
        status: deadlockDetected ? 'DETECTED' : 'NOT_DETECTED',
        riskLevel: riskLevel,
        blockedProcesses: processes.filter(p => p.waiting).map(p => p.id),
        riskFactors: riskFactors,
        suggestions: suggestions,
        timestamp: new Date().toLocaleTimeString(),
        totalMessages: messageHistory.length,
        totalProcesses: processes.length
    };
}
