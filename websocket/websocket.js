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
        this.connection = new WebSocket.Server({ port: config.get('websocket.port') });
        this.connection.on('listening', () => {
            console.log(`WebSocket server is running on port ${config.get('websocket.port')}`);
        });

        this.connection.on('connection', (ws) => {
            console.log('WebSocket client connected');
        });

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
