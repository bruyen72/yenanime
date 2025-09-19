const axios = require('axios');

let triviaGames = {};

async function startTrivia(sock, chatId) {
    if (triviaGames[chatId]) {
        sock.sendMessage(chatId, { text: '🧠 *Já há um quiz em andamento!*\n\n⏳ *Termine o quiz atual primeiro*\n📝 *Responda a pergunta ou aguarde*\n\n✨ *Yen-Bot* - Um desafio por vez! 🌸' });
        return;
    }

    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const questionData = response.data.results[0];

        triviaGames[chatId] = {
            question: questionData.question,
            correctAnswer: questionData.correct_answer,
            options: [...questionData.incorrect_answers, questionData.correct_answer].sort(),
        };

        sock.sendMessage(chatId, {
            text: `🧠 *Quiz Time!* 🧠\n\n🤔 *Pergunta:* ${triviaGames[chatId].question}\n\n📝 *Opções:*\n${triviaGames[chatId].options.join('\n')}\n\n✨ *Yen-Bot* - Teste seus conhecimentos! 🌸`
        });
    } catch (error) {
        sock.sendMessage(chatId, { text: '🌧️ *Erro ao buscar pergunta!*\n\n🔄 *Tente novamente mais tarde*\n• Servidor pode estar ocupado\n• Problema de conexão\n\n💡 *Dica:* Use .trivia para tentar novamente\n\n✨ *Yen-Bot* - Sempre tentando! 🌸' });
    }
}

function answerTrivia(sock, chatId, answer) {
    if (!triviaGames[chatId]) {
        sock.sendMessage(chatId, { text: '🤷‍♀️ *Nenhum quiz em andamento!*\n\n📝 *Para iniciar:* .trivia\n🧠 *Desafie seus conhecimentos*\n\n✨ *Yen-Bot* - Pronto para o quiz! 🌸' });
        return;
    }

    const game = triviaGames[chatId];

    if (answer.toLowerCase() === game.correctAnswer.toLowerCase()) {
        sock.sendMessage(chatId, { text: `🎉 *Correto!* 🎉\n\n✅ *Resposta certa:* ${game.correctAnswer}\n🧠 *Você é muito inteligente!*\n\n✨ *Yen-Bot* - Parabéns pelo acerto! 🌸` });
    } else {
        sock.sendMessage(chatId, { text: `😅 *Errou!* \n\n❌ *A resposta correta era:* ${game.correctAnswer}\n📚 *Não desanime, tente outro quiz!*\n\n✨ *Yen-Bot* - Sempre aprendendo! 🌸` });
    }

    delete triviaGames[chatId];
}

module.exports = { startTrivia, answerTrivia };
