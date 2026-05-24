import {WebSocket, WebSocketServer} from 'ws';
import {httpArcjet, wsArcjet} from "../arcjet.js";

function sendJson(socket, payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload){
    for(const client of wss.clients){
        if(client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server){
    const wss = new WebSocketServer({
        noServer: true,
        maxPayload: 1024 * 1024,
    });

    // Protect the WebSocket handshake on the HTTP upgrade path
    server.on('upgrade', async (req, socket, head) => {
        try {
            const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            if (pathname !== '/ws') {
                // Not our path; let other handlers process or reject
                return;
            }

            if (wsArcjet) {
                const decision = await wsArcjet.protect(req);
                if (decision.isDenied()) {
                    const isRL = decision.reason?.isRateLimit?.() === true;
                    const status = isRL ? 429 : 401;
                    const text = isRL ? 'Too Many Requests' : 'Unauthorized';
                    const body = isRL ? 'Rate limit exceeded' : 'Access denied';

                    try {
                        const payload = `HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
                        socket.write(payload);
                    } catch {}
                    socket.destroy();
                    return;
                }
            }

            // Allowed — complete the WebSocket handshake
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req);
            });
        } catch (e) {
            // Failed before handshake completed; send 500 and destroy
            const status = 500;
            const text = 'Internal Server Error';
            const body = 'Server security error.';
            try {
                const payload = `HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
                socket.write(payload);
            } catch {}
            socket.destroy();
        }
    });

    wss.on('connection', (socket, req) => {
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });

        sendJson(socket, { type: 'welcome' });
        socket.on('error', console.error);
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        }, 30000);
    });

    wss.on('close', () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: 'match_created', data: match });
    };

    return { broadcastMatchCreated };
}
