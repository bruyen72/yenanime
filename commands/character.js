const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

async function characterCommand(sock, chatId, message) {
    let userToAnalyze;
    
    // Check for mentioned users
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToAnalyze) {
        await sock.sendMessage(chatId, {
            text: '🔮 *Para analisar personalidade:*\n\n• Marque a pessoa: `.character @usuário`\n• Ou responda uma mensagem com `.character`\n\n✨ *Descubra traços únicos!* 🎭',
            ...channelInfo
        });
        return;
    }

    try {
        // Get user's profile picture
        let profilePic;
        try {
            profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');
        } catch {
            profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image if no profile pic
        }

        const traits = [
            "Inteligente", "Criativo", "Determinado", "Ambicioso", "Carinhoso",
            "Carismático", "Confiante", "Empático", "Energético", "Amigável",
            "Generoso", "Honesto", "Bem-humorado", "Imaginativo", "Independente",
            "Intuitivo", "Gentil", "Lógico", "Leal", "Otimista",
            "Apaixonado", "Paciente", "Persistente", "Confiável", "Esperto",
            "Sincero", "Atencioso", "Compreensivo", "Versátil", "Sábio"
        ];

        // Get 3-5 random traits
        const numTraits = Math.floor(Math.random() * 3) + 3; // Random number between 3 and 5
        const selectedTraits = [];
        for (let i = 0; i < numTraits; i++) {
            const randomTrait = traits[Math.floor(Math.random() * traits.length)];
            if (!selectedTraits.includes(randomTrait)) {
                selectedTraits.push(randomTrait);
            }
        }

        // Calculate random percentages for each trait
        const traitPercentages = selectedTraits.map(trait => {
            const percentage = Math.floor(Math.random() * 41) + 60; // Random number between 60-100
            return `${trait}: ${percentage}%`;
        });

        // Create character analysis message
        const analysis = `🔮 *Análise de Personalidade* 🔮\n\n` +
            `👤 *Usuário:* ${userToAnalyze.split('@')[0]}\n\n` +
            `✨ *Traços Principais:*\n${traitPercentages.join('\n')}\n\n` +
            `🎯 *Avaliação Geral:* ${Math.floor(Math.random() * 21) + 80}%\n\n` +
            `⚠ *Nota:* Esta é uma análise divertida e não deve ser levada a sério! 😄`;

        // Send the analysis with the user's profile picture
        await sock.sendMessage(chatId, {
            image: { url: profilePic },
            caption: analysis,
            mentions: [userToAnalyze],
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in character command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro ao analisar personalidade! Tente novamente mais tarde.',
            ...channelInfo
        });
    }
}

module.exports = characterCommand; 