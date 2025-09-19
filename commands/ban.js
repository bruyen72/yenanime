const fs = require('fs');
const { channelInfo } = require('../lib/messageConfig');

async function banCommand(sock, chatId, message) {
    let userToBan;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToBan) {
        await sock.sendMessage(chatId, {
            text: '🚫 *Como banir um usuário:*\n\n• Mencione o usuário: .ban @usuario\n• Ou responda a mensagem dele com .ban\n\n⚠️ *Aviso:* Apenas admins podem usar este comando!\n\n✨ *Yen-Bot* - Moderação inteligente! 🌸',
            ...channelInfo
        });
        return;
    }

    try {
        // Add user to banned list
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            
            await sock.sendMessage(chatId, {
                text: `🚫 *Usuário Banido com Sucesso!*\n\n👤 *Usuário:* @${userToBan.split('@')[0]}\n⚡ *Ação:* Banimento aplicado\n🛡️ *Moderador:* Admin\n\n✨ *Yen-Bot* - Grupo protegido! 🌸`,
                mentions: [userToBan],
                ...channelInfo
            });
        } else {
            await sock.sendMessage(chatId, {
                text: `⚠️ *Usuário já está banido!*\n\n👤 *Usuário:* @${userToBan.split('@')[0]}\n📋 *Status:* Já está na lista de banidos\n\n💡 *Dica:* Use .unban para remover o banimento\n\n✨ *Yen-Bot* - Controle total! 🌸`,
                mentions: [userToBan],
                ...channelInfo
            });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        await sock.sendMessage(chatId, { text: '❌ *Erro ao banir usuário!*\n\n🔄 Tente novamente ou contate o administrador.\n\n✨ *Yen-Bot* - Desculpe pelo inconveniente! 🌸', ...channelInfo });
    }
}

module.exports = banCommand;
