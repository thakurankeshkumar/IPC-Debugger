function detectDeadlock() {
    let blocked = processes.filter(p => p.waiting);
    if (blocked.length === processes.length && processes.length > 0) {
        log(`⚠️ Deadlock Detected!`)
    }
}


function sendMessage(fromId, toId, message) {
    const receiver = processes[toId - 1];

    if (receiver.queue.length > 3) {
        receiver.waiting = true;
        log(`P${toId} is overloaded → waiting`);
    }

    receiver.receiveMessage(message);
    detectDeadlock();
}