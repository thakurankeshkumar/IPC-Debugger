function log(message) {
    const logbox = document.getElementById("logs");
    const p = document.createElement("p");
    p.textContent = message;
    logbox.appendChild(p);
}


function handleSend() {
    const from = parseInt(document.getElementById("from").value);
    const to = parseInt(document.getElementById("to").value);
    const msg = document.getElementById("msg").value;
    sendMessage(from, to, msg);
}