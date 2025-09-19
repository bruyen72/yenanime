module.exports = async (req, res) => {
    try {
        // Set basic headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Get query parameters
        const url = new URL(req.url, `https://${req.headers.host}`);
        const number = url.searchParams.get('number');

        // Simple demo response for pairing
        if (url.pathname === '/pair' || req.url.includes('pair')) {
            if (!number) {
                return res.status(400).json({
                    error: 'Número obrigatório',
                    message: 'Forneça um número de telefone'
                });
            }

            // Generate demo code
            const demoCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const formattedCode = demoCode.match(/.{1,4}/g)?.join("-") || demoCode;

            return res.status(200).json({
                code: formattedCode,
                message: 'Código de demonstração',
                note: 'Serverless demo - código não funcional',
                timestamp: new Date().toISOString()
            });
        }

        // QR endpoint
        if (url.pathname === '/qr' || req.url.includes('qr')) {
            return res.status(200).json({
                error: 'QR não disponível',
                message: 'Use serviço persistente para QR funcional',
                timestamp: new Date().toISOString()
            });
        }

        // Status endpoint
        if (url.pathname === '/status' || req.url.includes('status')) {
            return res.status(200).json({
                status: 'demo',
                bot: 'serverless-demo',
                timestamp: new Date().toISOString()
            });
        }

        // Default response
        return res.status(404).json({
            error: 'Endpoint não encontrado',
            available: ['/pair', '/qr', '/status']
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Erro interno',
            message: error.message
        });
    }
};