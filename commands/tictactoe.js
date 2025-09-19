const TicTacToe = require('../lib/tictactoe');

// Store games globally
const games = {};

async function tictactoeCommand(sock, chatId, senderId, text) {
    try {
        // Check if player is already in a game
        if (Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(senderId)
        )) {
            await sock.sendMessage(chatId, {
                text: '🎲 *Você já está jogando!*\n\n⚠️ *Termine o jogo atual primeiro*\n📝 *Digite:* surrender *(para desistir)*\n\n✨ *Yen-Bot* - Um jogo por vez! 🌸'
            });
            return;
        }

        // Look for existing room
        let room = Object.values(games).find(room => 
            room.state === 'WAITING' && 
            (text ? room.name === text : true)
        );

        if (room) {
            // Join existing room
            room.o = chatId;
            room.game.playerO = senderId;
            room.state = 'PLAYING';

            const arr = room.game.render().map(v => ({
                'X': '❎',
                'O': '⭕',
                '1': '1️⃣',
                '2': '2️⃣',
                '3': '3️⃣',
                '4': '4️⃣',
                '5': '5️⃣',
                '6': '6️⃣',
                '7': '7️⃣',
                '8': '8️⃣',
                '9': '9️⃣',
            }[v]));

            const str = `
🎲 *Jogo da Velha Iniciado!* 🎲

⏳ *Esperando @${room.game.currentTurn.split('@')[0]} jogar...*

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

🏠 *Sala:* ${room.id}
📜 *Regras:*
• Faça 3 símbolos em linha (horizontal, vertical ou diagonal)
• Digite um número (1-9) para colocar seu símbolo
• Digite *surrender* para desistir

✨ *Yen-Bot* - Divirta-se jogando! 🌸
`;

            // Send message only once to the group
            await sock.sendMessage(chatId, { 
                text: str,
                mentions: [room.game.currentTurn, room.game.playerX, room.game.playerO]
            });

        } else {
            // Create new room
            room = {
                id: 'tictactoe-' + (+new Date),
                x: chatId,
                o: '',
                game: new TicTacToe(senderId, 'o'),
                state: 'WAITING'
            };

            if (text) room.name = text;

            await sock.sendMessage(chatId, {
                text: `🎲 *Jogo da Velha Criado!* 🎲\n\n⏳ *Esperando oponente...*\n📝 *Para entrar, digite:* .ttt ${text || ''}\n\n🎯 *Quem vai desafiar?*\n\n✨ *Yen-Bot* - Arena de jogos! 🌸`
            });

            games[room.id] = room;
        }

    } catch (error) {
        console.error('Error in tictactoe command:', error);
        await sock.sendMessage(chatId, {
            text: '🌧️ *Erro ao iniciar jogo!*\n\n🔄 *Tente novamente*\n• Verifique sua conexão\n• Aguarde alguns segundos\n\n💡 *Dica:* Use .ttt para tentar novamente\n\n✨ *Yen-Bot* - Resolvendo problemas! 🌸'
        });
    }
}

async function handleTicTacToeMove(sock, chatId, senderId, text) {
    try {
        // Find player's game
        const room = Object.values(games).find(room => 
            room.id.startsWith('tictactoe') && 
            [room.game.playerX, room.game.playerO].includes(senderId) && 
            room.state === 'PLAYING'
        );

        if (!room) return;

        const isSurrender = /^(surrender|give up)$/i.test(text);
        
        if (!isSurrender && !/^[1-9]$/.test(text)) return;

        // Allow surrender at any time, not just during player's turn
        if (senderId !== room.game.currentTurn && !isSurrender) {
            await sock.sendMessage(chatId, {
                text: '⚠️ *Não é sua vez!*\n\n🔄 *Aguarde o oponente jogar*\n🎲 *Seja paciente...*\n\n✨ *Yen-Bot* - Respeitando as regras! 🌸'
            });
            return;
        }

        let ok = isSurrender ? true : room.game.turn(
            senderId === room.game.playerO,
            parseInt(text) - 1
        );

        if (!ok) {
            await sock.sendMessage(chatId, {
                text: '❌ *Movimento inválido!*\n\n🚫 *Esta posição já está ocupada*\n🔢 *Escolha outro número (1-9)*\n\n✨ *Yen-Bot* - Verificando jogadas! 🌸'
            });
            return;
        }

        let winner = room.game.winner;
        let isTie = room.game.turns === 9;

        const arr = room.game.render().map(v => ({
            'X': '❎',
            'O': '⭕',
            '1': '1️⃣',
            '2': '2️⃣',
            '3': '3️⃣',
            '4': '4️⃣',
            '5': '5️⃣',
            '6': '6️⃣',
            '7': '7️⃣',
            '8': '8️⃣',
            '9': '9️⃣',
        }[v]));

        if (isSurrender) {
            // Set the winner to the opponent of the surrendering player
            winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX;
            
            // Send a surrender message
            await sock.sendMessage(chatId, {
                text: `🏳️ *@${senderId.split('@')[0]} desistiu!*\n\n🏆 *@${winner.split('@')[0]} venceu o jogo!*\n\n✨ *Yen-Bot* - Jogo encerrado por desistência! 🌸`,
                mentions: [senderId, winner]
            });
            
            // Delete the game immediately after surrender
            delete games[room.id];
            return;
        }

        let gameStatus;
        if (winner) {
            gameStatus = `🎉 *@${winner.split('@')[0]} venceu o jogo!*`;
        } else if (isTie) {
            gameStatus = `🤝 *Jogo terminou empatado!*`;
        } else {
            gameStatus = `🎲 *Vez de:* @${room.game.currentTurn.split('@')[0]} (${senderId === room.game.playerX ? '❎' : '⭕'})`;
        }

        const str = `
🎮 *Jogo da Velha* 🎮

${gameStatus}

${arr.slice(0, 3).join('')}
${arr.slice(3, 6).join('')}
${arr.slice(6).join('')}

▢ *Jogador ❎:* @${room.game.playerX.split('@')[0]}
▢ *Jogador ⭕:* @${room.game.playerO.split('@')[0]}

${!winner && !isTie ? '• Digite um número (1-9) para fazer sua jogada\n• Digite *surrender* para desistir' : ''}

✨ *Yen-Bot* - Arena de jogos! 🌸
`;

        const mentions = [
            room.game.playerX, 
            room.game.playerO,
            ...(winner ? [winner] : [room.game.currentTurn])
        ];

        await sock.sendMessage(room.x, { 
            text: str,
            mentions: mentions
        });

        if (room.x !== room.o) {
            await sock.sendMessage(room.o, { 
                text: str,
                mentions: mentions
            });
        }

        if (winner || isTie) {
            delete games[room.id];
        }

    } catch (error) {
        console.error('Error in tictactoe move:', error);
    }
}

module.exports = {
    tictactoeCommand,
    handleTicTacToeMove
};
