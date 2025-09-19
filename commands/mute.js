const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '🤖 *Preciso ser admin primeiro!*\n\n👑 Para silenciar o grupo, me promova a administrador.\n\n✨ *Yen-Bot* - Controle de grupo! 🌸' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '🔇 *Acesso Negado!*\n\n👮‍♂️ Apenas administradores podem silenciar o grupo.\n\n⚠️ Solicite permissão a um admin.\n\n✨ *Yen-Bot* - Moderação responsável! 🌸' }, { quoted: message });
        return;
    }

    try {
        // Mute the group
        await sock.groupSettingUpdate(chatId, 'announcement');
        
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await sock.sendMessage(chatId, { text: `🔇 *Grupo Silenciado!*\n\n⏱️ *Duração:* ${durationInMinutes} minutos\n📝 *Apenas admins podem enviar mensagens*\n\n✨ *Yen-Bot* - Paz e ordem! 🌸` }, { quoted: message });
            
            // Set timeout to unmute after duration
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: '🔊 *Grupo Liberado!*\n\n✅ *Todos podem enviar mensagens novamente*\n⏰ *Tempo de silêncio encerrado*\n\n✨ *Yen-Bot* - Liberdade restaurada! 🌸' });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { text: '🔇 *Grupo Silenciado!*\n\n📝 *Apenas administradores podem enviar mensagens*\n💡 *Use .unmute para liberar*\n\n✨ *Yen-Bot* - Silêncio total! 🌸' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: '❌ *Erro ao silenciar/liberar grupo!*\n\n🔄 Possíveis causas:\n• Bot não é admin\n• Erro de conexão\n\n💡 Verifique permissões e tente novamente.\n\n✨ *Yen-Bot* - Desculpe pelo inconveniente! 🌸' }, { quoted: message });
    }
}

module.exports = muteCommand;
