const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const princeVideoApi = {
    base: 'https://api.princetechn.com/api/download/ytmp4',
    apikey: process.env.PRINCE_API_KEY || 'prince_tech_api_azfsbshfb',
    async fetchMeta(videoUrl) {
        const params = new URLSearchParams({ apikey: this.apikey, url: videoUrl });
        const url = `${this.base}?${params.toString()}`;
        const { data } = await axios.get(url, { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' } });
        return data;
    }
};

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        
        if (!searchQuery) {
            await sock.sendMessage(chatId, { text: '🎬 *Como usar Download de Vídeo:*\n\n• Digite: .video <nome do vídeo ou link>\n\n📝 *Exemplo:* .video music video\n📝 *Exemplo:* .video https://youtube.com/watch?v=...\n\n🎯 *Formatos suportados:* YouTube\n\n✨ *Yen-Bot* - Downloads em alta qualidade! 🌸' }, { quoted: message });
            return;
        }

        // Determine if input is a YouTube link
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
        } else {
            // Search YouTube for the video
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { text: '😅 *Nenhum vídeo encontrado!*\n\n🔍 *Dicas para melhorar a busca:*\n• Use palavras-chave específicas\n• Tente termos em inglês\n• Adicione nome do artista\n\n💡 *Exemplo:* .video nome música artista\n\n✨ *Yen-Bot* - Sempre tentando encontrar! 🌸' }, { quoted: message });
                return;
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Send thumbnail immediately
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            const captionTitle = videoTitle || searchQuery;
            if (thumb) {
                await sock.sendMessage(chatId, {
                    image: { url: thumb },
                    caption: `🎬 *${captionTitle}*\n\n⏳ *Baixando vídeo...*\n🎯 *Processando em alta qualidade*\n\n✨ *Yen-Bot* - Download iniciado! 🌸`
                }, { quoted: message });
            }
        } catch (e) { console.error('[VIDEO] thumb error:', e?.message || e); }
        

        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            await sock.sendMessage(chatId, { text: '❌ *Link inválido!*\n\n🎯 *Links suportados:*\n• youtube.com/watch?v=...\n• youtu.be/...\n• youtube.com/shorts/...\n\n💡 *Dica:* Copie o link diretamente do YouTube\n\n✨ *Yen-Bot* - Apenas links válidos! 🌸' }, { quoted: message });
            return;
        }

        // PrinceTech video API
        let videoDownloadUrl = '';
        let title = '';
        try {
            const meta = await princeVideoApi.fetchMeta(videoUrl);
            if (meta?.success && meta?.result?.download_url) {
                videoDownloadUrl = meta.result.download_url;
                title = meta.result.title || 'video';
            } else {
                await sock.sendMessage(chatId, { text: '❌ *Falha ao buscar vídeo da API!*\n\n🔄 Possíveis causas:\n• Vídeo indisponível\n• Servidor temporariamente fora\n• Link inválido\n\n💡 *Tente novamente em alguns minutos*\n\n✨ *Yen-Bot* - Processando downloads! 🌸' }, { quoted: message });
                return;
            }
        } catch (e) {
            console.error('[VIDEO] prince api error:', e?.message || e);
            await sock.sendMessage(chatId, { text: '❌ *Falha ao buscar vídeo da API!*\n\n🔄 Possíveis causas:\n• Vídeo indisponível\n• Servidor temporariamente fora\n• Link inválido\n\n💡 *Tente novamente em alguns minutos*\n\n✨ *Yen-Bot* - Processando downloads! 🌸' }, { quoted: message });
            return;
        }
        const filename = `${title}.mp4`;

        // Try sending the video directly from the remote URL (like play.js)
        try {
            await sock.sendMessage(chatId, {
                video: { url: videoDownloadUrl },
                mimetype: 'video/mp4',
                fileName: filename,
                caption: `*${title}*\n\n> *_Downloaded by Knight Bot MD_*`
            }, { quoted: message });
            return;
        } catch (directSendErr) {
            console.log('[video.js] Direct send from URL failed:', directSendErr.message);
        }

        // If direct send fails, fallback to downloading and converting
        // Download the video file first
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFile = path.join(tempDir, `${Date.now()}.mp4`);
        const convertedFile = path.join(tempDir, `converted_${Date.now()}.mp4`);
        
        let buffer;
        let download403 = false;
        try {
            const videoRes = await axios.get(videoDownloadUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Referer': 'https://youtube.com/'
                },
                responseType: 'arraybuffer'
            });
            buffer = Buffer.from(videoRes.data);
        } catch (err) {
            if (err.response && err.response.status === 403) {
                // try alternate URL pattern as best-effort
                download403 = true;
            } else {
                await sock.sendMessage(chatId, { text: '❌ *Falha ao baixar arquivo de vídeo!*\n\n🔄 Possíveis causas:\n• Arquivo muito grande\n• Problema de conexão\n• Servidor sobrecarregado\n\n💡 *Tente com um vídeo menor ou aguarde*\n\n✨ *Yen-Bot* - Downloads inteligentes! 🌸' }, { quoted: message });
                return;
            }
        }
        // Fallback: try another URL if 403
        if (download403) {
            let altUrl = videoDownloadUrl.replace(/(cdn|s)\d+/, 's5');
            try {
                const videoRes = await axios.get(altUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Referer': 'https://youtube.com/'
                    },
                    responseType: 'arraybuffer'
                });
                buffer = Buffer.from(videoRes.data);
            } catch (err2) {
                await sock.sendMessage(chatId, { text: '❌ *Falha no download do CDN alternativo!*\n\n🔄 Todas as tentativas falharam\n• Vídeo pode estar protegido\n• Problema temporário do servidor\n\n💡 *Tente com outro vídeo ou aguarde*\n\n✨ *Yen-Bot* - Sempre tentando! 🌸' }, { quoted: message });
                return;
            }
        }
        if (!buffer || buffer.length < 1024) {
            await sock.sendMessage(chatId, { text: '❌ *Arquivo baixado está vazio ou muito pequeno!*\n\n🔄 Possíveis causas:\n• Download incompleto\n• Vídeo corrompido\n• Problema no servidor\n\n💡 *Tente novamente em alguns minutos*\n\n✨ *Yen-Bot* - Verificando qualidade! 🌸' }, { quoted: message });
            return;
        }
        
        fs.writeFileSync(tempFile, buffer);

        try {
            await execPromise(`ffmpeg -i "${tempFile}" -c:v libx264 -c:a aac -preset veryfast -crf 26 -movflags +faststart "${convertedFile}"`);
            // Check if conversion was successful
            if (!fs.existsSync(convertedFile)) {
                await sock.sendMessage(chatId, { text: '❌ *Arquivo convertido não encontrado!*\n\n🔄 Erro durante conversão\n• Processo interrompido\n• Falta de espaço\n\n💡 *Tente novamente*\n\n✨ *Yen-Bot* - Otimizando vídeos! 🌸' }, { quoted: message });
                return;
            }
            const stats = fs.statSync(convertedFile);
            const maxSize = 62 * 1024 * 1024; // 62MB
            if (stats.size > maxSize) {
                await sock.sendMessage(chatId, { text: '📦 *Vídeo muito grande para WhatsApp!*\n\n📏 *Limite:* 64MB\n🎬 *Seu vídeo:* Maior que o limite\n\n💡 *Dicas:*\n• Tente vídeos mais curtos\n• Use resolução menor\n• Procure versões compactadas\n\n✨ *Yen-Bot* - Respeitando limites! 🌸' }, { quoted: message });
                return;
            }
            // Try sending the converted video
            try {
                await sock.sendMessage(chatId, {
                    video: { url: convertedFile },
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*`
                }, { quoted: message });
            } catch (sendErr) {
                console.error('[VIDEO] send url failed, trying buffer:', sendErr?.message || sendErr);
                const videoBuffer = fs.readFileSync(convertedFile);
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*`
                }, { quoted: message });
            }
            
        } catch (conversionError) {
            console.error('[VIDEO] conversion failed, trying original file:', conversionError?.message || conversionError);
            try {
                if (!fs.existsSync(tempFile)) {
                    await sock.sendMessage(chatId, { text: '❌ *Arquivo temporário não encontrado!*\n\n🔄 Erro durante processamento\n• Arquivo foi removido\n• Problema de sistema\n\n💡 *Tente novamente*\n\n✨ *Yen-Bot* - Processando novamente! 🌸' }, { quoted: message });
                    return;
                }
                const origStats = fs.statSync(tempFile);
                const maxSize = 62 * 1024 * 1024; // 62MB
                if (origStats.size > maxSize) {
                    await sock.sendMessage(chatId, { text: '📦 *Vídeo muito grande para WhatsApp!*\n\n📏 *Limite:* 64MB\n🎬 *Seu vídeo:* Maior que o limite\n\n💡 *Dicas:*\n• Tente vídeos mais curtos\n• Use resolução menor\n• Procure versões compactadas\n\n✨ *Yen-Bot* - Respeitando limites! 🌸' }, { quoted: message });
                    return;
                }
            } catch {}
            // Try sending the original file
            try {
                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*`
                }, { quoted: message });
            } catch (sendErr2) {
                console.error('[VIDEO] send original url failed, trying buffer:', sendErr2?.message || sendErr2);
                const videoBuffer = fs.readFileSync(tempFile);
                await sock.sendMessage(chatId, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: filename,
                    caption: `*${title}*`
                }, { quoted: message });
            }
        }

        // Clean up temp files
        setTimeout(() => {
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
                if (fs.existsSync(convertedFile)) {
                    fs.unlinkSync(convertedFile);
                }
            } catch (cleanupErr) {
                console.error('[VIDEO] cleanup error:', cleanupErr?.message || cleanupErr);
            }
        }, 3000);


    } catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        await sock.sendMessage(chatId, { text: '❌ *Download falhou!*\n\n🔄 *Erro:* ' + (error?.message || 'Erro desconhecido') + '\n\n💡 *Soluções:*\n• Verifique o link\n• Tente novamente em alguns minutos\n• Use outro vídeo\n\n✨ *Yen-Bot* - Sempre tentando ajudar! 🌸' }, { quoted: message });
    }
}

module.exports = videoCommand; 