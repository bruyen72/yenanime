const isAdmin = require('../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    // Check if user is owner
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🤖 *Preciso ser admin primeiro!*\n\n👑 Para usar comandos de moderação, me promova a administrador do grupo.\n\n✨ *Yen-Bot* - Proteção inteligente! 🌸' }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🛡️ *Acesso Negado!*\n\n👮‍♂️ Apenas administradores do grupo podem expulsar membros.\n\n⚠️ Solicite permissão a um admin.\n\n✨ *Yen-Bot* - Segurança em primeiro lugar! 🌸' }, { quoted: message });
            return;
        }
    }

    let usersToKick = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, {
            text: '👥 *Como expulsar um membro:*\n\n• Mencione o usuário: .kick @usuario\n• Ou responda a mensagem dele com .kick\n• Pode mencionar vários usuários\n\n⚠️ *Aviso:* Apenas admins podem usar este comando!\n\n✨ *Yen-Bot* - Moderação eficiente! 🌸'
        }, { quoted: message });
        return;
    }

    // Get bot's ID
    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    // Check if any of the users to kick is the bot itself
    if (usersToKick.includes(botId)) {
        await sock.sendMessage(chatId, {
            text: "😅 *Ops! Não posso me expulsar!*\n\n🤖 Sou apenas um bot tentando ajudar o grupo!\n\n💡 *Dica:* Se quiser me remover, um admin pode fazer isso manualmente.\n\n✨ *Yen-Bot* - Sempre aqui para vocês! 🌸"
        }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
        
        // Get usernames for each kicked user
        const usernames = await Promise.all(usersToKick.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));
        
        await sock.sendMessage(chatId, {
            text: `👋 *Membro(s) Expulso(s) com Sucesso!*\n\n👤 *Usuário(s):* ${usernames.join(', ')}\n⚡ *Ação:* Expulsão aplicada\n🛡️ *Moderador:* Admin\n\n✨ *Yen-Bot* - Ordem mantida! 🌸`,
            mentions: usersToKick
        });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Erro ao expulsar usuário(s)!*\n\n🔄 Possíveis causas:\n• Usuário é admin\n• Bot sem permissão\n• Erro de conexão\n\n💡 Verifique as permissões e tente novamente.\n\n✨ *Yen-Bot* - Desculpe pelo inconveniente! 🌸'
        });
    }
}

module.exports = kickCommand;
