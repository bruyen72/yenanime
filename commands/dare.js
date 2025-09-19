const fetch = require('node-fetch');

async function dareCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const dareMessage = json.result;

        // Send the dare message with kawaii styling
        const formattedMessage = `🎯 *Verdade ou Consequência* 🎯\n\n😈 *CONSEQUÊNCIA:*\n${dareMessage}\n\n🔥 *Você tem coragem?*\n✨ *Yen-Bot* - Desafios emocionantes! 🌸`;
        await sock.sendMessage(chatId, { text: formattedMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in dare command:', error);
        await sock.sendMessage(chatId, { text: '🌧️ *Erro na busca por desafios!*\n\n🔄 *Tente novamente mais tarde*\n• Servidor pode estar ocupado\n• Problema de conexão\n\n💡 *Enquanto isso, que tal criar seus próprios desafios?*\n\n✨ *Yen-Bot* - Sempre tentando! 🌸' }, { quoted: message });
    }
}

module.exports = { dareCommand };
