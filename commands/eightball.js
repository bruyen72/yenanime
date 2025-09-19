const eightBallResponses = [
    "✅ Sim, definitivamente!",
    "❌ De jeito nenhum!",
    "⏰ Pergunte novamente mais tarde.",
    "💯 É uma certeza.",
    "😬 Muito duvidoso.",
    "🎯 Sem dúvida alguma.",
    "🚫 Minha resposta é não.",
    "🌟 Os sinais apontam para sim.",
    "🔥 Com toda certeza!",
    "🌈 As perspectivas são ótimas!",
    "🤔 Melhor não te contar agora.",
    "💫 Concentre-se e pergunte novamente."
];

async function eightBallCommand(sock, chatId, question, message) {
    if (!question) {
        await sock.sendMessage(chatId, {
            text: '🎱 *Como usar a Bola Mágica:*\n\n• Digite: .8ball <sua pergunta>\n\n📝 *Exemplo:* .8ball vou passar na prova?\n\n🔮 *A bola mágica revelará o destino!*\n\n✨ *Yen-Bot* - Oráculo digital! 🌸'
        }, { quoted: message });
        return;
    }

    const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
    await sock.sendMessage(chatId, {
        text: `🎱 *Bola Mágica do Yen-Bot* 🎱\n\n❓ *Sua pergunta:* ${question}\n\n🔮 *Resposta:* ${randomResponse}\n\n✨ *Yen-Bot* - O destino nas suas mãos! 🌸`
    }, { quoted: message });
}

module.exports = { eightBallCommand };
