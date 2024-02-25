const WebSocket = require('ws');


class GlobalWebSocket {
    constructor() {
        if (!GlobalWebSocket.instance) {
            this.init();
        }

        return GlobalWebSocket.instance;
    }

    init() {
        this.connection = new WebSocket.Server({ host: 'localhost', port: 4080 });
        GlobalWebSocket.instance = this;
    }

    sendMessage(message) {
        this.connection.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

const instance = new GlobalWebSocket();
Object.freeze(instance);

module.exports = instance;
