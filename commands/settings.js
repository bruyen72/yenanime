const fs = require('fs');

function readJsonSafe(path, fallback) {
    try {
        const txt = fs.readFileSync(path, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

async function settingsCommand(sock, chatId, message) {
    try {
        // Owner-only
        if (!message.key.fromMe) {
            await sock.sendMessage(chatId, { text: 'Apenas o dono do bot pode usar este comando!' }, { quoted: message });
            return;
        }

        const isGroup = chatId.endsWith('@g.us');
        const dataDir = './data';

        const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
        const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
        const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
        const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
        const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
        const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
            antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}
        });
        const autoReaction = Boolean(userGroupData.autoReaction);

        // Per-group features
        const groupId = isGroup ? chatId : null;
        const antilinkOn = groupId ? Boolean(userGroupData.antilink && userGroupData.antilink[groupId]) : false;
        const antibadwordOn = groupId ? Boolean(userGroupData.antibadword && userGroupData.antibadword[groupId]) : false;
        const welcomeOn = groupId ? Boolean(userGroupData.welcome && userGroupData.welcome[groupId]) : false;
        const goodbyeOn = groupId ? Boolean(userGroupData.goodbye && userGroupData.goodbye[groupId]) : false;
        const chatbotOn = groupId ? Boolean(userGroupData.chatbot && userGroupData.chatbot[groupId]) : false;
        const antitagCfg = groupId ? (userGroupData.antitag && userGroupData.antitag[groupId]) : null;

        const lines = [];
        lines.push('*CONFIGURAÇÕES DO BOT*');
        lines.push('');
        lines.push(`• Modo: ${mode.isPublic ? 'Público' : 'Privado'}`);
        lines.push(`• Status Automático: ${autoStatus.enabled ? 'ATIVO' : 'INATIVO'}`);
        lines.push(`• Leitura Automática: ${autoread.enabled ? 'ATIVO' : 'INATIVO'}`);
        lines.push(`• Digitação Automática: ${autotyping.enabled ? 'ATIVO' : 'INATIVO'}`);
        lines.push(`• Bloqueador PV: ${pmblocker.enabled ? 'ATIVO' : 'INATIVO'}`);
        lines.push(`• Reação Automática: ${autoReaction ? 'ATIVO' : 'INATIVO'}`);
        if (groupId) {
            lines.push('');
            lines.push(`Grupo: ${groupId}`);
            if (antilinkOn) {
                const al = userGroupData.antilink[groupId];
                lines.push(`• Antilink: ATIVO (ação: ${al.action || 'deletar'})`);
            } else {
                lines.push('• Antilink: INATIVO');
            }
            if (antibadwordOn) {
                const ab = userGroupData.antibadword[groupId];
                lines.push(`• Anti-palavrão: ATIVO (ação: ${ab.action || 'deletar'})`);
            } else {
                lines.push('• Anti-palavrão: INATIVO');
            }
            lines.push(`• Boas-vindas: ${welcomeOn ? 'ATIVO' : 'INATIVO'}`);
            lines.push(`• Despedida: ${goodbyeOn ? 'ATIVO' : 'INATIVO'}`);
            lines.push(`• Chatbot: ${chatbotOn ? 'ATIVO' : 'INATIVO'}`);
            if (antitagCfg && antitagCfg.enabled) {
                lines.push(`• Antitag: ATIVO (ação: ${antitagCfg.action || 'deletar'})`);
            } else {
                lines.push('• Antitag: INATIVO');
            }
        } else {
            lines.push('');
            lines.push('Nota: Configurações por grupo serão mostradas quando usado dentro de um grupo.');
        }

        await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: 'Falha ao ler configurações.' }, { quoted: message });
    }
}

module.exports = settingsCommand;


