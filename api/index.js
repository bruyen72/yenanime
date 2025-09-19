/**
 * Vercel Serverless Function - WhatsApp Bot Entry Point
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

        // For Vercel serverless, we need a simple response
        // The actual bot should run in a different service (like Railway, Render, or VPS)
        if (req.method === 'GET') {
            return res.status(200).json({
                status: 'success',
                message: 'WhatsApp Bot API is running',
                timestamp: new Date().toISOString(),
                note: 'This is a serverless endpoint. The actual bot runs on a persistent service.'
            });
        }

        // Handle webhook if needed
        if (req.method === 'POST') {
            return res.status(200).json({
                status: 'webhook_received',
                timestamp: new Date().toISOString()
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};