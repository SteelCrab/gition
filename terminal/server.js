const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'terminal' });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active terminals
const terminals = new Map();

wss.on('connection', (ws, req) => {
    console.log('New terminal connection');

    // Parse query params for workspace/repo info
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('user_id');
    const repoName = url.searchParams.get('repo_name');

    // Determine working directory
    let cwd = '/repos';
    if (userId && repoName) {
        cwd = `/repos/${userId}/${repoName}`;
    }

    // Spawn a new PTY process
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: cwd,
        env: {
            ...process.env,
            TERM: 'xterm-256color'
        }
    });

    const terminalId = ptyProcess.pid;
    terminals.set(terminalId, { pty: ptyProcess, ws });

    console.log(`Terminal spawned: PID ${terminalId}, CWD: ${cwd}`);

    // Send terminal output to client
    ptyProcess.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'output', data }));
        }
    });

    // Handle terminal exit
    ptyProcess.onExit(({ exitCode }) => {
        console.log(`Terminal ${terminalId} exited with code ${exitCode}`);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
        }
        terminals.delete(terminalId);
    });

    // Handle client messages
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message);

            switch (msg.type) {
                case 'input':
                    ptyProcess.write(msg.data);
                    break;
                case 'resize':
                    if (msg.cols && msg.rows) {
                        ptyProcess.resize(msg.cols, msg.rows);
                    }
                    break;
                case 'cd':
                    // Change directory command
                    if (msg.path) {
                        ptyProcess.write(`cd ${msg.path}\r`);
                    }
                    break;
            }
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        console.log(`Terminal ${terminalId} closed by client`);
        ptyProcess.kill();
        terminals.delete(terminalId);
    });

    // Handle errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        ptyProcess.kill();
        terminals.delete(terminalId);
    });

    // Send initial connection success
    ws.send(JSON.stringify({
        type: 'connected',
        terminalId,
        cwd
    }));
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Terminal server running on port ${PORT}`);
});

// Graceful shutdown
['SIGTERM', 'SIGINT'].forEach(signal => {
    process.on(signal, () => {
        console.log(`${signal} received. Shutting down terminal server...`);
        terminals.forEach(({ pty }) => pty.kill());
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    });
});
