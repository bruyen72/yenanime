const isAdmin = require('../lib/isAdmin');

async function demoteCommand(sock, chatId, mentionedJids, message) {
    try {
        // First check if it's a group
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: '👥 *Este comando só funciona em grupos!*\n\n💡 Use em um grupo para remover privilégios de admin.\n\n✨ *Yen-Bot* - Moderação inteligente! 🌸'
            });
            return;
        }

        // Check admin status first, before any other operations
        try {
            const adminStatus = await isAdmin(sock, chatId, message.key.participant || message.key.remoteJid);
            
            if (!adminStatus.isBotAdmin) {
                await sock.sendMessage(chatId, {
                    text: '🤖 *Preciso ser admin primeiro!*\n\n👑 Para remover privilégios de outros admins, me promova a administrador do grupo.\n\n✨ *Yen-Bot* - Moderação justa! 🌸'
                });
                return;
            }

            if (!adminStatus.isSenderAdmin) {
                await sock.sendMessage(chatId, {
                    text: '🛡️ *Acesso Negado!*\n\n👮‍♂️ Apenas administradores do grupo podem rebaixar outros admins.\n\n⚠️ Solicite permissão a um admin.\n\n✨ *Yen-Bot* - Segurança em primeiro lugar! 🌸'
                });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, {
                text: '❌ *Erro de permissão!*\n\n🔧 Certifique-se de que sou administrador deste grupo.\n\n✨ *Yen-Bot* - Configuração necessária! 🌸'
            });
            return;
        }

        let userToDemote = [];
        
        // Check for mentioned users
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        
        // If no user found through either method
        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, {
                text: '👤 *Como rebaixar um admin:*\n\n• Mencione o usuário: .demote @usuario\n• Ou responda a mensagem dele com .demote\n• Pode rebaixar vários usuários de uma vez\n\n⚠️ *Aviso:* Apenas super-admins podem usar este comando!\n\n✨ *Yen-Bot* - Poder e responsabilidade! 🌸'
            });
            return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");
        
        // Get usernames for each demoted user
        const usernames = await Promise.all(userToDemote.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotionMessage = `🔻 *『 REBAIXAMENTO NO GRUPO 』* 🔻\n\n` +
            `👤 *Usuário${userToDemote.length > 1 ? 's' : ''} Rebaixado${userToDemote.length > 1 ? 's' : ''}:*\n` +
            `${usernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `🤖 *Rebaixado por:* Yen-Bot\n` +
            `📅 *Data:* ${new Date().toLocaleString('pt-BR')}\n\n` +
            `📋 *Agora é membro comum do grupo.*`;
        
        await sock.sendMessage(chatId, { 
            text: demotionMessage,
            mentions: [...userToDemote, message.key.participant || message.key.remoteJid]
        });
    } catch (error) {
        console.error('Error in demote command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, {
                    text: '❌ *Limite de taxa atingido.*\n\n⏰ Tente novamente em alguns segundos!\n\n✨ *Yen-Bot* - Aguarde um momento! 🌸'
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, {
                    text: '❌ *Falha ao rebaixar usuário(s)!*\n\n🔧 Certifique-se de que:\n• O bot é administrador\n• Tem permissões suficientes\n• O usuário é realmente admin\n\n✨ *Yen-Bot* - Verifique as configurações! 🌸'
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

// Function to handle automatic demotion detection
async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        if (!groupId || !participants) {
            console.log('Invalid groupId or participants:', { groupId, participants });
            return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get usernames for demoted participants
        const demotedUsernames = await Promise.all(participants.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        let demotedBy;
        let mentionList = [...participants];

        if (author && author.length > 0) {
            // Ensure author has the correct format
            const authorJid = author;
            demotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        } else {
            demotedBy = 'System';
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotionMessage = `🔻 *『 REBAIXAMENTO NO GRUPO 』* 🔻\n\n` +
            `👤 *Usuário${participants.length > 1 ? 's' : ''} Rebaixado${participants.length > 1 ? 's' : ''}:*\n` +
            `${demotedUsernames.map(name => `• ${name}`).join('\n')}\n\n` +
            `🛡️ *Rebaixado por:* ${demotedBy}\n` +
            `📅 *Data:* ${new Date().toLocaleString('pt-BR')}\n\n` +
            `📋 *Agora ${participants.length > 1 ? 'são membros comuns' : 'é membro comum'} do grupo.*`;
        
        await sock.sendMessage(groupId, {
            text: demotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling demotion event:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

module.exports = { demoteCommand, handleDemotionEvent };
