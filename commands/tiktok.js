const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function tiktokCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(message.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: `🎵 *Como usar Download TikTok:*

• Digite: .tiktok <link do TikTok>

📝 *Exemplo:* .tiktok https://tiktok.com/@user/video/...

🎯 *Formatos aceitos:*
• tiktok.com
• vm.tiktok.com
• vt.tiktok.com

✨ *Yen-Bot* - TikToks sem marca d'água! 🌸`
            });
        }

        // Extract URL from command
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            return await sock.sendMessage(chatId, {
                text: `🎵 *Como usar Download TikTok:*

• Digite: .tiktok <link do TikTok>

📝 *Exemplo:* .tiktok https://tiktok.com/@user/video/...

🎯 *Formatos aceitos:*
• tiktok.com
• vm.tiktok.com
• vt.tiktok.com

✨ *Yen-Bot* - TikToks sem marca d'água! 🌸`
            });
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, {
                text: `❌ *Link inválido!*

🎯 *Links válidos do TikTok:*
• https://tiktok.com/@user/video/...
• https://vm.tiktok.com/...
• https://vt.tiktok.com/...

💡 *Dica:* Copie o link direto do app TikTok

✨ *Yen-Bot* - Apenas links oficiais! 🌸`
            });
        }

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        try {
            // Try multiple APIs in sequence
            const apis = [
                `https://api.princetechn.com/api/download/tiktok?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv3?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv4?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
            ];



            let videoUrl = null;
            let audioUrl = null;
            let title = null;

            // Try each API until one works
            for (const apiUrl of apis) {
                try {
                    const response = await axios.get(apiUrl, { timeout: 10000 });
                    
                    if (response.data) {
                        // Handle different API response formats
                        if (response.data.result && response.data.result.videoUrl) {
                            // PrinceTech API format
                            videoUrl = response.data.result.videoUrl;
                            audioUrl = response.data.result.audioUrl;
                            title = response.data.result.title;
                            break;
                        } else if (response.data.tiktok && response.data.tiktok.video) {
                            // Dreaded API format
                            videoUrl = response.data.tiktok.video;
                            break;
                        } else if (response.data.video) {
                            // Alternative format
                            videoUrl = response.data.video;
                            break;
                        }
                    }
                } catch (apiError) {
                    console.error(`TikTok API failed: ${apiError.message}`);
                    continue;
                }
            }

            // If no API worked, try the original ttdl method
            if (!videoUrl) {
                let downloadData = await ttdl(url);
                if (downloadData && downloadData.data && downloadData.data.length > 0) {
                    const mediaData = downloadData.data;
                    for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                        const media = mediaData[i];
                        const mediaUrl = media.url;

                        // Check if URL ends with common video extensions
                        const isVideo = /\\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                      media.type === 'video';

                        if (isVideo) {
                            await sock.sendMessage(chatId, {
                                video: { url: mediaUrl },
                                mimetype: "video/mp4",
                                caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧"
                            }, { quoted: message });
                        } else {
                            await sock.sendMessage(chatId, {
                                image: { url: mediaUrl },
                                caption: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧"
                            }, { quoted: message });
                        }
                    }
                    return;
                }
            }

            // Send the video if we got a URL from the APIs
            if (videoUrl) {
                try {
                    // Download video as buffer
                    const videoResponse = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });
                    
                    const videoBuffer = Buffer.from(videoResponse.data);
                    
                    const caption = title ? `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Title: ${title}` : "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧";
                    
                    await sock.sendMessage(chatId, {
                        video: videoBuffer,
                        mimetype: "video/mp4",
                        caption: caption
                    }, { quoted: message });

                    // If we have audio URL, download and send it as well
                    if (audioUrl) {
                        try {
                            const audioResponse = await axios.get(audioUrl, {
                                responseType: 'arraybuffer',
                                timeout: 30000,
                                headers: {
                                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                                }
                            });
                            
                            const audioBuffer = Buffer.from(audioResponse.data);
                            
                            await sock.sendMessage(chatId, {
                                audio: audioBuffer,
                                mimetype: "audio/mp3",
                                caption: `🎵 *Áudio do TikTok*

✨ *Yen-Bot* - Sem marca d'água! 🌸`
                            }, { quoted: message });
                        } catch (audioError) {
                            console.error(`Failed to download audio: ${audioError.message}`);
                        }
                    }
                    return;
                } catch (downloadError) {
                    console.error(`Failed to download video: ${downloadError.message}`);
                    // Fallback to URL method
                    try {
                        const caption = title ? `𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧\n\n📝 Title: ${title}` : "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗗 𝗕𝗬 𝗞𝗡𝗜𝗚𝗛𝗧-𝗕𝗢𝗧";
                        
                        await sock.sendMessage(chatId, {
                            video: { url: videoUrl },
                            mimetype: "video/mp4",
                            caption: caption
                        }, { quoted: message });
                        return;
                    } catch (urlError) {
                        console.error(`URL method also failed: ${urlError.message}`);
                    }
                }
            }

            // If we reach here, no method worked
            return await sock.sendMessage(chatId, {
                text: `❌ *Falha no download do TikTok!*

🔄 *Todos os métodos falharam*
• Vídeo pode estar privado
• Link pode estar quebrado
• Servidores temporariamente indisponíveis

💡 *Dicas:*
• Tente outro vídeo
• Verifique se o link está correto
• Aguarde alguns minutos

✨ *Yen-Bot* - Sempre tentando! 🌸`
            });
        } catch (error) {
            console.error('Error in TikTok download:', error);
            await sock.sendMessage(chatId, {
                text: `❌ *Falha no download!*

🔄 *Erro durante processamento*
• Problema de conexão
• Vídeo pode estar protegido

💡 *Tente com outro link*

✨ *Yen-Bot* - Downloads inteligentes! 🌸`
            });
        }
    } catch (error) {
        console.error('Error in TikTok command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Erro no processamento!*

🔄 *Erro interno do sistema*
• Tente novamente mais tarde
• Verifique sua conexão

💡 *Se persistir, contate o administrador*

✨ *Yen-Bot* - Resolvendo problemas! 🌸`
        });
    }
}

module.exports = tiktokCommand;
