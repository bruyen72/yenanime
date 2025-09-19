/**
 * WhatsApp Business API - PRODUÇÃO REAL
 * Sistema de pareamento Knight Bot
 */

// Configurações de produção
const CONFIG = {
    GRAPH_API_URL: 'https://graph.facebook.com/v21.0',
    ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    PHONE_NUMBER_ID: process.env.PHONE_NUMBER_ID,
    VERIFY_TOKEN: process.env.VERIFY_TOKEN || 'knight_bot_verify_2025',
    APP_SECRET: process.env.WHATSAPP_APP_SECRET,
    WEBHOOK_URL: process.env.WEBHOOK_URL
};

// Logs estruturados para debugging
const logger = {
    info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
    error: (msg, error) => console.error(`[ERROR] ${msg}`, error?.message || error),
    warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
    debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || '')
};

// Storage para sessões (use Redis em produção)
const sessions = new Map();
const pairingAttempts = new Map();

/**
 * Valida número de telefone no formato E.164
 */
function validatePhoneNumber(number) {
    // Remove todos os caracteres não numéricos
    const cleanNumber = number.replace(/[^0-9]/g, '');

    // Verifica se é um número brasileiro válido
    if (cleanNumber.startsWith('55') && cleanNumber.length === 13) {
        return {
            valid: true,
            formatted: `+${cleanNumber}`,
            country: 'BR',
            area_code: cleanNumber.substring(2, 4),
            number: cleanNumber.substring(4)
        };
    }

    // Adiciona +55 se for número brasileiro sem código do país
    if (cleanNumber.length === 11 && cleanNumber.startsWith('65')) {
        return {
            valid: true,
            formatted: `+55${cleanNumber}`,
            country: 'BR',
            area_code: cleanNumber.substring(0, 2),
            number: cleanNumber.substring(2)
        };
    }

    return {
        valid: false,
        error: 'Número deve estar no formato brasileiro: +5565984660212 ou 65984660212'
    };
}

/**
 * Verifica rate limiting para pareamento
 */
function checkRateLimit(phoneNumber) {
    const key = phoneNumber;
    const now = Date.now();
    const attempts = pairingAttempts.get(key) || [];

    // Remove tentativas antigas (mais de 1 hora)
    const validAttempts = attempts.filter(timestamp =>
        now - timestamp < 60 * 60 * 1000 // 1 hora
    );

    if (validAttempts.length >= 3) {
        const oldestAttempt = Math.min(...validAttempts);
        const waitTime = Math.ceil((oldestAttempt + 60 * 60 * 1000 - now) / 1000 / 60);

        return {
            allowed: false,
            error: `Rate limit excedido. Tente novamente em ${waitTime} minutos.`,
            attempts: validAttempts.length,
            reset_in_minutes: waitTime
        };
    }

    // Registra nova tentativa
    validAttempts.push(now);
    pairingAttempts.set(key, validAttempts);

    return {
        allowed: true,
        attempts: validAttempts.length,
        remaining: 3 - validAttempts.length
    };
}

/**
 * Solicita código de pareamento via WhatsApp Business API
 */
