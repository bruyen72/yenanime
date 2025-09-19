const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        const joke = response.data.joke;

        await sock.sendMessage(chatId, {
            text: `😂 *Piada do Dia!* 😂\n\n${joke}\n\n✨ *Yen-Bot* - Sempre aqui para alegrar seu dia! 🌸`
        }, { quoted: message });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, {
            text: '😅 *Ops! Não consegui buscar uma piada agora.*\n\n🔄 Tente novamente em alguns instantes!\n\n✨ *Yen-Bot* - Desculpe pela decepção! 🌸'
        }, { quoted: message });
    }
};
