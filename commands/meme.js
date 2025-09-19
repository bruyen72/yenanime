const fetch = require('node-fetch');

async function memeCommand(sock, chatId, message) {
    try {
        const response = await fetch('https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo');
        
        // Check if response is an image
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('image')) {
            const imageBuffer = await response.buffer();
            
            const buttons = [
                { buttonId: '.meme', buttonText: { displayText: '🎭 Outro Meme' }, type: 1 },
                { buttonId: '.joke', buttonText: { displayText: '😄 Piada' }, type: 1 }
            ];

            await sock.sendMessage(chatId, { 
                image: imageBuffer,
                caption: "🎭 *Meme Cheems Kawaii!* 🎭\n\n🐶 *Aqui está seu meme engraçado!*\n😂 *Divirta-se e compartilhe*\n\n✨ *Yen-Bot* - Humor garantido! 🌸",
                buttons: buttons,
                headerType: 1
            },{ quoted: message});
        } else {
            throw new Error('Invalid response type from API');
        }
    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(chatId, {
            text: '🌧️ *Erro ao buscar meme!*\n\n🔄 *Tente novamente mais tarde*\n• Servidor pode estar ocupado\n• Problema de conexão\n\n💡 *Enquanto isso, que tal um .joke?*\n\n✨ *Yen-Bot* - Humor nunca falha! 🌸'
        },{ quoted: message });
    }
}

module.exports = memeCommand;
