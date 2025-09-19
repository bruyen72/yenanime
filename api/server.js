/**
 * Vercel Serverless Function - Bot Interface
 */

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        const { pathname } = new URL(req.url, `http://${req.headers.host}`);

        // Handle pairing code request
        if (pathname === '/pair' || pathname === '/api/server' && req.url.includes('pair')) {
            const { number } = req.query || {};

            if (!number) {
                return res.status(400).json({
                    error: 'Número de telefone obrigatório',
                    message: 'Por favor, forneça um número de telefone válido'
                });
            }

            // For demo purposes - in production, integrate with actual bot
            const mockCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const formattedCode = mockCode.match(/.{1,4}/g)?.join("-") || mockCode;

            return res.status(200).json({
                code: formattedCode,
                message: 'Código de demonstração gerado',
                instructions: [
                    '⚠️ Este é um código de demonstração',
                    'Para usar o bot real, implemente em um serviço persistente',
                    '1. Abra o WhatsApp no seu celular',
                    '2. Vá em Configurações → Aparelhos conectados',
                    '3. Toque em "Conectar um aparelho"',
                    '4. Digite o código mostrado'
                ],
                note: 'Serverless demo - código não funcional'
            });
        }

        // Handle QR code request
        if (pathname === '/qr' || pathname === '/api/server' && req.url.includes('qr')) {
            return res.status(200).json({
                error: 'QR code não disponível em modo serverless',
                message: 'Para QR code funcional, use um serviço persistente',
                instructions: [
                    'Vercel Serverless Functions não mantêm estado persistente',
                    'Para funcionalidade completa, implemente em:',
                    '• Railway.app',
                    '• Render.com',
                    '• VPS próprio',
                    '• Outro serviço persistente'
                ]
            });
        }

        // Handle status request
        if (pathname === '/status' || pathname === '/api/server' && req.url.includes('status')) {
            return res.status(200).json({
                bot: 'serverless-demo',
                qr: 'unavailable',
                pairing: 'demo-mode',
                timestamp: new Date().toISOString(),
                note: 'Para bot funcional, use serviço persistente'
            });
        }

        return res.status(404).json({
            error: 'Endpoint não encontrado',
            available_endpoints: ['/pair', '/qr', '/status']
        });

    } catch (error) {
        console.error('Server API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};