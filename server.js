const express = require('express');
const path = require('path');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Global variables for bot instance
let botInstance = null;
let currentQR = null;

// Function to set bot instance (called from index.js)
function setBotInstance(bot) {
    botInstance = bot;
}

// Route for pairing code
app.get('/api/pair', async (req, res) => {
    try {
        const { number } = req.query;

        if (!number) {
            return res.json({ success: false, error: 'Número de telefone obrigatório' });
        }

        if (!botInstance) {
            return res.json({ success: false, error: 'Bot não conectado. Aguarde...' });
        }

        // Clean the phone number
        const cleanNumber = number.replace(/[^0-9]/g, '');

        try {
            const code = await botInstance.requestPairingCode(cleanNumber);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

            res.json({
                success: true,
                code: formattedCode,
                message: 'Código gerado com sucesso!',
                instructions: [
                    '1. Abra o WhatsApp no seu celular',
                    '2. Vá em Configurações → Aparelhos conectados',
                    '3. Toque em "Conectar um aparelho"',
                    '4. Digite o código mostrado acima'
                ]
            });
        } catch (error) {
            console.error('Erro ao gerar pairing code:', error);
            res.json({ success: false, error: 'Erro ao gerar código. Tente novamente.' });
        }
    } catch (error) {
        console.error('Erro na rota /api/pair:', error);
        res.json({ success: false, error: 'Serviço indisponível' });
    }
});

// Route for QR code
app.get('/api/qr', async (req, res) => {
    try {
        if (!currentQR) {
            return res.json({
                success: false,
                error: 'QR code não disponível',
                message: 'Aguarde o bot gerar um novo QR code...'
            });
        }

        // Generate QR code image
        const qrImage = await QRCode.toDataURL(currentQR);

        res.json({
            success: true,
            qr: qrImage,
            instructions: [
                'Escaneie este QR code com seu WhatsApp',
                '1. Abra o WhatsApp no seu celular',
                '2. Vá em Configurações → Aparelhos conectados',
                '3. Toque em "Conectar um aparelho"',
                '4. Escaneie o QR code acima'
            ]
        });
    } catch (error) {
        console.error('Erro na rota /api/qr:', error);
        res.json({ success: false, error: 'Erro ao gerar QR code' });
    }
});

// Function to update QR code
function updateQR(qr) {
    currentQR = qr;
    console.log('📱 QR Code atualizado para interface web');
}

// Route for bot status
app.get('/api/status', (req, res) => {
    const memUsage = process.memoryUsage();
    const isConnected = botInstance ? true : false;
    
    res.json({
        success: true,
        status: isConnected ? 'operational' : 'disconnected',
        version: '2.1.8',
        stats: {
            active_pairing_sessions: isConnected ? 1 : 0,
            active_qr_codes: currentQR ? 1 : 0,
            memory_usage: {
                rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
            }
        },
        features: {
            real_qr_generation: true,
            real_pairing_codes: true
        },
        environment_check: {
            node_version: process.version
        },
        timestamp: new Date().toISOString()
    });
});

// Route for mobile diagnostics
app.get('/api/diagnostics', (req, res) => {
    const userAgent = req.headers['user-agent'] || '';
    const isIos = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isChrome = /Chrome/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !isChrome;
    const isFirefox = /Firefox/.test(userAgent);
    const isWhatsApp = /WhatsApp/.test(userAgent);

    const platform = isIos ? 'iOS' : isAndroid ? 'Android' : 'Desktop';
    const compatibilityScore = isIos || isAndroid ? 85 : 75;
    const recommendedMethod = isIos || isAndroid ? 'qr' : 'pair';

    res.json({
        success: true,
        diagnostic_report: {
            device_detection: {
                device: {
                    is_ios: isIos,
                    is_android: isAndroid
                },
                browser: {
                    is_chrome: isChrome,
                    is_safari: isSafari,
                    is_firefox: isFirefox,
                    is_whatsapp: isWhatsApp
                }
            },
            validation: {
                requirements: [
                    'WhatsApp instalado no dispositivo',
                    'Conexão com internet estável',
                    'Número de telefone válido'
                ],
                warnings: []
            },
            diagnosis: {
                common_issues: [
                    'QR Code "inválido" - possível conexão Meta Business API',
                    'Pareamento falhando - verificar formato do número',
                    'Limitações de plataforma serverless'
                ],
                specific_solutions: [
                    'Use formato E.164 sem + (ex: 5511999999999)',
                    'Desconecte de outras APIs do WhatsApp',
                    'Tente método alternativo se um falhar'
                ]
            },
            summary: {
                platform: platform,
                compatibility_score: compatibilityScore,
                recommended_method: recommendedMethod
            }
        }
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor web rodando em http://0.0.0.0:${PORT}`);
    console.log(`📱 Interface de pairing disponível em: http://0.0.0.0:${PORT}`);
});

module.exports = { setBotInstance, updateQR, server };