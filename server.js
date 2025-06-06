const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let sock;
let isConnected = false;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Generate QR code as Data URL
            const qrDataUrl = await qrcode.toDataURL(qr);
            io.emit('qr', qrDataUrl);
        }

        if (connection === 'open') {
            isConnected = true;
            io.emit('connected', true);
            console.log('✅ WhatsApp connection established!');
        } else if (connection === 'close') {
            isConnected = false;
            io.emit('connected', false);
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        }
    });

    // Example message handler
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.key.fromMe && msg.message?.conversation) {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello from your web QR bot!' });
        }
    });
}

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('Frontend connected');
    if (isConnected) {
        socket.emit('connected', true);
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    connectToWhatsApp().catch(console.error);
});