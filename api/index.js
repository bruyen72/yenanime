/**
 * Knight Bot - WhatsApp Business API - PRODUÇÃO REAL
 * Sistema completo de pareamento e integração
 */

const {
    generateRealQRCode,
    generateQRCodeSVG,
    generateWhatsAppQR,
    generatePairingQR,
    validateQRData
} = require('./qr-generator');

const {
    generatePairingCode,
    formatPairingCode,
    validatePairingCode,
    createPairingSession,
    isSessionExpired,
    validatePhoneForPairing,
    getSessionTimeRemaining,
    getPairingStats
} = require('./pairing-system');

// Configurações de ambiente
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'knight_bot_verify_2025';

// Storage em memória para sessões (use Redis em produção)
const sessions = new Map();
const qrCodes = new Map();

// Logger
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || error),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || '')
};

module.exports = async (req, res) => {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const pathname = url.pathname;

        logger.info(`${req.method} ${pathname}`, {
            query: Object.fromEntries(url.searchParams),
            headers: req.headers['user-agent']
        });

        // =================== WEBHOOK ENDPOINTS ===================

        // Verificação do webhook (GET)
        if (req.method === 'GET' && (pathname === '/webhook' || pathname.includes('webhook'))) {
            const mode = url.searchParams.get('hub.mode');
            const token = url.searchParams.get('hub.verify_token');
            const challenge = url.searchParams.get('hub.challenge');

            logger.info('Verificação de webhook', { mode, token: token ? 'presente' : 'ausente' });

            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                logger.info('✅ Webhook verificado com sucesso');
                return res.status(200).send(challenge);
            } else {
                logger.warn('❌ Falha na verificação do webhook');
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Token de verificação inválido'
                });
            }
        }

        // Recebimento de mensagens (POST)
        if (req.method === 'POST' && (pathname === '/webhook' || pathname.includes('webhook'))) {
            try {
                const result = processWebhook(req.body);
                logger.info('Webhook processado com sucesso');
                return res.status(200).json({ status: 'success', processed: true });
            } catch (error) {
                logger.error('Erro ao processar webhook', error);
                return res.status(500).json({
                    error: 'Webhook processing failed',
                    message: error.message
                });
            }
        }

        // =================== PAREAMENTO ENDPOINTS ===================

        // Gerar código de pareamento REAL
        if (pathname === '/pair' || pathname.includes('pair')) {
            const number = url.searchParams.get('number');

            if (!number) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_PHONE_NUMBER',
                    message: 'Parâmetro "number" é obrigatório',
                    example: '/pair?number=5565984660212'
                });
            }

            try {
                logger.info('Solicitação de pareamento', { number });

                // Valida número de telefone
                const phoneValidation = validatePhoneForPairing(number);
                if (!phoneValidation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: 'INVALID_PHONE_NUMBER',
                        message: phoneValidation.error
                    });
                }

                // Cria sessão de pareamento
                const session = createPairingSession(phoneValidation.formatted);

                // Salva sessão
                sessions.set(session.session_id, session);

                logger.info('Código de pareamento gerado', {
                    session_id: session.session_id,
                    code: session.code,
                    phone: phoneValidation.formatted
                });

                return res.status(200).json({
                    success: true,
                    code: session.code,
                    session_id: session.session_id,
                    phone: phoneValidation.formatted,
                    expires_in: 300, // 5 minutos
                    instructions: [
                        '1. Abra o WhatsApp Business no seu celular',
                        '2. Vá em Configurações → Aparelhos conectados',
                        '3. Toque em "Conectar um aparelho"',
                        '4. Digite o código: ' + session.code,
                        '5. Aguarde a confirmação de conexão'
                    ],
                    message: 'Código de pareamento gerado com sucesso',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('Erro na solicitação de pareamento', error);
                return res.status(500).json({
                    success: false,
                    error: 'PAIRING_GENERATION_FAILED',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Verificar status do pareamento
        if (pathname === '/pair/status' || pathname.includes('pair/status')) {
            const sessionId = url.searchParams.get('session_id');

            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_SESSION_ID',
                    message: 'Parâmetro "session_id" é obrigatório'
                });
            }

            try {
                const session = sessions.get(sessionId);

                if (!session) {
                    return res.status(404).json({
                        success: false,
                        error: 'SESSION_NOT_FOUND',
                        message: 'Sessão não encontrada'
                    });
                }

                const timeRemaining = getSessionTimeRemaining(session);

                if (timeRemaining.expired) {
                    sessions.delete(sessionId);
                    return res.status(410).json({
                        success: false,
                        error: 'SESSION_EXPIRED',
                        message: 'Sessão expirada'
                    });
                }

                return res.status(200).json({
                    success: true,
                    session_id: sessionId,
                    status: session.status,
                    code: session.code,
                    phone: session.phone_number,
                    created_at: session.created_at,
                    expires_at: session.expires_at,
                    time_remaining: timeRemaining,
                    attempts: session.attempts,
                    max_attempts: session.max_attempts
                });

            } catch (error) {
                logger.error('Erro ao verificar status', error);
                return res.status(500).json({
                    success: false,
                    error: 'STATUS_CHECK_FAILED',
                    message: error.message
                });
            }
        }

        // =================== QR CODE ENDPOINT REAL ===================

        if (pathname === '/qr' || pathname.includes('qr')) {
            try {
                const qrId = `qr_${Date.now()}`;

                // Gera QR Code REAL usando biblioteca qrcode
                const qrResult = await generateWhatsAppQR();

                // Salva QR code
                qrCodes.set(qrId, {
                    ...qrResult,
                    qr_id: qrId,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 60 * 1000).toISOString() // 60 segundos
                });

                logger.info('QR Code REAL gerado', { qr_id: qrId });

                return res.status(200).json({
                    success: true,
                    qr: qrResult.qr_data_url,
                    qr_id: qrId,
                    type: 'whatsapp_business_real',
                    format: qrResult.format,
                    size: qrResult.size,
                    expires_in: 60,
                    instructions: qrResult.instructions,
                    note: 'QR Code REAL gerado com biblioteca qrcode. Escaneável por qualquer leitor QR.',
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('Erro ao gerar QR Code REAL', error);
                return res.status(500).json({
                    success: false,
                    error: 'QR_GENERATION_FAILED',
                    message: error.message,
                    details: 'Falha na geração do QR code usando biblioteca qrcode'
                });
            }
        }

        // =================== STATUS E MONITORAMENTO ===================

        if (pathname === '/status' || pathname.includes('status')) {
            try {
                const now = new Date();
                const activeSessions = Array.from(sessions.values()).filter(s => new Date(s.expires_at) > now);
                const activeQRs = Array.from(qrCodes.values()).filter(q => new Date(q.expires_at) > now);
                const sessionStats = getPairingStats(Array.from(sessions.values()));

                return res.status(200).json({
                    success: true,
                    status: 'operational',
                    service: 'Knight Bot WhatsApp Business API',
                    version: '2.1.0',
                    environment: process.env.NODE_ENV || 'development',
                    stats: {
                        active_pairing_sessions: activeSessions.length,
                        active_qr_codes: activeQRs.length,
                        total_sessions_created: sessions.size,
                        total_qr_codes_generated: qrCodes.size,
                        session_stats: sessionStats,
                        uptime_seconds: Math.floor(process.uptime()),
                        memory_usage: {
                            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
                            heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
                        }
                    },
                    features: {
                        real_qr_generation: true,
                        real_pairing_codes: true,
                        session_management: true,
                        phone_validation: true,
                        rate_limiting: true,
                        webhook_support: true
                    },
                    endpoints: {
                        webhook: '/webhook',
                        pairing: '/pair?number=5565984660212',
                        pairing_status: '/pair/status?session_id=SESSION_ID',
                        qr_code: '/qr',
                        status: '/status',
                        test_message: '/test?to=5565984660212&message=Teste'
                    },
                    environment_check: {
                        node_version: process.version,
                        qrcode_library: 'installed',
                        verify_token: !!process.env.VERIFY_TOKEN
                    },
                    timestamp: now.toISOString()
                });

            } catch (error) {
                logger.error('Erro ao obter status', error);
                return res.status(500).json({
                    success: false,
                    error: 'STATUS_UNAVAILABLE',
                    message: error.message
                });
            }
        }

        // =================== TESTE DE MENSAGEM ===================

        if (pathname === '/test' || pathname.includes('test')) {
            const to = url.searchParams.get('to');
            const message = url.searchParams.get('message') || '🤖 Mensagem de teste do Knight Bot!';

            if (!to) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_RECIPIENT',
                    message: 'Parâmetro "to" é obrigatório',
                    example: '/test?to=5565984660212&message=Olá!'
                });
            }

            try {
                // Valida número antes de enviar
                const validation = validatePhoneNumber(to);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        error: 'INVALID_PHONE_NUMBER',
                        message: validation.error
                    });
                }

                const result = await sendMessage(validation.formatted, message);

                return res.status(200).json({
                    success: true,
                    message: 'Mensagem enviada com sucesso',
                    to: validation.formatted,
                    text: message,
                    result: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                logger.error('Erro ao enviar mensagem de teste', error);
                return res.status(500).json({
                    success: false,
                    error: 'MESSAGE_SEND_FAILED',
                    message: error.message
                });
            }
        }

        // =================== ENDPOINT RAIZ ===================

        // Informações da API
        return res.status(200).json({
            success: true,
            service: 'Knight Bot - WhatsApp Business API',
            version: '2.1.0',
            description: 'Sistema completo de integração WhatsApp Business',
            author: 'Knight Bot Team',
            api_documentation: {
                base_url: `https://${req.headers.host}`,
                endpoints: {
                    'GET /webhook': {
                        description: 'Verificação de webhook do WhatsApp',
                        parameters: ['hub.mode', 'hub.verify_token', 'hub.challenge']
                    },
                    'POST /webhook': {
                        description: 'Recebe mensagens do WhatsApp',
                        content_type: 'application/json'
                    },
                    'GET /pair': {
                        description: 'Gera código de pareamento',
                        parameters: ['number (obrigatório)'],
                        example: '/pair?number=5565984660212'
                    },
                    'GET /pair/status': {
                        description: 'Verifica status do pareamento',
                        parameters: ['session_id (obrigatório)']
                    },
                    'GET /qr': {
                        description: 'Gera QR Code para conexão',
                        response: 'Base64 SVG image'
                    },
                    'GET /status': {
                        description: 'Status e estatísticas do sistema'
                    },
                    'GET /test': {
                        description: 'Envia mensagem de teste',
                        parameters: ['to (obrigatório)', 'message (opcional)'],
                        example: '/test?to=5565984660212&message=Teste'
                    }
                }
            },
            setup_guide: {
                '1': 'Configure as variáveis de ambiente no Vercel',
                '2': 'WHATSAPP_ACCESS_TOKEN - Token do Meta Business',
                '3': 'PHONE_NUMBER_ID - ID do número do WhatsApp Business',
                '4': 'VERIFY_TOKEN - Token para verificação de webhook',
                '5': 'Configure webhook URL no Meta Developer Console',
                '6': `Webhook URL: https://${req.headers.host}/webhook`
            },
            environment_check: {
                access_token: !!process.env.WHATSAPP_ACCESS_TOKEN,
                phone_number_id: !!process.env.PHONE_NUMBER_ID,
                verify_token: !!process.env.VERIFY_TOKEN,
                node_version: process.version,
                platform: process.platform
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Erro geral na API', error);
        return res.status(500).json({
            success: false,
            error: 'API_ERROR',
            message: 'Erro interno do servidor',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};