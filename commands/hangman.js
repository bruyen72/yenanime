const fs = require('fs');

const words = ['javascript', 'bot', 'forca', 'whatsapp', 'nodejs', 'anime', 'kawaii', 'manga', 'otaku', 'tecnologia'];
let hangmanGames = {};

function startHangman(sock, chatId) {
    const word = words[Math.floor(Math.random() * words.length)];
    const maskedWord = '_ '.repeat(word.length).trim();

    hangmanGames[chatId] = {
        word,
        maskedWord: maskedWord.split(' '),
        guessedLetters: [],
        wrongGuesses: 0,
        maxWrongGuesses: 6,
    };

    sock.sendMessage(chatId, { text: `🎯 *Jogo da Forca Iniciado!* 🎯\n\n🔤 *A palavra é:* ${maskedWord}\n📝 *Dica:* ${word.length} letras\n\n💡 *Digite uma letra para adivinhar*\n\n✨ *Yen-Bot* - Boa sorte! 🌸` });
}

function guessLetter(sock, chatId, letter) {
    if (!hangmanGames[chatId]) {
        sock.sendMessage(chatId, { text: '🤷‍♀️ *Nenhum jogo em andamento!*\n\n📝 *Para iniciar:* .hangman\n🎯 *Desafie sua mente!*\n\n✨ *Yen-Bot* - Pronto para jogar! 🌸' });
        return;
    }

    const game = hangmanGames[chatId];
    const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

    if (guessedLetters.includes(letter)) {
        sock.sendMessage(chatId, { text: `🔄 *Você já tentou "${letter}"!*\n\n📝 *Escolha outra letra*\n🤔 *Seja criativo...*\n\n✨ *Yen-Bot* - Evitando repetições! 🌸` });
        return;
    }

    guessedLetters.push(letter);

    if (word.includes(letter)) {
        for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
                maskedWord[i] = letter;
            }
        }
        sock.sendMessage(chatId, { text: `🎉 *Boa adivinhação!* 🎉\n\n✅ *Palavra:* ${maskedWord.join(' ')}\n🔥 *Continue assim!*\n\n✨ *Yen-Bot* - Você está indo bem! 🌸` });

        if (!maskedWord.includes('_')) {
            sock.sendMessage(chatId, { text: `🎆 *Parabéns! Você venceu!* 🎆\n\n🏆 *Palavra completa:* ${word}\n🧠 *Você é muito inteligente!*\n\n✨ *Yen-Bot* - Vitória merecida! 🌸` });
            delete hangmanGames[chatId];
        }
    } else {
        game.wrongGuesses += 1;
        sock.sendMessage(chatId, { text: `❌ *Letra errada!*\n\n😅 *Tentativas restantes:* ${maxWrongGuesses - game.wrongGuesses}\n💪 *Não desista!*\n\n✨ *Yen-Bot* - Continue tentando! 🌸` });

        if (game.wrongGuesses >= maxWrongGuesses) {
            sock.sendMessage(chatId, { text: `💥 *Game Over!* 💥\n\n🔤 *A palavra era:* ${word}\n😅 *Que pena! Tente novamente*\n\n✨ *Yen-Bot* - Mais sorte na próxima! 🌸` });
            delete hangmanGames[chatId];
        }
    }
}

module.exports = { startHangman, guessLetter };
