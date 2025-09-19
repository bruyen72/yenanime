const compliments = [
    "Você é incrível do jeito que é! 🌟",
    "Você tem um senso de humor fantástico! 😄",
    "Você é extremamente atencioso e gentil! 💖",
    "Você é mais poderoso do que imagina! ⚡",
    "Você ilumina qualquer ambiente! ✨",
    "Você é um verdadeiro amigo! 🤝",
    "Você me inspira muito! 🌈",
    "Sua criatividade não tem limites! 🎨",
    "Você tem um coração de ouro! 💛",
    "Você faz a diferença no mundo! 🌍",
    "Sua positividade é contagiante! 😊",
    "Você tem uma ética de trabalho incrível! 💪",
    "Você traz o melhor das pessoas! 🌸",
    "Seu sorriso alegra o dia de todos! 😁",
    "Você é talentoso em tudo que faz! 🎯",
    "Sua bondade torna o mundo melhor! 🕊️",
    "Você tem uma perspectiva única e maravilhosa! 👁️",
    "Seu entusiasmo é verdadeiramente inspirador! 🔥",
    "Você é capaz de conquistar grandes coisas! 🏆",
    "Você sempre sabe como fazer alguém se sentir especial! 💝",
    "Sua confiança é admirável! 👑",
    "Você tem uma alma linda! 🌺",
    "Sua generosidade não tem limites! 🎁",
    "Você tem um olhar aguçado para detalhes! 🔍",
    "Sua paixão é verdadeiramente motivadora! 🚀",
    "Você é um ouvinte incrível! 👂",
    "Você é mais forte do que pensa! 💎",
    "Sua risada é contagiante! 😂",
    "Você tem um dom natural para valorizar os outros! 🌟",
    "Você torna o mundo melhor só por existir! 🌻"
];

async function complimentCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) {
            console.log('Invalid message or chatId:', { message, chatId });
            return;
        }

        let userToCompliment;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToCompliment) {
            await sock.sendMessage(chatId, { 
                text: '🌸 *Para elogiar alguém:*\n\n• Marque a pessoa: `.compliment @usuário`\n• Ou responda uma mensagem com `.compliment`\n\n✨ *Espalhe positividade!* 💖'
            });
            return;
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        await sock.sendMessage(chatId, { 
            text: `💖 Oi @${userToCompliment.split('@')[0]}, ${compliment}`,
            mentions: [userToCompliment]
        });
    } catch (error) {
        console.error('Error in compliment command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { 
                    text: '⏰ Aguarde alguns segundos e tente novamente!'
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { 
                    text: '❌ Erro ao enviar o elogio. Tente novamente!'
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

module.exports = { complimentCommand };
