const fetch = require('node-fetch');

async function truthCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/truth?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const truthMessage = json.result;

        // Send the truth message with kawaii styling
        const formattedMessage = `🔮 *Verdade ou Consequência* 🔮\n\n🎯 *VERDADE:*\n${truthMessage}\n\n👀 *Hora de ser honesto!*\n✨ *Yen-Bot* - Revelando segredos! 🌸`;
        await sock.sendMessage(chatId, { text: formattedMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { text: '🌧️ *Erro na busca por verdades!*\n\n🔄 *Tente novamente mais tarde*\n• Servidor pode estar ocupado\n• Problema de conexão\n\n💡 *Enquanto isso, que tal criar suas próprias perguntas?*\n\n✨ *Yen-Bot* - Sempre tentando! 🌸' }, { quoted: message });
    }
}

module.exports = { truthCommand };
