const rosedayMessages = [
    "🌹 *Dia das Rosas* 🌹\n\nAssim como as rosas florescem e espalham sua fragrância, que nosso amor floresça e se espalhe por toda parte! 💕✨",
    "🌹 *Feliz Dia das Rosas!* 🌹\n\nCada rosa tem sua beleza única, assim como você tem sua beleza especial que ilumina minha vida! 🌟💖",
    "🌹 *No Dia das Rosas* 🌹\n\nUma rosa vermelha para o amor, uma rosa branca para a pureza, uma rosa rosa para a gratidão... e todas elas para você! 💝",
    "🌹 *Dia das Rosas Especial* 🌹\n\nAs rosas podem ter espinhos, mas nosso amor só tem doçura e carinho! Feliz Dia das Rosas, meu amor! 💕😊",
    "🌹 *Celebrando o Dia das Rosas* 🌹\n\nQue as rosas de hoje sejam o símbolo do nosso amor eterno e da felicidade que compartilhamos! 🌹💫",
    "🌹 *Rosa Vermelha, Amor Verdadeiro* 🌹\n\nNo jardim do meu coração, você é a rosa mais bela e perfumada! Feliz Dia das Rosas! 🌸💖",
    "🌹 *Dia das Rosas Romântico* 🌹\n\nComo um buquê de rosas, nosso amor é colorido, perfumado e eternamente belo! 💐✨",
    "🌹 *Rosas e Amor* 🌹\n\nSe eu pudesse te dar uma rosa para cada momento feliz que você me trouxe, você teria um jardim infinito! 🌹🌿",
    "🌹 *Dia das Rosas Doce* 🌹\n\nAs rosas são vermelhas, as violetas são azuis, você é especial e eu te amo! Feliz Dia das Rosas! 💙❤️",
    "🌹 *Especial Dia das Rosas* 🌹\n\nQue a fragrância das rosas sempre nos lembre dos momentos doces que compartilhamos juntos! 💕🌺"
];

async function rosedayCommand(sock, chatId, message) {
    try {
        const randomRoseday = rosedayMessages[Math.floor(Math.random() * rosedayMessages.length)];

        // Send the roseday message
        await sock.sendMessage(chatId, { text: randomRoseday }, { quoted: message });
    } catch (error) {
        console.error('Error in roseday command:', error);
        await sock.sendMessage(chatId, { text: '❌ Erro ao enviar mensagem do Dia das Rosas. Tente novamente!' }, { quoted: message });
    }
}

module.exports = { rosedayCommand };
