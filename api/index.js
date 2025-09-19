// WhatsApp Business API Webhook Implementation for Vercel
// This uses the official WhatsApp Business Cloud API instead of Baileys

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'knight_bot_verify_token_2025';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const VERSION = 'v21.0'; // Latest WhatsApp API version

// In-memory storage for demo (use database in production)
let sessions = new Map();
let qrCodes = new Map();
let botStatus = {
    connected: false,
    lastActivity: null,
    totalMessages: 0
};

// Simulate QR code generation
function generateQRCode() {
    const qrData = `https://wa.me/qr/${Math.random().toString(36).substring(2, 15)}`;
    const qrId = Date.now().toString();
    qrCodes.set(qrId, {
        data: qrData,
        created: new Date(),
        scanned: false
    });
    return qrId;
}

// Simulate pairing code generation
function generatePairingCode(phoneNumber) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

    sessions.set(phoneNumber, {
        code: formattedCode,
        created: new Date(),
        verified: false,
        phoneNumber: phoneNumber
    });

    return formattedCode;
}

// Send WhatsApp message using Business API
async function sendWhatsAppMessage(to, message) {
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
        console.log('Missing WhatsApp credentials, simulating message send');
        return { success: true, message_id: 'sim_' + Date.now() };
    }

    try {
        const response = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: {
                    body: message
                }
            })
        });

        return await response.json();
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}

