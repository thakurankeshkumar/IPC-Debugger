function log(message) {
    const logbox = document.getElementById("logs");
    const p = document.createElement("p");
    p.textContent = message;
    logbox.appendChild(p);
}