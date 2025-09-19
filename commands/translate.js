const fetch = require('node-fetch');

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        // Show typing indicator
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        // Check if it's a reply
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            // Get text from quoted message
            textToTranslate = quotedMessage.conversation || 
                            quotedMessage.extendedTextMessage?.text || 
                            quotedMessage.imageMessage?.caption || 
                            quotedMessage.videoMessage?.caption || 
                            '';

            // Get language from command
            lang = match.trim();
        } else {
            // Parse command arguments for direct message
            const args = match.trim().split(' ');
            if (args.length < 2) {
                return sock.sendMessage(chatId, {
                    text: `🌍 *Tradutor Yen-Bot* 🌍\n\n📝 *Como usar:*\n1. Responda a uma mensagem com: .translate <idioma>\n2. Ou digite: .translate <texto> <idioma>\n\n📝 *Exemplos:*\n• .translate olá en\n• .translate “hello world” pt\n\n🌏 *Códigos de idiomas:*\n• en - Inglês 🇺🇸\n• es - Espanhol 🇪🇸\n• fr - Francês 🇫🇷\n• de - Alemão 🇩🇪\n• it - Italiano 🇮🇹\n• pt - Português 🇵🇹\n• ja - Japonês 🇯🇵\n• ko - Coreano 🇰🇷\n• zh - Chinês 🇨🇳\n• ar - Árabe 🇸🇦\n• hi - Hindi 🇮🇳\n\n✨ *Yen-Bot* - Quebrando barreiras linguísticas! 🌸`,
                    quoted: message
                });
            }

            lang = args.pop(); // Get language code
            textToTranslate = args.join(' '); // Get text to translate
        }

        if (!textToTranslate) {
            return sock.sendMessage(chatId, {
                text: '🤷‍♀️ *Nenhum texto encontrado!*\n\n📝 *Para traduzir:*\n• Responda a uma mensagem\n• Ou digite o texto diretamente\n\n💡 *Exemplo:* .translate olá mundo en\n\n✨ *Yen-Bot* - Preciso de texto para traduzir! 🌸',
                quoted: message
            });
        }

        // Try multiple translation APIs in sequence
        let translatedText = null;
        let error = null;

        // Try API 1 (Google Translate API)
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    translatedText = data[0][0][0];
                }
            }
        } catch (e) {
            error = e;
        }

        // If API 1 fails, try API 2
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.responseData && data.responseData.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch (e) {
                error = e;
            }
        }

        // If API 2 fails, try API 3
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.translated) {
                        translatedText = data.translated;
                    }
                }
            } catch (e) {
                error = e;
            }
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // Send translation
        await sock.sendMessage(chatId, {
            text: `🌍 *Tradução Concluída!* 🌍\n\n💬 *Resultado:*\n${translatedText}\n\n✨ *Yen-Bot* - Conectando culturas! 🌸`,
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('❌ Error in translate command:', error);
        await sock.sendMessage(chatId, {
            text: '🌧️ *Erro na tradução!*\n\n🔄 *Possíveis causas:*\n• Servidores sobrecarregados\n• Idioma não suportado\n• Texto muito longo\n\n💡 *Dicas:*\n• Tente novamente em alguns minutos\n• Use textos menores\n• Verifique o código do idioma\n\n✨ *Yen-Bot* - Resolvendo problemas! 🌸',
            quoted: message
        });
    }
}

module.exports = {
    handleTranslateCommand
}; 