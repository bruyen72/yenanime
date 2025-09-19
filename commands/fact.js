const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await sock.sendMessage(chatId, {
            text: `🧠 *Fato Interessante!* 🧠\n\n${fact}\n\n✨ *Yen-Bot* - Conhecimento é poder! 🌸`
        }, { quoted: message });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, {
            text: '😅 *Ops! Não consegui buscar um fato agora.*\n\n🔄 Tente novamente em alguns instantes!\n\n💡 *Curiosidade:* Você sabia que o cérebro humano tem mais de 86 bilhões de neurônios?\n\n✨ *Yen-Bot* - Sempre aprendendo! 🌸'
        }, { quoted: message });
    }
};