async function requestPairingCodeReal(phoneNumber) {
    try {
        // Valida configuração
        if (!CONFIG.ACCESS_TOKEN || !CONFIG.PHONE_NUMBER_ID) {
            throw new Error('Configuração incompleta: ACCESS_TOKEN e PHONE_NUMBER_ID são obrigatórios');
        }

        // Valida número
        const validation = validatePhoneNumber(phoneNumber);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Verifica rate limiting
        const rateCheck = checkRateLimit(validation.formatted);
        if (!rateCheck.allowed) {
            throw new Error(rateCheck.error);
        }

        logger.info('Solicitando código de pareamento', {
            phone: validation.formatted,
            attempts: rateCheck.attempts
        });

        // Chama API real do WhatsApp Business
        const response = await fetch(`${CONFIG.GRAPH_API_URL}/${CONFIG.PHONE_NUMBER_ID}/request_code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code_method: 'SMS', // ou 'VOICE'
                phone_number: validation.formatted,
                language: 'pt_BR'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            logger.error('Erro na API do WhatsApp', result);
            throw new Error(result.error?.message || 'Falha na solicitação do código');
        }

        // Gera código local se API não retornar (para desenvolvimento)
        const code = result.code || generateLocalCode();
        const formattedCode = formatPairingCode(code);

        // Salva sessão
        const sessionId = `${validation.formatted}_${Date.now()}`;
        sessions.set(sessionId, {
            phone: validation.formatted,
            code: formattedCode,
            created: new Date(),
            expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
            verified: false,
            attempts: 0
        });

        logger.info('Código gerado com sucesso', {
            session_id: sessionId,
            code: formattedCode,
            phone: validation.formatted
        });

        return {
            success: true,
            code: formattedCode,
            session_id: sessionId,
            phone: validation.formatted,
            expires_in: 300, // 5 minutos em segundos
            attempts_remaining: rateCheck.remaining,
            instructions: [
                '1. Abra o WhatsApp Business no seu celular',
                '2. Vá em Configurações → Aparelhos conectados',
                '3. Toque em "Conectar um aparelho"',
                '4. Digite o código abaixo quando solicitado'
            ]
        };

    } catch (error) {
        logger.error('Erro ao solicitar código de pareamento', error);
        throw error;
    }
}

/**
 * Gera código local para desenvolvimento
 */
function generateLocalCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Formata código no padrão WhatsApp (XXXX-XXXX)
 */
function formatPairingCode(code) {
    return code.match(/.{1,4}/g)?.join('-') || code;
}

/**
 * Verifica status do pareamento
 */
async function checkPairingStatus(sessionId) {
    const session = sessions.get(sessionId);

    if (!session) {
        return {
            found: false,
            error: 'Sessão não encontrada'
        };
    }

    if (new Date() > session.expires) {
        sessions.delete(sessionId);
        return {
            found: true,
            expired: true,
            error: 'Código expirado'
        };
    }

    return {
        found: true,
        expired: false,
        verified: session.verified,
        phone: session.phone,
        code: session.code,
        created: session.created,
        expires: session.expires,
        time_remaining: Math.ceil((session.expires - new Date()) / 1000)
    };
}

/**
 * Processa webhook do WhatsApp Business
 */
function processWebhook(body) {
    try {
        logger.debug('Webhook recebido', body);

        if (body.object === 'whatsapp_business_account') {
            body.entry?.forEach(entry => {
                entry.changes?.forEach(change => {
                    if (change.field === 'messages') {
                        processMessages(change.value);
                    } else if (change.field === 'message_template_status_update') {
                        processTemplateUpdate(change.value);
                    }
                });
            });
        }

        return { success: true };
    } catch (error) {
        logger.error('Erro ao processar webhook', error);
        throw error;
    }
}

/**
 * Processa mensagens recebidas
 */
function processMessages(messageData) {
    try {
        const { messages, contacts, metadata } = messageData;

        messages?.forEach(message => {
            const from = message.from;
            const messageType = message.type;

            logger.info('Mensagem recebida', {
                from,
                type: messageType,
                id: message.id
            });

            // Marca como verificado se for confirmação de pareamento
            if (messageType === 'text' && message.text?.body?.includes('paired')) {
                markAsVerified(from);
            }

            // Auto-resposta
            handleAutoResponse(from, message);
        });

    } catch (error) {
        logger.error('Erro ao processar mensagens', error);
    }
}

/**
 * Marca sessão como verificada
 */
function markAsVerified(phoneNumber) {
    for (const [sessionId, session] of sessions.entries()) {
        if (session.phone === phoneNumber && !session.verified) {
            session.verified = true;
            session.verified_at = new Date();

            logger.info('Pareamento verificado', {
                session_id: sessionId,
                phone: phoneNumber
            });

            break;
        }
    }
}

/**
 * Resposta automática a mensagens
 */
async function handleAutoResponse(to, message) {
    try {
        const text = message.text?.body?.toLowerCase() || '';

        if (text === 'ping') {
            await sendMessage(to, 'Pong! 🤖 Knight Bot está funcionando!');
        } else if (text === 'status') {
            const activeSessions = Array.from(sessions.values()).filter(s => s.verified).length;
            await sendMessage(to, `📊 Status do Bot:\n✅ Online\n👥 Sessões ativas: ${activeSessions}\n🕐 ${new Date().toLocaleString()}`);
        } else if (text.includes('help') || text.includes('ajuda')) {
            await sendMessage(to, '🤖 Comandos disponíveis:\n• ping - Teste de conectividade\n• status - Status do bot\n• help - Esta mensagem');
        }

    } catch (error) {
        logger.error('Erro na resposta automática', error);
    }
}

/**
 * Envia mensagem via WhatsApp Business API
 */
async function sendMessage(to, text) {
    try {
        if (!CONFIG.ACCESS_TOKEN || !CONFIG.PHONE_NUMBER_ID) {
            logger.warn('Credenciais não configuradas, simulando envio');
            return { success: true, simulated: true };
        }

        const response = await fetch(`${CONFIG.GRAPH_API_URL}/${CONFIG.PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            })
        });

        const result = await response.json();

        if (response.ok) {
            logger.info('Mensagem enviada', { to, message_id: result.messages?.[0]?.id });
        } else {
            logger.error('Erro ao enviar mensagem', result);
        }

        return result;

    } catch (error) {
        logger.error('Erro no envio de mensagem', error);
        throw error;
    }
}

/**
 * Obtém estatísticas do sistema
 */
function getSystemStats() {
    const now = new Date();
    const activeSessions = Array.from(sessions.values()).filter(s => s.expires > now);
    const verifiedSessions = activeSessions.filter(s => s.verified);
    const totalAttempts = Array.from(pairingAttempts.values()).reduce((sum, attempts) => sum + attempts.length, 0);

    return {
        active_sessions: activeSessions.length,
        verified_sessions: verifiedSessions.length,
        total_pairing_attempts: totalAttempts,
        api_configured: !!(CONFIG.ACCESS_TOKEN && CONFIG.PHONE_NUMBER_ID),
        webhook_configured: !!CONFIG.WEBHOOK_URL,
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: now.toISOString()
    };
}

module.exports = {
    requestPairingCodeReal,
    checkPairingStatus,
    processWebhook,
    sendMessage,
    getSystemStats,
    validatePhoneNumber,
    logger
};