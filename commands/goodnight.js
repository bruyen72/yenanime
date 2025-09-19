const goodnightMessages = [
    "🌙 Boa noite! Que os anjos guardem teus sonhos e que amanhã seja um dia ainda mais especial! ✨💤",
    "⭐ Descanse bem! Que a lua ilumine teus sonhos e que você acorde renovado(a) para um novo dia! 🌛💫",
    "💤 Boa noite, querido(a)! Que teu sono seja tranquilo e teus sonhos sejam doces como mel! 🍯😴",
    "🌟 Hora de descansar! Que as estrelas te façam companhia e que tenhas uma noite maravilhosa! ✨🌙",
    "🌺 Boa noite! Que teu coração descanse em paz e que amanhã traga novas alegrias! 💕😊",
    "🦋 Chegou a hora do descanso! Que teus sonhos sejam coloridos como um jardim na primavera! 🌸💤",
    "🌅 Boa noite! Que o descanso renove tuas energias e que o amanhã seja cheio de conquistas! 💪✨",
    "💝 Descanse com carinho! Que teu sono seja reparador e que acordes com o coração cheio de gratidão! 🙏💖",
    "🌊 Boa noite! Que a tranquilidade da noite acalme tua alma e traga paz ao teu coração! 🕊💙",
    "🎵 Hora de sonhar! Que a melodia da noite embale teu sono e que tenhas os mais belos sonhos! 🎶😴"
];

async function goodnightCommand(sock, chatId, message) {
    try {
        const randomGoodnight = goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];

        // Send the goodnight message
        await sock.sendMessage(chatId, { text: randomGoodnight }, { quoted: message });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sock.sendMessage(chatId, { text: '❌ Erro ao enviar mensagem de boa noite. Tente novamente!' }, { quoted: message });
    }
}

module.exports = { goodnightCommand }; 