const yts = require('yt-search');
const axios = require('axios');

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: "🎵 *Qual música você quer baixar?*\n\n*Exemplo:* .play Imagine Dragons Bones\n\n✨ *Yen-Bot* - Seus downloads favoritos! 🌸"
            });
        }

        // Search for the song
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: "❌ Nenhuma música encontrada!\n\n🔍 *Tente:*\n• Verificar a ortografia\n• Usar nome do artista + música\n• Termos mais específicos\n\n✨ *Yen-Bot* sempre aqui para ajudar! 🌸"
            });
        }

        // Send loading message
        await sock.sendMessage(chatId, {
            text: "🎵 *Baixando sua música...*\n\n⏳ *Aguarde um momento, estou processando o download para você!*\n\n✨ *Yen-Bot* - Qualidade garantida! 🌸"
        });

        // Get the first video result
        const video = videos[0];
        const urlYt = video.url;

        // Fetch audio data from API
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return await sock.sendMessage(chatId, {
                text: "❌ *Falha no download!*\n\n🔄 *Por favor, tente novamente em alguns instantes.*\n\n💡 *Dica:* Se o problema persistir, tente com outra música.\n\n✨ *Yen-Bot* - Sempre trabalhando para você! 🌸"
            });
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title;

        // Send the audio
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in play command:', error);
        await sock.sendMessage(chatId, {
            text: "❌ *Erro inesperado!*\n\n🔄 *Tente novamente em alguns minutos.*\n\n🛠️ *Se o problema persistir, entre em contato com o administrador.*\n\n✨ *Yen-Bot* - Desculpe pelo inconveniente! 🌸"
        });
    }
}

module.exports = playCommand; 

/*Powered by YEN-BOT*
*Enhanced with love by Yen* 🌸*/