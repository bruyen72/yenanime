const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    delay
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const QRCode = require('qrcode');

// Global bot instance for persistence across requests
let sock = null;
let qrString = null;
let isConnected = false;
let saveCreds = null;

// Initialize bot connection
async function initializeBot() {
    try {
        console.log('Initializing WhatsApp bot...');

        // Use memory-based auth state for serverless
        const { state, saveCreds: save } = await useMultiFileAuthState('./session');
        saveCreds = save;

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: ['YenBot', 'Chrome', '1.0.0'],
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            retryRequestDelayMs: 3000,
            defaultQueryTimeoutMs: 60000,
            maxMsgRetryCount: 3
        });

        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('QR Code generated');
                qrString = await QRCode.toDataURL(qr);
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed due to', lastDisconnect?.error, ', reconnecting', shouldReconnect);

                if (shouldReconnect) {
                    await delay(5000);
                    initializeBot();
                }
            } else if (connection === 'open') {
                console.log('WhatsApp bot connected successfully!');
                isConnected = true;
                qrString = null;
            }
        });

        // Save credentials
        sock.ev.on('creds.update', saveCreds);

        // Handle messages
        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && msg.message) {
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

                if (text.toLowerCase() === 'ping') {
                    await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! Bot is working!' });
                }
            }
        });

        console.log('Bot initialized successfully');
        return sock;

    } catch (error) {
        console.error('Error initializing bot:', error);
        throw error;
    }
}

// Request pairing code
async function requestPairingCode(phoneNumber) {
    try {
        if (!sock) {
            await initializeBot();
        }

        const code = await sock.requestPairingCode(phoneNumber);
        return code;
    } catch (error) {
        console.error('Error requesting pairing code:', error);
        throw error;
    }
}

module.exports = async (req, res) => {
    try {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const url = new URL(req.url, `https://${req.headers.host}`);
        const pathname = url.pathname;

        // Initialize bot if not already done
        if (!sock) {
            try {
                await initializeBot();
            } catch (error) {
                console.error('Failed to initialize bot:', error);
            }
        }

        // Pairing endpoint
        if (pathname === '/pair' || pathname.includes('pair')) {
            const number = url.searchParams.get('number');

            if (!number) {
                return res.status(400).json({
                    error: 'Phone number is required',
                    message: 'Please provide a valid phone number'
                });
            }

            try {
                const cleanNumber = number.replace(/[^0-9]/g, '');
                const code = await requestPairingCode(cleanNumber);
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

                return res.status(200).json({
                    success: true,
                    code: formattedCode,
                    message: 'Pairing code generated successfully',
                    number: cleanNumber,
                    instructions: [
                        '1. Open WhatsApp on your phone',
                        '2. Go to Settings → Linked Devices',
                        '3. Tap "Link a Device"',
                        '4. Enter the code above'
                    ]
                });
            } catch (error) {
                console.error('Pairing error:', error);
                return res.status(500).json({
                    error: 'Failed to generate pairing code',
                    message: error.message
                });
            }
        }

        // QR endpoint
        if (pathname === '/qr' || pathname.includes('qr')) {
            if (!qrString) {
                return res.status(404).json({
                    error: 'QR code not available',
                    message: 'Bot is not generating QR code or already connected'
                });
            }

            return res.status(200).json({
                success: true,
                qr: qrString,
                instructions: [
                    'Scan this QR code with WhatsApp',
                    '1. Open WhatsApp on your phone',
                    '2. Go to Settings → Linked Devices',
                    '3. Tap "Link a Device"',
                    '4. Scan the QR code above'
                ]
            });
        }

        // Status endpoint
        if (pathname === '/status' || pathname.includes('status')) {
            return res.status(200).json({
                success: true,
                connected: isConnected,
                hasQR: !!qrString,
                botInitialized: !!sock,
                timestamp: new Date().toISOString()
            });
        }

        // Default endpoint
        return res.status(200).json({
            success: true,
            message: 'WhatsApp Bot API is running',
            endpoints: {
                '/pair?number=5511999999999': 'Generate pairing code',
                '/qr': 'Get QR code for scanning',
                '/status': 'Check bot status'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};