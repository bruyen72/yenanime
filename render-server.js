const express = require('express');
const path = require('path');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.static(path.join(__dirname, 'plublic')));
app.use(express.json());

// Global variables
let botInstance = null;
let currentQR = null;
let pairingCodes = new Map();

// Health check endpoint (IMPORTANTE para Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        bot: botInstance ? 'connected' : 'disconnected',
        qr: currentQR ? 'available' : 'unavailable',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'plublic', 'index.html'));
});

// Pairing code endpoint
app.get('/pair', async (req, res) => {
    try {
        const { number } = req.query;

        if (!number) {
            return res.json({
                code: 'Erro: Número obrigatório',
                error: true
            });
        }

        // Simulate pairing code for now (when bot is not connected)
        if (!botInstance) {
            const mockCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const formattedCode = mockCode.match(/.{1,4}/g)?.join("-") || mockCode;

            return res.json({
                code: formattedCode,
                message: 'Código de demonstração gerado! (Bot em desenvolvimento)',
                instructions: [
                    '1. Abra o WhatsApp no seu celular',
                    '2. Vá em Configurações → Aparelhos conectados',
                    '3. Toque em "Conectar um aparelho"',
                    '4. Digite o código mostrado acima'
                ]
            });
        }

        // Real pairing code when bot is connected
        const cleanNumber = number.replace(/[^0-9]/g, '');

        try {
            const code = await botInstance.requestPairingCode(cleanNumber);
            const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

            res.json({
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
            res.json({
                code: 'Erro ao gerar código. Tente novamente.',
                error: true
            });
        }
    } catch (error) {
        console.error('Erro na rota /pair:', error);
        res.json({
            code: 'Serviço temporariamente indisponível',
            error: true
        });
    }
});

// QR code endpoint
app.get('/qr', async (req, res) => {
    try {
        if (!currentQR) {
            return res.json({
                qr: null,
                message: 'QR code será gerado quando o bot for iniciado...',
                instructions: [
                    'Aguarde o bot gerar um QR code',
                    'Ou use o método de código de pareamento'
                ]
            });
        }

        const qrImage = await QRCode.toDataURL(currentQR);

        res.json({
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
        console.error('Erro na rota /qr:', error);
        res.json({
            error: 'Erro ao gerar QR code',
            qr: null
        });
    }
});

// Functions for bot integration
function setBotInstance(bot) {
    botInstance = bot;
    console.log('🤖 Bot instance conectada ao servidor web');
}

function updateQR(qr) {
    currentQR = qr;
    console.log('📱 QR Code atualizado para interface web');
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Servidor web rodando na porta ${PORT}`);
    console.log(`📱 Interface disponível em: http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Erro no servidor:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, encerrando servidor...');
    server.close(() => {
        console.log('🌐 Servidor encerrado graciosamente');
        process.exit(0);
    });
});

module.exports = { setBotInstance, updateQR, server };