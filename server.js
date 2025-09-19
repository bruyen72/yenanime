const express = require('express');
const path = require('path');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 10000;

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
app.get('/pair', async (req, res) => {
    try {
        const { number } = req.query;

        if (!number) {
            return res.json({ error: 'Número de telefone obrigatório' });
        }

        if (!botInstance) {
            return res.json({ code: 'Bot não conectado. Aguarde...' });
        }

        // Clean the phone number
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
            console.error('Erro ao gerar pairing code:', error);
            res.json({ code: 'Erro ao gerar código. Tente novamente.' });
        }
    } catch (error) {
        console.error('Erro na rota /pair:', error);
        res.json({ code: 'Serviço indisponível' });
    }
});

// Route for QR code
app.get('/qr', async (req, res) => {
    try {
        if (!currentQR) {
            return res.json({
                error: 'QR code não disponível',
                message: 'Aguarde o bot gerar um novo QR code...'
            });
        }

        // Generate QR code image
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
        res.json({ error: 'Erro ao gerar QR code' });
    }
});

// Function to update QR code
function updateQR(qr) {
    currentQR = qr;
    console.log('📱 QR Code atualizado para interface web');
}

// Route for bot status
app.get('/status', (req, res) => {
    res.json({
        bot: botInstance ? 'connected' : 'disconnected',
        qr: currentQR ? 'available' : 'unavailable',
        timestamp: new Date().toISOString()
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🌐 Servidor web rodando em http://localhost:${PORT}`);
    console.log(`📱 Interface de pairing disponível em: http://localhost:${PORT}`);
});

module.exports = { setBotInstance, updateQR, server };