const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

async function wastedCommand(sock, chatId, message) {
    let userToWaste;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToWaste = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToWaste = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToWaste) {
        await sock.sendMessage(chatId, {
            text: '⚰️ *Para criar meme Wasted:*\n\n• Marque a pessoa: `.wasted @usuário`\n• Ou responda uma mensagem com `.wasted`\n\n💀 *GTA Style!* 🎮',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    try {
        // Get user's profile picture
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToWaste, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image if no profile pic
        }

        // Get the wasted effect image
        const wastedResponse = await axios.get(
            `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`,
            { responseType: 'arraybuffer' }
        );

        // Send the wasted image
        await sock.sendMessage(chatId, {
            image: Buffer.from(wastedResponse.data),
            caption: `⚰️ *WASTED* : ${userToWaste.split('@')[0]} 💀\n\n🎮 *Estilo GTA!* Descanse em pedaços! 😈`,
            mentions: [userToWaste],
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in wasted command:', error);
        await sock.sendMessage(chatId, { 
            text: 'Falha ao criar imagem wasted! Tente novamente mais tarde.',
            ...channelInfo 
        }, { quoted: message });
    }
}

module.exports = wastedCommand; 