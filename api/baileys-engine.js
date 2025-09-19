/**
 * Baileys WhatsApp Engine - Knight Bot
 * Sistema real usando biblioteca oficial Baileys
 */

const {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

const logger = require('./logger');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class BaileysWhatsAppEngine {
    constructor() {
        this.sock = null;
        this.authState = null;
        this.qrCode = null;
        this.pairingCode = null;
        this.isConnected = false;
        this.connectionState = 'disconnected';
        this.sessionPath = path.join(process.cwd(), 'auth_baileys');
        this.callbacks = {
            onQR: null,
            onPairing: null,
            onConnected: null,
            onDisconnected: null,
            onMessage: null
        };
    }

    async initialize() {
        try {
            // Busca versão mais recente do Baileys
            const { version, isLatest } = await fetchLatestBaileysVersion();
            logger.info('Baileys version check', { version, isLatest });

            // Configura autenticação multi-arquivo
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            this.authState = { state, saveCreds };

            logger.info('Baileys engine initialized', { session_path: this.sessionPath });
            return true;
        } catch (error) {
            logger.error('Failed to initialize Baileys engine', error);
            return false;
        }
    }

    async connect(options = {}) {
        try {
            if (!this.authState) {
                throw new Error('Engine not initialized. Call initialize() first.');
            }

            const socketOptions = {
                version: (await fetchLatestBaileysVersion()).version,
                auth: {
                    creds: this.authState.state.creds,
                    keys: makeCacheableSignalKeyStore(this.authState.state.keys, logger)
                },
                printQRInTerminal: false,
                browser: Browsers.macOS('Desktop'),
                generateHighQualityLinkPreview: true,
                ...options
            };

            this.sock = makeWASocket(socketOptions);
            this.setupEventHandlers();

            logger.whatsapp('CONNECTING', { browser: socketOptions.browser });
            return true;
        } catch (error) {
            logger.error('Failed to connect to WhatsApp', error);
            return false;
        }
    }

    setupEventHandlers() {
        // Atualização de conexão
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                await this.handleQRCode(qr);
            }

            if (connection === 'close') {
                this.isConnected = false;
                this.connectionState = 'disconnected';

                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                logger.whatsapp('DISCONNECTED', {
                    reason: lastDisconnect?.error?.message,
                    should_reconnect: shouldReconnect
                });

                if (this.callbacks.onDisconnected) {
                    this.callbacks.onDisconnected(lastDisconnect);
                }

                if (shouldReconnect) {
                    setTimeout(() => this.connect(), 5000);
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                this.connectionState = 'connected';
                logger.whatsapp('CONNECTED', { jid: this.sock.user?.id });

                if (this.callbacks.onConnected) {
                    this.callbacks.onConnected(this.sock.user);
                }
            } else if (connection === 'connecting') {
                this.connectionState = 'connecting';
                logger.whatsapp('CONNECTING');
            }
        });

        // Atualização de credenciais
        this.sock.ev.on('creds.update', this.authState.saveCreds);

        // Mensagens recebidas
        this.sock.ev.on('messages.upsert', async (m) => {
            const message = m.messages[0];
            if (!message.key.fromMe && m.type === 'notify') {
                logger.whatsapp('MESSAGE_RECEIVED', {
                    from: message.key.remoteJid,
                    message_type: Object.keys(message.message || {})[0]
                });

                if (this.callbacks.onMessage) {
                    this.callbacks.onMessage(message);
                }
            }
        });
    }

    async handleQRCode(qr) {
        try {
            this.qrCode = await QRCode.toDataURL(qr, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 400
            });

            logger.qr('GENERATED_BAILEYS', 'baileys_qr', {
                format: 'base64_png',
                size: '400x400'
            });

            if (this.callbacks.onQR) {
                this.callbacks.onQR(this.qrCode);
            }

            return this.qrCode;
        } catch (error) {
            logger.error('Failed to generate QR code from Baileys', error);
            return null;
        }
    }

    async requestPairingCode(phoneNumber) {
        try {
            if (!this.sock) {
                throw new Error('Socket not connected');
            }

            // Limpa número (remove caracteres não numéricos)
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

            // Solicita código de pareamento
            const code = await this.sock.requestPairingCode(cleanNumber);
            this.pairingCode = code;

            logger.pairing('REQUESTED_BAILEYS', 'baileys_pairing', {
                phone: phoneNumber,
                code: code,
                clean_number: cleanNumber
            });

            if (this.callbacks.onPairing) {
                this.callbacks.onPairing(code, phoneNumber);
            }

            return code;
        } catch (error) {
            logger.error('Failed to request pairing code', error, { phone: phoneNumber });
            return null;
        }
    }

    async sendMessage(to, message) {
        try {
            if (!this.isConnected || !this.sock) {
                throw new Error('WhatsApp not connected');
            }

            // Formata JID se necessário
            const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

            const result = await this.sock.sendMessage(jid, { text: message });

            logger.whatsapp('MESSAGE_SENT', {
                to: jid,
                message_id: result.key.id,
                timestamp: result.messageTimestamp
            });

            return result;
        } catch (error) {
            logger.error('Failed to send message', error, { to, message });
            return null;
        }
    }

    async getStatus() {
        return {
            connected: this.isConnected,
            connection_state: this.connectionState,
            user_info: this.sock?.user || null,
            qr_available: !!this.qrCode,
            pairing_code: this.pairingCode,
            session_exists: fs.existsSync(this.sessionPath),
            socket_open: this.sock?.ws?.readyState === 1
        };
    }

    async disconnect() {
        try {
            if (this.sock) {
                await this.sock.logout();
                this.sock = null;
            }
            this.isConnected = false;
            this.connectionState = 'disconnected';
            this.qrCode = null;
            this.pairingCode = null;

            logger.whatsapp('MANUALLY_DISCONNECTED');
            return true;
        } catch (error) {
            logger.error('Failed to disconnect properly', error);
            return false;
        }
    }

    async clearSession() {
        try {
            await this.disconnect();

            if (fs.existsSync(this.sessionPath)) {
                fs.rmSync(this.sessionPath, { recursive: true, force: true });
                logger.whatsapp('SESSION_CLEARED', { path: this.sessionPath });
            }

            return true;
        } catch (error) {
            logger.error('Failed to clear session', error);
            return false;
        }
    }

    // Métodos para configurar callbacks
    onQRCode(callback) {
        this.callbacks.onQR = callback;
    }

    onPairingCode(callback) {
        this.callbacks.onPairing = callback;
    }

    onConnected(callback) {
        this.callbacks.onConnected = callback;
    }

    onDisconnected(callback) {
        this.callbacks.onDisconnected = callback;
    }

    onMessage(callback) {
        this.callbacks.onMessage = callback;
    }
}

// Instância singleton
let engineInstance = null;

function getBaileysEngine() {
    if (!engineInstance) {
        engineInstance = new BaileysWhatsAppEngine();
    }
    return engineInstance;
}

module.exports = {
    BaileysWhatsAppEngine,
    getBaileysEngine
};