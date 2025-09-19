const shayaris = [
    "💖 Teus olhos são estrelas que brilham no meu céu,\nSem eles, meu mundo fica sem cor... 🌟",
    "🌹 Como a rosa precisa do orvalho da manhã,\nMeu coração precisa do teu amor... 💕",
    "🌙 A lua inveja tua beleza radiante,\nAs estrelas param para te admirar... ✨",
    "💝 Se o amor fosse uma música,\nTu serias a melodia mais doce... 🎵",
    "🌺 Teu sorriso é como o nascer do sol,\nIlumina até os dias mais escuros... ☀️",
    "💫 No jardim do meu coração,\nTu és a flor mais rara... 🌸",
    "🌊 Como as ondas beijam a praia,\nMeu amor sempre volta para ti... 💋",
    "🦋 Tua beleza é como uma borboleta,\nDelicada e impossível de capturar... 🌼",
    "💎 Tu és o diamante mais precioso,\nBrilhando na escuridão da minha vida... ✨",
    "🌈 Depois da tempestade vem o arco-íris,\nDepois de te conhecer, veio a felicidade... 😊"
];

async function shayariCommand(sock, chatId, message) {
    try {
        const randomShayari = shayaris[Math.floor(Math.random() * shayaris.length)];

        const buttons = [
            { buttonId: '.shayari', buttonText: { displayText: 'Poesia 🪄' }, type: 1 },
            { buttonId: '.roseday', buttonText: { displayText: '🌹 Dia das Rosas' }, type: 1 }
        ];

        await sock.sendMessage(chatId, {
            text: randomShayari,
            buttons: buttons,
            headerType: 1
        }, { quoted: message });
    } catch (error) {
        console.error('Error in shayari command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Erro ao enviar poesia romântica. Tente novamente!',
        }, { quoted: message });
    }
}

module.exports = { shayariCommand }; 