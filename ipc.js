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