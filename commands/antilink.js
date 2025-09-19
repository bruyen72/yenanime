const { bots } = require('../lib/antilink');
const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```Apenas para Administradores do Grupo!```' }, { quoted: message });
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`CONFIGURAÇÃO ANTILINK\n\n${prefix}antilink on\n${prefix}antilink set delete | kick | warn\n${prefix}antilink off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '*_Antilink já está ativado_*' }, { quoted: message });
                    return;
                }
                const result = await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { 
                    text: result ? '*_Antilink foi ATIVADO_*' : '*_Falha ao ativar Antilink_*' 
                },{ quoted: message });
                break;

            case 'off':
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antilink foi DESATIVADO_*' }, { quoted: message });
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Por favor especifique uma ação: ${prefix}antilink set delete | kick | warn_*` 
                    }, { quoted: message });
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    await sock.sendMessage(chatId, { 
                        text: '*_Ação inválida. Escolha delete, kick, ou warn._*' 
                    }, { quoted: message });
                    return;
                }
                const setResult = await setAntilink(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { 
                    text: setResult ? `*_Ação do Antilink definida para ${setAction}_*` : '*_Falha ao definir ação do Antilink_*' 
                }, { quoted: message });
                break;

            case 'get':
                const status = await getAntilink(chatId, 'on');
                const actionConfig = await getAntilink(chatId, 'on');
                await sock.sendMessage(chatId, { 
                    text: `*_Configuração do Antilink:_*\nStatus: ${status ? 'ATIVO' : 'INATIVO'}\nAção: ${actionConfig ? actionConfig.action : 'Não definido'}` 
                }, { quoted: message });
                break;

            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antilink para ver o uso._*` });
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, { text: '*_Erro ao processar comando antilink_*' });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    const antilinkSetting = getAntilinkSetting(chatId);
    if (antilinkSetting === 'off') return;

    console.log(`Antilink Setting for ${chatId}: ${antilinkSetting}`);
    console.log(`Checking message for links: ${userMessage}`);
    
    // Log the full message object to diagnose message structure
    console.log("Full message object: ", JSON.stringify(message, null, 2));

    let shouldDelete = false;

    const linkPatterns = {
        whatsappGroup: /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/,
        whatsappChannel: /wa\.me\/channel\/[A-Za-z0-9]{20,}/,
        telegram: /t\.me\/[A-Za-z0-9_]+/,
        allLinks: /https?:\/\/[^\s]+/,
    };

    // Detect WhatsApp Group links
    if (antilinkSetting === 'whatsappGroup') {
        console.log('WhatsApp group link protection is enabled.');
        if (linkPatterns.whatsappGroup.test(userMessage)) {
            console.log('Detected a WhatsApp group link!');
            shouldDelete = true;
        }
    } else if (antilinkSetting === 'whatsappChannel' && linkPatterns.whatsappChannel.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'telegram' && linkPatterns.telegram.test(userMessage)) {
        shouldDelete = true;
    } else if (antilinkSetting === 'allLinks' && linkPatterns.allLinks.test(userMessage)) {
        shouldDelete = true;
    }

    if (shouldDelete) {
        const quotedMessageId = message.key.id; // Get the message ID to delete
        const quotedParticipant = message.key.participant || senderId; // Get the participant ID

        console.log(`Attempting to delete message with id: ${quotedMessageId} from participant: ${quotedParticipant}`);

        try {
            await sock.sendMessage(chatId, {
                delete: { remoteJid: chatId, fromMe: false, id: quotedMessageId, participant: quotedParticipant },
            });
            console.log(`Message with ID ${quotedMessageId} deleted successfully.`);
        } catch (error) {
            console.error('Failed to delete message:', error);
        }

        const mentionedJidList = [senderId];
        await sock.sendMessage(chatId, { text: `Aviso! @${senderId.split('@')[0]}, postar links não é permitido.`, mentions: mentionedJidList });
    } else {
        console.log('No link detected or protection not enabled for this type of link.');
    }
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
};
