const fetch = require('node-fetch');

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/quotes?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const quoteMessage = json.result;

        // Send the quote message
        await sock.sendMessage(chatId, {
            text: `💭 *Citação Inspiradora* 💭\n\n"${quoteMessage}"\n\n✨ *Yen-Bot* - Inspiração para sua vida! 🌸`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Não consegui buscar uma citação!*\n\n🔄 Tente novamente em alguns instantes.\n\n💡 *Dica:* Enquanto isso, que tal refletir sobre algo positivo?\n\n✨ *Yen-Bot* - Sempre tentando inspirar! 🌸'
        }, { quoted: message });
    }
};
