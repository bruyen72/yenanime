async function unmuteCommand(sock, chatId, message) {
    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement'); // Unmute the group
        await sock.sendMessage(chatId, {
            text: '🔊 *Grupo Liberado!*\n\n✅ *Todos podem enviar mensagens novamente*\n🎉 *Chat livre para conversas*\n\n✨ *Yen-Bot* - Comunicação restaurada! 🌸'
        }, { quoted: message });
    } catch (error) {
        console.error('Error unmuting group:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Erro ao liberar grupo!*\n\n🔄 Verifique se sou administrador e tente novamente.\n\n✨ *Yen-Bot* - Desculpe pelo inconveniente! 🌸'
        }, { quoted: message });
    }
}

module.exports = unmuteCommand;
