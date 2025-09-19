const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `╔═══════════════════╗
   ✨ *𝗬𝗲𝗻-𝗕𝗼𝘁* ✨
   Version: *2.1.8*
   by Yen
   ⚡ 𝐀𝐝𝐯𝐚𝐧𝐜𝐞𝐝 𝐀𝐧𝐢𝐦𝐞 𝐁𝐨𝐭 ⚡
╚═══════════════════╝

*✧･ﾟ: *✧･ﾟ:* 𝗖𝗼𝗺𝗮𝗻𝗱𝗼𝘀 𝗗𝗶𝘀𝗽𝗼𝗻í𝘃𝗲𝗶𝘀 *:･ﾟ✧*:･ﾟ✧*

╔═══════════════════╗
🌸 *Comandos Gerais*:
║ ⭐ .help ou .menu
║ ⭐ .ping - verificar velocidade
║ ⭐ .alive - status do bot
║ ⭐ .tts <texto> - texto para fala
║ ⭐ .owner - informações do dono
║ ⭐ .joke - piada aleatória
║ ⭐ .quote - citação inspiradora
║ ⭐ .fact - fato interessante
║ ⭐ .weather <cidade> - clima
║ ⭐ .news - notícias atuais
║ ⭐ .attp <texto> - texto animado
║ ⭐ .lyrics <música> - letra da música
║ ⭐ .8ball <pergunta> - bola mágica
║ ⭐ .groupinfo - info do grupo
║ ⭐ .staff ou .admins - lista admins
║ ⭐ .vv - visualizar uma vez
║ ⭐ .trt <texto> <idioma> - traduzir
║ ⭐ .ss <link> - captura de tela
║ ⭐ .jid - obter ID do chat
╚═══════════════════╝

╔═══════════════════╗
👑 *Comandos de Admin*:
║ 🛡️ .ban @usuário - banir usuário
║ 🛡️ .promote @usuário - promover admin
║ 🛡️ .demote @usuário - remover admin
║ 🛡️ .mute <minutos> - silenciar grupo
║ 🛡️ .unmute - dessilenciar grupo
║ 🛡️ .delete ou .del - deletar mensagem
║ 🛡️ .kick @usuário - expulsar usuário
║ 🛡️ .warnings @usuário - ver avisos
║ 🛡️ .warn @usuário - dar aviso
║ 🛡️ .antilink - anti-link do grupo
║ 🛡️ .antibadword - filtro palavrões
║ 🛡️ .clear - limpar chat
║ 🛡️ .tag <mensagem> - marcar todos
║ 🛡️ .tagall - mencionar todos
║ 🛡️ .chatbot - bot de conversa
║ 🛡️ .resetlink - resetar link grupo
║ 🛡️ .antitag <on/off> - anti marcação
║ 🛡️ .welcome <on/off> - mensagem boas-vindas
║ 🛡️ .goodbye <on/off> - mensagem despedida
║ 🛡️ .setgdesc <descrição> - mudar descrição
║ 🛡️ .setgname <nome> - mudar nome grupo
║ 🛡️ .setgpp (responder imagem) - foto grupo
╚═══════════════════╝

╔═══════════════════╗
🔐 *Comandos do Dono*:
║ 👨‍💻 .mode <público/privado> - modo bot
║ 👨‍💻 .clearsession - limpar sessão
║ 👨‍💻 .antidelete - anti-delete
║ 👨‍💻 .cleartmp - limpar temporários
║ 👨‍💻 .update - atualizar bot
║ 👨‍💻 .settings - configurações
║ 👨‍💻 .setpp <responder imagem> - foto bot
║ 👨‍💻 .autoreact <on/off> - auto reação
║ 👨‍💻 .autostatus <on/off> - auto status
║ 👨‍💻 .autostatus react <on/off> - reagir status
║ 👨‍💻 .autotyping <on/off> - auto digitando
║ 👨‍💻 .autoread <on/off> - auto ler
║ 👨‍💻 .anticall <on/off> - anti ligação
║ 👨‍💻 .pmblocker <on/off/status> - bloquear DM
║ 👨‍💻 .pmblocker setmsg <texto> - msg bloqueio
╚═══════════════════╝

╔═══════════════════╗
🎨 *Imagem/Figurinha*:
║ 🖼️ .blur <imagem> - desfocar imagem
║ 🖼️ .simage <responder sticker> - sticker→imagem
║ 🖼️ .sticker <responder imagem> - criar sticker
║ 🖼️ .removebg - remover fundo
║ 🖼️ .remini - melhorar qualidade
║ 🖼️ .crop <responder imagem> - cortar
║ 🖼️ .tgsticker <Link> - sticker Telegram
║ 🖼️ .meme - meme aleatório
║ 🖼️ .take <nome> - renomear sticker
║ 🖼️ .emojimix <emoji1>+<emoji2> - misturar emojis
║ 🖼️ .igs <link insta> - download Instagram
║ 🖼️ .igsc <link insta> - stories Instagram
╚═══════════════════╝

╔═══════════════════╗
🌺 *Fotos de Países*:
║ 🗾 .pies <país> - fotos por país
║ 🗾 .china - fotos da China
║ 🗾 .indonesia - fotos da Indonésia
║ 🗾 .japan - fotos do Japão
║ 🗾 .korea - fotos da Coreia
║ 🗾 .hijab - fotos hijab
╚═══════════════════╝

╔═══════════════════╗
🤖 *Inteligência Artificial*:
║
║ 
║ 🧠 .imagine <prompt> - gerar imagem
║ 🧠 .flux <prompt> - arte AI
╚═══════════════════╝

╔═══════════════════╗
💫 *Comandos Divertidos*:
║ 😊 .compliment @usuário - elogiar
║ 😊 .insult @usuário - provocar
║ 😊 .flirt - paquera
║ 😊 .shayari - poesia romântica
║ 😊 .goodnight - boa noite
║ 😊 .roseday - dia das rosas
║ 😊 .character @usuário - personalidade
║ 😊 .wasted @usuário - meme wasted
║ 😊 .ship @usuário - compatibilidade
║ 😊 .simp @usuário - meme simp
║ 😊 .stupid @usuário [texto] - meme burro
╚═══════════════════╝

╔═══════════════════╗
✨ *Criador de Texto*:
║ 🎨 .metallic <texto> - texto metálico
║ 🎨 .ice <texto> - texto de gelo
║ 🎨 .snow <texto> - texto de neve
║ 🎨 .impressive <texto> - impressionante
║ 🎨 .matrix <texto> - estilo Matrix
║ 🎨 .light <texto> - texto luminoso
║ 🎨 .neon <texto> - neon brilhante
║ 🎨 .devil <texto> - estilo diabólico
║ 🎨 .purple <texto> - roxo elegante
║ 🎨 .thunder <texto> - raio elétrico
║ 🎨 .leaves <texto> - folhas naturais
║ 🎨 .1917 <texto> - estilo vintage
║ 🎨 .arena <texto> - arena épica
║ 🎨 .hacker <texto> - hacker verde
║ 🎨 .sand <texto> - areia dourada
║ 🎨 .blackpink <texto> - BlackPink style
║ 🎨 .glitch <texto> - efeito glitch
║ 🎨 .fire <texto> - fogo ardente
╚═══════════════════╝

╔═══════════════════╗
📱 *Downloads*:
║ 🎵 .play <música> - tocar música
║ 🎵 .song <música> - baixar áudio
║ 🎵 .instagram <link> - baixar do Insta
║ 🎵 .facebook <link> - baixar do Face
║ 🎵 .tiktok <link> - baixar do TikTok
║ 🎵 .video <música> - baixar vídeo
║ 🎵 .ytmp4 <Link> - YouTube MP4
╚═══════════════════╝

╔═══════════════════╗
🌈 *Efeitos Especiais*:
║ 💖 .heart - coração brilhante
║ 💖 .horny - efeito picante
║ 💖 .circle - círculo mágico
║ 💖 .lgbt - orgulho LGBT
║ 💖 .lolice - polícia loli
║ 💖 .its-so-stupid - muito burro
║ 💖 .namecard - cartão nome
║ 💖 .oogway - mestre Oogway
║ 💖 .tweet - tweet falso
║ 💖 .ytcomment - comentário YT
║ 💖 .comrade - camarada
║ 💖 .gay - efeito arco-íris
║ 💖 .glass - efeito vidro
║ 💖 .jail - prisão meme
║ 💖 .passed - aprovado
║ 💖 .triggered - irritado
╚═══════════════════╝

╔═══════════════════╗
🌸 *Anime Kawaii*:
║ 😺 .neko - gatinha fofa
║ 😺 .waifu - waifu linda
║ 😺 .loli - loli adorável
║ 😺 .nom - comendo fofo
║ 😺 .poke - cutucar carinhoso
║ 😺 .cry - chorar tristinho
║ 😺 .kiss - beijo doce 💋
║ 😺 .pat - cafuné carinhoso
║ 😺 .hug - abraço apertado 🤗
║ 😺 .wink - piscadinha marota 😉
║ 😺 .facepalm - face palm 🤦‍♀️
╚═══════════════════╝

*˚₊‧꒰ა ☆ ໒꒱ ‧₊˚ 𝗖𝗿𝗶𝗮𝗱𝗼 𝗰𝗼𝗺 ❤️ 𝗽𝗼𝗿 𝗬𝗲𝗻 ˚₊‧꒰ა ☆ ໒꒱ ‧₊˚*`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
            },{ quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
