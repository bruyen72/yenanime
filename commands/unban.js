const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

async function unbanCommand(sock, chatId, message) {
    let userToUnban;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToUnban) {
        await sock.sendMessage(chatId, {
            text: 'Por favor mencione o usuário ou responda a mensagem dele para desbanir!',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        const index = bannedUsers.indexOf(userToUnban);
        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            
            await sock.sendMessage(chatId, {
                text: `${userToUnban.split('@')[0]} foi desbanido com sucesso!`,
                mentions: [userToUnban],
                ...channelInfo
            });
        } else {
            await sock.sendMessage(chatId, {
                text: `${userToUnban.split('@')[0]} não está banido!`,
                mentions: [userToUnban],
                ...channelInfo
            });
        }
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao desbanir usuário!', ...channelInfo }, { quoted: message });
    }
}

module.exports = unbanCommand; 