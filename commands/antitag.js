const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '```Apenas para Administradores do Grupo!```' },{quoted :message});
            return;
        }

        const prefix = '.';
        const args = userMessage.slice(9).toLowerCase().trim().split(' ');
        const action = args[0];

        if (!action) {
            const usage = `\`\`\`CONFIGURAÇÃO ANTITAG\n\n${prefix}antitag on\n${prefix}antitag set delete | kick\n${prefix}antitag off\n\`\`\``;
            await sock.sendMessage(chatId, { text: usage },{quoted :message});
            return;
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, { text: '*_Antitag já está ativado_*' },{quoted :message});
                    return;
                }
                const result = await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, { 
                    text: result ? '*_Antitag foi ATIVADO_*' : '*_Falha ao ativar Antitag_*' 
                },{quoted :message});
                break;

            case 'off':
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, { text: '*_Antitag foi DESATIVADO_*' },{quoted :message});
                break;

            case 'set':
                if (args.length < 2) {
                    await sock.sendMessage(chatId, { 
                        text: `*_Por favor especifique uma ação: ${prefix}antitag set delete | kick_*` 
                    },{quoted :message});
                    return;
                }
                const setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    await sock.sendMessage(chatId, { 
                        text: '*_Ação inválida. Escolha delete ou kick._*' 
                    },{quoted :message});
                    return;
                }
                const setResult = await setAntitag(chatId, 'on', setAction);
                await sock.sendMessage(chatId, { 
                    text: setResult ? `*_Ação do Antitag definida para ${setAction}_*` : '*_Falha ao definir ação do Antitag_*' 
                },{quoted :message});
                break;

            case 'get':
                const status = await getAntitag(chatId, 'on');
                const actionConfig = await getAntitag(chatId, 'on');
                await sock.sendMessage(chatId, { 
                    text: `*_Configuração do Antitag:_*\nStatus: ${status ? 'ATIVO' : 'INATIVO'}\nAção: ${actionConfig ? actionConfig.action : 'Não definido'}` 
                },{quoted :message});
                break;

            default:
                await sock.sendMessage(chatId, { text: `*_Use ${prefix}antitag para ver o uso._*` },{quoted :message});
        }
    } catch (error) {
        console.error('Error in antitag command:', error);
        await sock.sendMessage(chatId, { text: '*_Erro ao processar comando antitag_*' },{quoted :message});
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Check if message contains mentions
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || 
                        message.message?.conversation?.match(/@\d+/g) ||
                        [];

        // Check if it's a group message and has multiple mentions
        if (mentions.length > 0 && mentions.length >= 3) {
            // Get group participants to check if it's tagging most/all members
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];
            
            // If mentions are more than 50% of group members, consider it as tagall
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            
            if (mentions.length >= mentionThreshold) {
                
                const action = antitagSetting.action || 'delete';
                
                if (action === 'delete') {
                    // Delete the message
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    
                    // Send warning
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *Tagall Detectado!*.`
                    }, { quoted: message });
                    
                } else if (action === 'kick') {
                    // First delete the message
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });

                    // Then kick the user
                    await sock.groupParticipantsUpdate(chatId, [senderId], "remove");

                    // Send notification
                    const usernames = [`@${senderId.split('@')[0]}`];
                    await sock.sendMessage(chatId, {
                        text: `🚫 *Antitag Detectado!*\n\n${usernames.join(', ')} foi expulso por marcar todos os membros.`,
                        mentions: [senderId]
                    }, { quoted: message });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};

