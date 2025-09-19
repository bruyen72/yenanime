const settings = require("../settings");
async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `✨ *Yen-Bot está Ativo!* ✨\n\n` +
                       `🌸 *Versão:* ${settings.version}\n` +
                       `🟢 *Status:* Online\n` +
                       `🌍 *Modo:* Público\n\n` +
                       `🎯 *Recursos Principais:*\n` +
                       `• 👑 Gerenciamento de Grupos\n` +
                       `• 🛡️ Proteção Anti-Link\n` +
                       `• 🎮 Comandos Divertidos\n` +
                       `• 🤖 Inteligência Artificial\n` +
                       `• 🎨 Edição de Imagens\n` +
                       `• 📥 Download de Mídias\n` +
                       `• 🌸 Anime & Kawaii\n` +
                       `• E muito mais!\n\n` +
                       `Digite *.menu* para ver todos os comandos! 💫`;

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: '✨ Yen-Bot está funcionando perfeitamente! 🌸' }, { quoted: message });
    }
}

module.exports = aliveCommand;