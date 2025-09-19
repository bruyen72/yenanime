const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    // 1) Quoted image (highest priority)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 2) Image in the current message
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }

    // 3) Mentioned or replied participant avatar
    let targetJid;
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    if (ctx?.mentionedJid?.length > 0) {
        targetJid = ctx.mentionedJid[0];
    } else if (ctx?.participant) {
        targetJid = ctx.participant;
    } else {
        targetJid = message.key.participant || message.key.remoteJid;
    }

    try {
        const url = await sock.profilePictureUrl(targetJid, 'image');
        return url;
    } catch {
        return 'https://i.imgur.com/2wzGhpF.png';
    }
}

async function handleHeart(sock, chatId, message) {
    try {
        const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
        const url = `https://api.some-random-api.com/canvas/misc/heart?avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
    } catch (error) {
        console.error('Error in misc heart:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao criar imagem de coração. Tente novamente mais tarde.' }, { quoted: message });
    }
}

async function miscCommand(sock, chatId, message, args) {
    const sub = (args[0] || '').toLowerCase();
    const rest = args.slice(1);

    async function simpleAvatarOnly(endpoint) {
        try {
            const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
            let url;

            // Try different API endpoints based on the command
            if (['lgbt', 'lesbian', 'nonbinary', 'pansexual', 'transgender', 'bisexual', 'asexual'].includes(endpoint)) {
                // Try multiple APIs for LGBT+ flag overlays
                const apis = [
                    `https://some-random-api.com/canvas/overlay/${endpoint}?avatar=${encodeURIComponent(avatarUrl)}`,
                    `https://api.some-random-api.com/canvas/misc/${endpoint}?avatar=${encodeURIComponent(avatarUrl)}`,
                    `https://some-random-api.com/canvas/misc/${endpoint}?avatar=${encodeURIComponent(avatarUrl)}`
                ];

                for (const apiUrl of apis) {
                    try {
                        const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 10000 });
                        await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                        return;
                    } catch (err) {
                        console.log(`Failed API: ${apiUrl}`);
                        continue;
                    }
                }

                // If all APIs fail, send appropriate pride text message
                const prideMessages = {
                    lgbt: '🏳️‍🌈 *LGBT Pride!* 🏳️‍🌈\n\n💖 Orgulho e amor sempre! ✨\n🌈 Love is Love! 💕',
                    lesbian: '🏳️‍⚧️ *Lesbian Pride!* 🏳️‍⚧️\n\n💜 Orgulho lésbico! 🤍\n❤️ Amor entre mulheres! 🧡',
                    gay: '🏳️‍🌈 *Gay Pride!* 🏳️‍🌈\n\n✨ Seja quem você é com orgulho! 🌈\n💖 Love is Love! 💕',
                    bisexual: '💗 *Bisexual Pride!* 💜\n\n💙 Amo sem limites! ✨\n🌈 Bi e orgulhoso! 💕',
                    transgender: '🏳️‍⚧️ *Trans Pride!* 🏳️‍⚧️\n\n💙 Orgulho trans! 💗\n🤍 Seja você mesmo! ✨',
                    pansexual: '💗 *Pansexual Pride!* 💛\n\n💙 Amor sem barreiras! ✨\n🌈 Pan e orgulhoso! 💕',
                    nonbinary: '💛 *Non-Binary Pride!* 🤍\n\n💜 Além do binário! ✨\n🖤 Orgulho NB! 🌈',
                    asexual: '🖤 *Asexual Pride!* 🤍\n\n💜 Válido e amado! ✨\n🌈 Orgulho ace! 💕'
                };

                await sock.sendMessage(chatId, {
                    text: prideMessages[endpoint] || prideMessages.lgbt
                }, { quoted: message });

            } else {
                url = `https://api.some-random-api.com/canvas/misc/${endpoint}?avatar=${encodeURIComponent(avatarUrl)}`;
                const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
            }
        } catch (error) {
            console.error(`Error in ${endpoint}:`, error);
            if (['lgbt', 'lesbian', 'nonbinary', 'pansexual', 'transgender', 'bisexual', 'asexual', 'gay'].includes(endpoint)) {
                const prideMessages = {
                    lgbt: '🏳️‍🌈 *LGBT Pride!* 🏳️‍🌈\n\n💖 Orgulho e amor sempre! ✨\n🌈 Love is Love! 💕',
                    lesbian: '🏳️‍⚧️ *Lesbian Pride!* 🏳️‍⚧️\n\n💜 Orgulho lésbico! 🤍\n❤️ Amor entre mulheres! 🧡',
                    gay: '🏳️‍🌈 *Gay Pride!* 🏳️‍🌈\n\n✨ Seja quem você é com orgulho! 🌈\n💖 Love is Love! 💕',
                    bisexual: '💗 *Bisexual Pride!* 💜\n\n💙 Amo sem limites! ✨\n🌈 Bi e orgulhoso! 💕',
                    transgender: '🏳️‍⚧️ *Trans Pride!* 🏳️‍⚧️\n\n💙 Orgulho trans! 💗\n🤍 Seja você mesmo! ✨',
                    pansexual: '💗 *Pansexual Pride!* 💛\n\n💙 Amor sem barreiras! ✨\n🌈 Pan e orgulhoso! 💕',
                    nonbinary: '💛 *Non-Binary Pride!* 🤍\n\n💜 Além do binário! ✨\n🖤 Orgulho NB! 🌈',
                    asexual: '🖤 *Asexual Pride!* 🤍\n\n💜 Válido e amado! ✨\n🌈 Orgulho ace! 💕'
                };
                await sock.sendMessage(chatId, {
                    text: prideMessages[endpoint] || prideMessages.lgbt
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ Erro ao gerar imagem ${endpoint}. Tente novamente mais tarde.`
                }, { quoted: message });
            }
        }
    }

    try {
        switch (sub) {
            case 'heart':
                await simpleAvatarOnly('heart');
                break;
            
            case 'horny':
                await simpleAvatarOnly('horny');
                break;
            case 'circle':
                await simpleAvatarOnly('circle');
                break;
            case 'lgbt':
            case 'lesbian':
            case 'nonbinary':
            case 'pansexual':
            case 'transgender':
            case 'bisexual':
            case 'asexual':
                await simpleAvatarOnly(sub);
                break;
            case 'lied':
                await simpleAvatarOnly('lied');
                break;
            case 'lolice':
                await simpleAvatarOnly('lolice');
                break;
            case 'simpcard':
                await simpleAvatarOnly('simpcard');
                break;
            case 'tonikawa':
                await simpleAvatarOnly('tonikawa');
                break;

            case 'its-so-stupid': {
                const dog = rest.join(' ').trim();
                if (!dog) {
                    await sock.sendMessage(chatId, { text: '🤡 *Uso:* `.misc its-so-stupid <texto>`\n\n📝 *Exemplo:* `.misc its-so-stupid sou burro`' }, { quoted: message });
                    return;
                }
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const url = `https://api.some-random-api.com/canvas/misc/its-so-stupid?dog=${encodeURIComponent(dog)}&avatar=${encodeURIComponent(avatarUrl)}`;
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                break;
            }

            case 'namecard': {
                // .misc namecard username|birthday|description(optional)
                const joined = rest.join(' ');
                const [username, birthday, description] = joined.split('|').map(s => (s || '').trim());
                if (!username || !birthday) {
                    await sock.sendMessage(chatId, { text: 'Uso: .misc namecard username|aniversário|descrição(opcional)' }, { quoted: message });
                    return;
                }
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const params = new URLSearchParams({ username, birthday, avatar: avatarUrl });
                if (description) params.append('description', description);
                const url = `https://api.some-random-api.com/canvas/misc/namecard?${params.toString()}`;
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                break;
            }

           
            case 'oogway':
            case 'oogway2': {
                const quote = rest.join(' ').trim();
                if (!quote) {
                    await sock.sendMessage(chatId, { text: `Uso: .misc ${sub} <citação>` }, { quoted: message });
                    return;
                }
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const url = `https://api.some-random-api.com/canvas/misc/${sub}?quote=${encodeURIComponent(quote)}&avatar=${encodeURIComponent(avatarUrl)}`;
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                break;
            }

            case 'tweet': {
                // .misc tweet displayname|username|comment|theme(optional: light/dark)
                const joined = rest.join(' ');
                const [displayname, username, comment, theme] = joined.split('|').map(s => (s || '').trim());
                if (!displayname || !username || !comment) {
                    await sock.sendMessage(chatId, { text: 'Uso: .misc tweet nome_exibido|username|comentário|tema(opcional light/dark)' }, { quoted: message });
                    return;
                }
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const params = new URLSearchParams({ displayname, username, comment, avatar: avatarUrl });
                if (theme) params.append('theme', theme);
                const url = `https://api.some-random-api.com/canvas/misc/tweet?${params.toString()}`;
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                break;
            }

            case 'youtube-comment': {
                // .misc youtube-comment username|comment
                const joined = rest.join(' ');
                const [username, comment] = joined.split('|').map(s => (s || '').trim());
                if (!username || !comment) {
                    await sock.sendMessage(chatId, { text: 'Uso: .misc youtube-comment username|comentário' }, { quoted: message });
                    return;
                }
                const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                const params = new URLSearchParams({ username, comment, avatar: avatarUrl });
                const url = `https://api.some-random-api.com/canvas/misc/youtube-comment?${params.toString()}`;
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                break;
            }
            // Overlay endpoints
            case 'comrade':
            case 'gay':
            case 'glass':
            case 'jail':
            case 'passed':
            case 'triggered': {
                try {
                    const avatarUrl = await getQuotedOrOwnImageUrl(sock, message);
                    const overlay = sub;

                    // Special handling for gay command with fallback
                    if (sub === 'gay') {
                        const apis = [
                            `https://some-random-api.com/canvas/overlay/gay?avatar=${encodeURIComponent(avatarUrl)}`,
                            `https://api.some-random-api.com/canvas/overlay/${overlay}?avatar=${encodeURIComponent(avatarUrl)}`,
                            `https://some-random-api.com/canvas/misc/lgbt?avatar=${encodeURIComponent(avatarUrl)}`
                        ];

                        for (const apiUrl of apis) {
                            try {
                                const response = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 10000 });
                                await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                                return;
                            } catch (err) {
                                console.log(`Failed Gay API: ${apiUrl}`);
                                continue;
                            }
                        }

                        // If all APIs fail, send rainbow text message
                        await sock.sendMessage(chatId, {
                            text: '🏳️‍🌈 *Gay Pride!* 🏳️‍🌈\n\n✨ Seja quem você é com orgulho! 🌈\n💖 Love is Love! 💕\n🎉 Celebre o amor! 🎊'
                        }, { quoted: message });

                    } else {
                        const url = `https://api.some-random-api.com/canvas/overlay/${overlay}?avatar=${encodeURIComponent(avatarUrl)}`;
                        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                        await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: message });
                    }
                } catch (error) {
                    console.error(`Error in overlay ${sub}:`, error);
                    if (sub === 'gay') {
                        await sock.sendMessage(chatId, {
                            text: '🏳️‍🌈 *Gay Pride!* 🏳️‍🌈\n\n✨ Seja quem você é com orgulho! 🌈\n💖 Love is Love! 💕\n🎉 Celebre o amor! 🎊'
                        }, { quoted: message });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `❌ Erro ao gerar overlay ${sub}. Tente novamente mais tarde.`
                        }, { quoted: message });
                    }
                }
                break;
            }

            default:
                await sock.sendMessage(chatId, {
                    text: '🎨 *Comandos Misc Disponíveis:* 🎨\n\n' +
                          '💕 **Filtros:** heart, horny, circle\n' +
                          '🏳️‍🌈 **LGBT+:** lgbt, gay, lesbian, bisexual, transgender, pansexual, nonbinary, asexual\n' +
                          '😂 **Memes:** lied, lolice, simpcard, tonikawa\n' +
                          '🎭 **Overlays:** comrade, glass, jail, passed, triggered\n' +
                          '📝 **Com Texto:**\n' +
                          '• `.misc its-so-stupid <texto>`\n' +
                          '• `.misc namecard nome|aniversário|descrição`\n' +
                          '• `.misc oogway <citação>`\n' +
                          '• `.misc tweet nome|@user|texto|tema`\n' +
                          '• `.misc youtube-comment user|texto`\n\n' +
                          '💡 *Use com imagem, mention ou reply!*'
                }, { quoted: message });
                break;
        }
    } catch (error) {
        console.error('Error in misc command:', error);
        await sock.sendMessage(chatId, { text: '❌ Falha ao gerar imagem. Verifique seus parâmetros e tente novamente.' }, { quoted: message });
    }
}

module.exports = { miscCommand, handleHeart };


