const WebSocket = require('ws');
const config = require('config');


class GlobalWebSocket {
    constructor() {
        if (!GlobalWebSocket.instance) {
            this.init();
        }

        return GlobalWebSocket.instance;
    }

    init() {
        this.connection = new WebSocket.Server({ host: config.get('websocket.host'), port: config.get('websocket.port') });
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
