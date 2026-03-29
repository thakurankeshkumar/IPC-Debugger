class Process {
    constructor(id) {
        this.id = id;
        this.queue = [];
        this.waiting = false;
    }

    receiveMessage(msg) {
        this.queue.push(msg);
        log(`P${this.id} recieved: ${msg}`);
    }
}


const processes = []

function createProcess() {
    const id = processes.length + 1;
    const p = new Process(id);
    processes.push(p);
    log(`Process P${id} created`)
}

function sendMessage(fromId, toId, message) {
    const sender = processes[fromId - 1];
    const reciever = processes[toId - 1];
    if (!reciever) {
        log(`Error: Process P${toId} not found`);
        return;
    }
    reciever.receiveMessage(message);
    log(`P${fromId} → P${toId}: ${message}`);
}