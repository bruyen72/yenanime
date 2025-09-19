const { isAdmin } = require('../lib/isAdmin');

// Function to handle manual promotions via command
async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, {
            text: '👑 *Como promover um membro:*\n\n• Mencione o usuário: .promote @usuario\n• Ou responda a mensagem dele com .promote\n• Pode promover vários usuários de uma vez\n\n⚠️ *Aviso:* Apenas admins podem usar este comando!\n\n✨ *Yen-Bot* - Poder e responsabilidade! 🌸'
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        
        // Get usernames for each promoted user
        const usernames = await Promise.all(userToPromote.map(async jid => {
            
            return `@${jid.split('@')[0]}`;
        }));

        // Get promoter's name (the bot user in this case)
        const promoterJid = sock.user.id;
        
        const promotionMessage = `✨ *『 PROMOÇÃO NO GRUPO 』* ✨\n\n` +
            `👑 *Usuário${userToPromote.length > 1 ? 's' : ''} Promovido${userToPromote.length > 1 ? 's' : ''}:*\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `🤖 *Promovido por:* Yen-Bot\n` +
            `📅 *Data:* ${new Date().toLocaleString('pt-BR')}\n\n` +
            `🌸 *Parabéns pela promoção!* 🌸`;
        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: [...userToPromote, promoterJid]
        });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: '❌ *Erro ao promover usuário(s)!*\n\n🔄 Possíveis causas:\n• Bot não é admin\n• Usuário já é admin\n• Erro de permissão\n\n💡 Verifique as configurações e tente novamente.\n\n✨ *Yen-Bot* - Desculpe pelo inconveniente! 🌸'});
    }
}

// Function to handle automatic promotion detection
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
       /* console.log('Promotion Event Data:', {
            groupId,
            participants,
            author
        });*/

        // Get usernames for promoted participants
        const promotedUsernames = await Promise.all(participants.map(async jid => {
            return `@${jid.split('@')[0]} `;
        }));

        let promotedBy;
        let mentionList = [...participants];

        if (author && author.length > 0) {
            // Ensure author has the correct format
            const authorJid = author;
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        } else {
            promotedBy = 'System';
        }

        const promotionMessage = `✨ *『 PROMOÇÃO NO GRUPO 』* ✨\n\n` +
            `👑 *Usuário${participants.length > 1 ? 's' : ''} Promovido${participants.length > 1 ? 's' : ''}:*\n` +
            `${promotedUsernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `🛡️ *Promovido por:* ${promotedBy}\n` +
            `📅 *Data:* ${new Date().toLocaleString('pt-BR')}\n\n` +
            `🌸 *Bem-vindo à equipe de administração!* 🌸`;
        
        await sock.sendMessage(groupId, {
            text: promotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };
