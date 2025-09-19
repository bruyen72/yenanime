/**
 * Sistema de Pareamento - Knight Bot
 * Geração e validação de códigos de pareamento
 */

/**
 * Gera código de pareamento real
 */
function generatePairingCode() {
    // Caracteres permitidos (evita confusão: sem 0, O, I, 1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
    if (!code || code.length !== 8) {
        throw new Error('Código deve ter exatamente 8 caracteres');
    }

    return `${code.substring(0, 4)}-${code.substring(4, 8)}`;
}

/**
 * Valida formato do código de pareamento
 */
function validatePairingCode(code) {
    // Remove hífens e converte para maiúsculo
    const cleanCode = code.replace(/[-\s]/g, '').toUpperCase();

    // Verifica formato
    const isValid = /^[A-Z0-9]{8}$/.test(cleanCode);

    return {
        valid: isValid,
        cleaned: cleanCode,
        formatted: isValid ? formatPairingCode(cleanCode) : null,
        error: isValid ? null : 'Código deve ter 8 caracteres alfanuméricos'
    };
}

/**
 * Gera sessão de pareamento completa
 */
function createPairingSession(phoneNumber) {
    const code = generatePairingCode();
    const formattedCode = formatPairingCode(code);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const session = {
        session_id: sessionId,
        phone_number: phoneNumber,
        code: formattedCode,
        code_raw: code,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
        status: 'pending',
        attempts: 0,
        max_attempts: 3
    };

    return session;
}

/**
 * Verifica se sessão expirou
 */
function isSessionExpired(session) {
    return new Date() > new Date(session.expires_at);
}

/**
 * Verifica se sessão atingiu limite de tentativas
 */
function isSessionLimitReached(session) {
    return session.attempts >= session.max_attempts;
}

/**
 * Atualiza tentativa da sessão
 */
function incrementSessionAttempts(session) {
    return {
        ...session,
        attempts: session.attempts + 1,
        last_attempt: new Date().toISOString()
    };
}

/**
 * Marca sessão como verificada
 */
function markSessionAsVerified(session) {
    return {
        ...session,
        status: 'verified',
        verified_at: new Date().toISOString()
    };
}

/**
 * Gera código de verificação SMS (para desenvolvimento)
 */
function generateSMSCode() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
}

/**
 * Simula envio de SMS (para desenvolvimento)
 */
async function sendSMSCode(phoneNumber, code) {
    // Em produção, integraria com serviço de SMS real
    console.log(`[SMS] Enviando para ${phoneNumber}: Seu código é ${code}`);

    return {
        success: true,
        phone: phoneNumber,
        code: code,
        provider: 'simulation',
        sent_at: new Date().toISOString()
    };
}

/**
 * Valida número de telefone para pareamento
 */
function validatePhoneForPairing(phoneNumber) {
    // Remove caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Verifica se é número brasileiro válido
    let formatted;
    let valid = false;

    if (cleanNumber.startsWith('55') && cleanNumber.length === 13) {
        // Já tem código do país
        formatted = `+${cleanNumber}`;
        valid = true;
    } else if (cleanNumber.length === 11 && /^[1-9][1-9]9/.test(cleanNumber)) {
        // Número brasileiro sem código do país
        formatted = `+55${cleanNumber}`;
        valid = true;
    } else if (cleanNumber.length === 10 && /^[1-9][1-9]/.test(cleanNumber)) {
        // Número fixo brasileiro
        formatted = `+55${cleanNumber}`;
        valid = true;
    }

    if (!valid) {
        return {
            valid: false,
            error: 'Número deve ser brasileiro válido (ex: 11999999999 ou 5511999999999)'
        };
    }

    return {
        valid: true,
        original: phoneNumber,
        cleaned: cleanNumber,
        formatted: formatted,
        country: 'BR',
        type: cleanNumber.length === 11 ? 'mobile' : 'landline'
    };
}

/**
 * Calcula tempo restante da sessão
 */
function getSessionTimeRemaining(session) {
    const now = new Date();
    const expires = new Date(session.expires_at);
    const remaining = expires - now;

    if (remaining <= 0) {
        return {
            expired: true,
            remaining_ms: 0,
            remaining_seconds: 0,
            remaining_minutes: 0
        };
    }

    return {
        expired: false,
        remaining_ms: remaining,
        remaining_seconds: Math.ceil(remaining / 1000),
        remaining_minutes: Math.ceil(remaining / 1000 / 60)
    };
}

/**
 * Estatísticas do sistema de pareamento
 */
function getPairingStats(sessions) {
    const now = new Date();
    const activeSessions = sessions.filter(s => new Date(s.expires_at) > now);
    const verifiedSessions = sessions.filter(s => s.status === 'verified');
    const expiredSessions = sessions.filter(s => new Date(s.expires_at) <= now);

    return {
        total_sessions: sessions.length,
        active_sessions: activeSessions.length,
        verified_sessions: verifiedSessions.length,
        expired_sessions: expiredSessions.length,
        success_rate: sessions.length > 0 ? (verifiedSessions.length / sessions.length * 100).toFixed(2) : 0
    };
}

module.exports = {
    generatePairingCode,
    formatPairingCode,
    validatePairingCode,
    createPairingSession,
    isSessionExpired,
    isSessionLimitReached,
    incrementSessionAttempts,
    markSessionAsVerified,
    generateSMSCode,
    sendSMSCode,
    validatePhoneForPairing,
    getSessionTimeRemaining,
    getPairingStats
};