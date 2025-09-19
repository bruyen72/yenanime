/**
 * QR Code Generator - Knight Bot
 * Geração real de QR codes usando biblioteca qrcode
 */

const QRCode = require('qrcode');

/**
 * Gera QR code real para WhatsApp Business
 */
async function generateRealQRCode(data) {
    try {
        // Gera QR code como Data URL (base64)
        const qrCodeDataURL = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        });

        return {
            success: true,
            qr_data_url: qrCodeDataURL,
            format: 'base64',
            size: '300x300',
            type: 'PNG'
        };

    } catch (error) {
        console.error('Erro ao gerar QR code:', error);
        throw new Error(`Falha na geração do QR code: ${error.message}`);
    }
}

/**
 * Gera QR code como SVG
 */
async function generateQRCodeSVG(data) {
    try {
        const svgString = await QRCode.toString(data, {
            type: 'svg',
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        const svgDataURL = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

        return {
            success: true,
            qr_svg: svgDataURL,
            qr_raw_svg: svgString,
            format: 'SVG',
            size: '300x300'
        };

    } catch (error) {
        console.error('Erro ao gerar QR SVG:', error);
        throw new Error(`Falha na geração do QR SVG: ${error.message}`);
    }
}

/**
 * Gera QR code para WhatsApp Web
 */
async function generateWhatsAppQR() {
    try {
        // Simula dados do WhatsApp Web (formato real seria diferente)
        const whatsappData = {
            ref: `knight_bot_${Date.now()}`,
            server: 'web.whatsapp.com',
            session: Math.random().toString(36).substring(2, 15),
            timestamp: Date.now()
        };

        // Gera string no formato WhatsApp
        const qrData = `${whatsappData.ref},${whatsappData.server},${whatsappData.session},${whatsappData.timestamp}`;

        // Gera QR code real
        const qrResult = await generateRealQRCode(qrData);

        return {
            success: true,
            ...qrResult,
            whatsapp_data: whatsappData,
            instructions: [
                '1. Abra o WhatsApp no seu celular',
                '2. Vá em Configurações → Aparelhos conectados',
                '3. Toque em "Conectar um aparelho"',
                '4. Escaneie este QR code',
                '5. Aguarde a confirmação de conexão'
            ],
            expires_in: 60,
            type: 'whatsapp_web'
        };

    } catch (error) {
        console.error('Erro ao gerar QR WhatsApp:', error);
        throw error;
    }
}

/**
 * Gera QR code para pareamento direto
 */
async function generatePairingQR(phoneNumber, pairingCode) {
    try {
        // Dados do pareamento
        const pairingData = {
            phone: phoneNumber,
            code: pairingCode,
            service: 'knight_bot',
            timestamp: Date.now()
        };

        // String do QR code
        const qrString = JSON.stringify(pairingData);

        // Gera QR code
        const qrResult = await generateRealQRCode(qrString);

        return {
            success: true,
            ...qrResult,
            pairing_data: pairingData,
            instructions: [
                'QR Code para pareamento direto',
                '1. Escaneie com app compatível',
                '2. Confirme o código de pareamento',
                '3. Aguarde a verificação'
            ],
            expires_in: 300, // 5 minutos
            type: 'pairing'
        };

    } catch (error) {
        console.error('Erro ao gerar QR de pareamento:', error);
        throw error;
    }
}

/**
 * Valida se string pode ser convertida em QR
 */
function validateQRData(data) {
    if (!data || typeof data !== 'string') {
        return {
            valid: false,
            error: 'Dados inválidos para QR code'
        };
    }

    if (data.length > 4296) {
        return {
            valid: false,
            error: 'Dados muito longos para QR code (máximo 4296 caracteres)'
        };
    }

    return {
        valid: true,
        data_length: data.length
    };
}

module.exports = {
    generateRealQRCode,
    generateQRCodeSVG,
    generateWhatsAppQR,
    generatePairingQR,
    validateQRData
};