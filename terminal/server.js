const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const cors = require('cors');

const path = require('path');

const app = express();

// Hardened CORS configuration
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost,http://localhost:5173').split(',');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

const REPOS_BASE = path.resolve(process.env.REPOS_PATH || '/repos');

/**
 * Sanitize path components to prevent traversal
 */
function sanitizePath(component) {
    if (!component) return '';
    // Only allow alphanumeric, dots, underscores, hyphens
    return component.replace(/[^a-zA-Z0-9._-]/g, '');
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'terminal' });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active terminals
const terminals = new Map();

wss.on('connection', async (ws, req) => {
    // Parse query params for workspace/repo info
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('user_id');
    const repoName = url.searchParams.get('repo_name');
    const token = url.searchParams.get('token');

    // 1. Security: Authentication & Origin Check
    const origin = req.headers.origin;
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        console.error(`Terminal auth failed: Invalid origin ${origin}`);
        ws.close(4002, 'Forbidden: Invalid origin');
        return;
    }

    if (!token) {
        console.error('Terminal auth failed: No token provided');
        ws.close(4001, 'Unauthorized: No token provided');
        return;
    }

    try {
        // Verify token with GitHub
        const verifyRes = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!verifyRes.ok) {
            throw new Error('Invalid GitHub token');
        }
        const userData = await verifyRes.json();
        console.log(`User ${userData.login} authenticated for terminal`);
    } catch (err) {
        console.error('Terminal auth failed:', err.message);
        ws.close(4001, 'Unauthorized: Invalid token');
        return;
    }

    // 2. Security: Path Traversal Protection
    const sanitizedUser = sanitizePath(userId);
    const sanitizedRepo = sanitizePath(repoName);

    let cwd = REPOS_BASE;
    if (sanitizedUser && sanitizedRepo) {
        const targetDir = path.resolve(path.join(REPOS_BASE, sanitizedUser, sanitizedRepo));
        // Robust path traversal check using path.relative
        const rel = path.relative(REPOS_BASE, targetDir);
        if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
            cwd = targetDir;
        } else {
            console.error(`Blocked traversal attempt: ${targetDir}`);
            ws.close(4003, 'Forbidden: Invalid path');
            return;
        }
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
                case 'resize': {
                    const cols = parseInt(msg.cols);
                    const rows = parseInt(msg.rows);
                    // Validate bounds to prevent DoS or layout issues
                    if (Number.isInteger(cols) && cols > 0 && cols < 500 &&
                        Number.isInteger(rows) && rows > 0 && rows < 500) {
                        try {
                            ptyProcess.resize(cols, rows);
                        } catch (e) {
                            console.error('PTY resize failed:', e);
                        }
                    }
                    break;
                }
                case 'cd':
                    // Security: Removed programmatic 'cd' to prevent shell injection
                    // Users can still type 'cd' in the terminal directly
                    break;
            }
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    });

    // Safe cleanup helper
    const cleanup = () => {
        try {
            if (terminals.has(terminalId)) {
                console.log(`Cleaning up terminal ${terminalId}`);
                ptyProcess.kill();
                terminals.delete(terminalId);
            }
        } catch (err) {
            console.error('Error during PTY cleanup:', err);
        }
    };

    // Handle client disconnect
    ws.on('close', cleanup);

    // Handle errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        cleanup();
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
