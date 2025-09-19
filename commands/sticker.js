const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const crypto = require('crypto');

// Try to import webpmux, fallback to basic method if not available
let webp;
try {
    webp = require('node-webpmux');
} catch (error) {
    console.log('node-webpmux not available, using fallback method');
    webp = null;
}

async function stickerCommand(sock, chatId, message) {
    // The message that will be quoted in the reply.
    const messageToQuote = message;
    
    // The message object that contains the media to be downloaded.
    let targetMessage = message;

    // If the message is a reply, the target media is in the quoted message.
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        // We need to build a new message object for downloadMediaMessage to work correctly.
        const quotedInfo = message.message.extendedTextMessage.contextInfo;
        targetMessage = {
            key: {
                remoteJid: chatId,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedInfo.quotedMessage
        };
    }

    const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.videoMessage || targetMessage.message?.documentMessage;

    if (!mediaMessage) {
        await sock.sendMessage(chatId, {
            text: '🌸 *Para criar uma figurinha:*\n\n• Responda a uma imagem/vídeo com .sticker\n• Ou envie uma imagem/vídeo com .sticker na legenda\n\n✨ *Dica:* Use vídeos de até 10 segundos para melhores resultados!',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
            }
        },{ quoted: messageToQuote });
        return;
    }

    try {
        // Send processing message
        await sock.sendMessage(chatId, {
            text: '🔄 *Processando figurinha...*\n\n⏳ Aguarde alguns segundos\n\n✨ *Yen-Bot* - Criando sua figurinha! 🌸'
        }, { quoted: messageToQuote });

        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
            logger: undefined, 
            reuploadRequest: sock.updateMediaMessage 
        });

        if (!mediaBuffer) {
            await sock.sendMessage(chatId, {
                text: '❌ *Falha ao baixar mídia!*\n\n🔄 Tente novamente em alguns instantes.\n\n✨ *Yen-Bot* - Processando sua figurinha! 🌸'
            });
            return;
        }

        // Create temp directory with better error handling
        let tmpDir = '/tmp';
        try {
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
        } catch (error) {
            console.log('Using current directory for temp files');
            tmpDir = process.cwd();
        }

        // Generate unique temp file paths
        const timestamp = Date.now() + Math.random().toString(36).substring(7);
        const tempInput = path.join(tmpDir, `sticker_input_${timestamp}`);
        const tempOutput = path.join(tmpDir, `sticker_output_${timestamp}.webp`);

        // Write media to temp file with error handling
        try {
            fs.writeFileSync(tempInput, mediaBuffer);
        } catch (error) {
            throw new Error('Failed to write temp file: ' + error.message);
        }

        // Check if media is animated
        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                          mediaMessage.mimetype?.includes('video') || 
                          (mediaMessage.seconds && mediaMessage.seconds > 0);

        // Simpler, more reliable ffmpeg command for Replit
        let ffmpegCommand;
        if (isAnimated) {
            // For animated stickers - optimized for Replit
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -t 6 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -quality 50 -compression_level 4 -loop 0 "${tempOutput}"`;
        } else {
            // For static stickers
            ffmpegCommand = `ffmpeg -y -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -quality 80 -compression_level 4 "${tempOutput}"`;
        }

        // Execute ffmpeg with timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('FFmpeg timeout'));
            }, 30000); // 30 second timeout

            exec(ffmpegCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
                clearTimeout(timeout);
                if (error) {
                    console.error('FFmpeg error:', error.message);
                    console.error('FFmpeg stderr:', stderr);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        // Check if output file was created
        if (!fs.existsSync(tempOutput)) {
            throw new Error('FFmpeg failed to create output file');
        }

        // Read the WebP file
        let webpBuffer = fs.readFileSync(tempOutput);

        // If file is too large, try compression
        if (webpBuffer.length > 1000 * 1024) {
            const tempOutput2 = path.join(tmpDir, `sticker_compressed_${timestamp}.webp`);
            const compressCmd = isAnimated 
                ? `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=400:400:force_original_aspect_ratio=decrease,fps=10,pad=400:400:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -quality 30 -compression_level 6 "${tempOutput2}"`
                : `ffmpeg -y -i "${tempInput}" -vf "scale=400:400:force_original_aspect_ratio=decrease,pad=400:400:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -quality 50 -compression_level 6 "${tempOutput2}"`;
            
            try {
                await new Promise((resolve, reject) => {
                    exec(compressCmd, { maxBuffer: 1024 * 1024 * 10 }, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                
                if (fs.existsSync(tempOutput2)) {
                    webpBuffer = fs.readFileSync(tempOutput2);
                    try { fs.unlinkSync(tempOutput2); } catch {}
                }
            } catch (compressError) {
                console.log('Compression failed, using original');
            }
        }

        // Add metadata if webpmux is available
        let finalBuffer = webpBuffer;
        if (webp) {
            try {
                const img = new webp.Image();
                await img.load(webpBuffer);

                // Create metadata
                const json = {
                    'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
                    'sticker-pack-name': settings.packname || 'Yen-Bot',
                    'sticker-pack-publisher': settings.author || 'Yen',
                    'emojis': ['🤖']
                };

                // Create exif buffer
                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);

                img.exif = exif;
                finalBuffer = await img.save(null);
            } catch (metadataError) {
                console.log('Metadata addition failed, using original webp');
                finalBuffer = webpBuffer;
            }
        }

        // Send the sticker
        await sock.sendMessage(chatId, { 
            sticker: finalBuffer
        }, { quoted: messageToQuote });

        // Cleanup temp files
        try {
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }

    } catch (error) {
        console.error('Error in sticker command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ *Falha ao criar figurinha!*\n\n🔄 Possíveis causas:\n• Formato não suportado\n• Arquivo muito grande\n• Erro de processamento\n\n💡 *Dicas:*\n• Use imagens/vídeos menores\n• Tente outros formatos (JPG, PNG, MP4)\n• Aguarde alguns segundos e tente novamente\n\n✨ *Yen-Bot* - Criando suas figurinhas! 🌸',
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
            }
        });
    }
}

module.exports = stickerCommand;