// Process incoming WhatsApp webhook
function processWhatsAppWebhook(body) {
    try {
        if (body.object === 'whatsapp_business_account') {
            body.entry?.forEach(entry => {
                entry.changes?.forEach(change => {
                    if (change.field === 'messages') {
                        const messages = change.value.messages;
                        messages?.forEach(async (message) => {
                            const from = message.from;
                            const text = message.text?.body || '';

                            botStatus.connected = true;
                            botStatus.lastActivity = new Date();
                            botStatus.totalMessages++;

                            // Auto-respond to specific messages
                            if (text.toLowerCase() === 'ping') {
                                await sendWhatsAppMessage(from, 'Pong! 🤖 Bot is working!');
                            } else if (text.toLowerCase() === 'status') {
                                await sendWhatsAppMessage(from, `Bot Status: Online ✅\nMessages processed: ${botStatus.totalMessages}\nLast activity: ${botStatus.lastActivity?.toLocaleString()}`);
                            } else if (text.toLowerCase().includes('help')) {
                                await sendWhatsAppMessage(from, 'Available commands:\n• ping - Test bot\n• status - Check status\n• help - Show this message');
                            }
                        });
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
}

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const url = new URL(req.url, `https://${req.headers.host}`);
        const pathname = url.pathname;

        // WhatsApp webhook verification (GET)
        if (req.method === 'GET' && (pathname === '/webhook' || pathname.includes('webhook'))) {
            const mode = url.searchParams.get('hub.mode');
            const token = url.searchParams.get('hub.verify_token');
            const challenge = url.searchParams.get('hub.challenge');

            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('Webhook verified successfully');
                return res.status(200).send(challenge);
            } else {
                console.log('Webhook verification failed');
                return res.status(403).send('Forbidden');
            }
        }

        // WhatsApp webhook endpoint (POST)
        if (req.method === 'POST' && (pathname === '/webhook' || pathname.includes('webhook'))) {
            processWhatsAppWebhook(req.body);
            return res.status(200).json({ status: 'success' });
        }

        // Pairing code endpoint
        if (pathname === '/pair' || pathname.includes('pair')) {
            const number = url.searchParams.get('number');

            if (!number) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number is required',
                    message: 'Please provide a valid phone number'
                });
            }

            try {
                const cleanNumber = number.replace(/[^0-9]/g, '');

                // Validate phone number length
                if (cleanNumber.length < 10 || cleanNumber.length > 15) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid phone number',
                        message: 'Phone number must be between 10-15 digits'
                    });
                }

                const code = generatePairingCode(cleanNumber);

                return res.status(200).json({
                    success: true,
                    code: code,
                    message: 'Pairing code generated successfully',
                    number: cleanNumber,
                    instructions: [
                        '1. Open WhatsApp Business on your phone',
                        '2. Go to Settings → Business tools → WhatsApp Business API',
                        '3. Enter the code above',
                        '4. Follow the verification process'
                    ],
                    note: 'This is a demo pairing code. For production, integrate with WhatsApp Business API.',
                    expires_in: '5 minutes'
                });
            } catch (error) {
                console.error('Pairing error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate pairing code',
                    message: error.message
                });
            }
        }

        // QR code endpoint
        if (pathname === '/qr' || pathname.includes('qr')) {
            try {
                const qrId = generateQRCode();
                const qrData = qrCodes.get(qrId);

                // Generate a simple QR code data URL (for demo)
                const qrCodeDataUrl = `data:image/svg+xml;base64,${Buffer.from(`
                    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                        <rect width="200" height="200" fill="white"/>
                        <rect x="20" y="20" width="160" height="160" fill="black"/>
                        <rect x="40" y="40" width="120" height="120" fill="white"/>
                        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">QR Demo</text>
                        <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="8" fill="black">${qrId.substring(0, 8)}</text>
                    </svg>
                `).toString('base64')}`;

                return res.status(200).json({
                    success: true,
                    qr: qrCodeDataUrl,
                    qr_id: qrId,
                    instructions: [
                        'Scan this QR code with WhatsApp Business',
                        '1. Open WhatsApp Business on your phone',
                        '2. Go to Settings → Business tools',
                        '3. Tap "Link a device" or "WhatsApp Web"',
                        '4. Scan the QR code above'
                    ],
                    note: 'This is a demo QR code. For production, integrate with WhatsApp Business API.',
                    expires_in: '60 seconds'
                });
            } catch (error) {
                console.error('QR generation error:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to generate QR code',
                    message: error.message
                });
            }
        }

        // Status endpoint
        if (pathname === '/status' || pathname.includes('status')) {
            const activeSessions = sessions.size;
            const activeQRs = Array.from(qrCodes.values()).filter(qr => !qr.scanned).length;

            return res.status(200).json({
                success: true,
                connected: botStatus.connected,
                bot_initialized: true,
                hasQR: activeQRs > 0,
                active_sessions: activeSessions,
                total_messages: botStatus.totalMessages,
                last_activity: botStatus.lastActivity,
                webhook_url: `${req.headers.host}/webhook`,
                api_version: VERSION,
                timestamp: new Date().toISOString(),
                status_details: {
                    whatsapp_business_api: ACCESS_TOKEN ? 'Configured' : 'Not configured',
                    phone_number_id: PHONE_NUMBER_ID ? 'Set' : 'Not set',
                    verify_token: VERIFY_TOKEN ? 'Set' : 'Not set'
                }
            });
        }

        // Test message endpoint
        if (pathname === '/test' || pathname.includes('test')) {
            const to = url.searchParams.get('to');
            const message = url.searchParams.get('message') || 'Test message from Knight Bot! 🤖';

            if (!to) {
                return res.status(400).json({
                    success: false,
                    error: 'Recipient number required',
                    message: 'Please provide a "to" parameter with the phone number'
                });
            }

            try {
                const result = await sendWhatsAppMessage(to, message);
                return res.status(200).json({
                    success: true,
                    message: 'Message sent successfully',
                    result: result
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to send message',
                    message: error.message
                });
            }
        }

        // Default API info endpoint
        return res.status(200).json({
            success: true,
            message: 'WhatsApp Business Bot API',
            version: '2.0.0',
            endpoints: {
                'GET /webhook': 'Webhook verification',
                'POST /webhook': 'Receive WhatsApp messages',
                'GET /pair?number=XXXXXXXXXX': 'Generate pairing code',
                'GET /qr': 'Generate QR code for linking',
                'GET /status': 'Check bot status',
                'GET /test?to=XXXXXXXXXX&message=TEXT': 'Send test message'
            },
            setup_guide: {
                '1': 'Set WHATSAPP_ACCESS_TOKEN environment variable',
                '2': 'Set PHONE_NUMBER_ID environment variable',
                '3': 'Set VERIFY_TOKEN environment variable',
                '4': 'Configure webhook URL in Meta Developer Console',
                '5': 'Use /pair or /qr endpoints to connect'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};