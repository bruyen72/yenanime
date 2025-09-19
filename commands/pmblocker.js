const fs = require('fs');

const PMBLOCKER_PATH = './data/pmblocker.json';

function readState() {
    try {
        if (!fs.existsSync(PMBLOCKER_PATH)) return { enabled: false, message: '⚠️ Mensagens diretas estão bloqueadas!\nVocê não pode mandar DM para este bot. Entre em contato com o proprietário apenas em grupos.' };
        const raw = fs.readFileSync(PMBLOCKER_PATH, 'utf8');
        const data = JSON.parse(raw || '{}');
        return {
            enabled: !!data.enabled,
            message: typeof data.message === 'string' && data.message.trim() ? data.message : '⚠️ Mensagens diretas estão bloqueadas!\nVocê não pode mandar DM para este bot. Entre em contato com o proprietário apenas em grupos.'
        };
    } catch {
        return { enabled: false, message: '⚠️ Mensagens diretas estão bloqueadas!\nVocê não pode mandar DM para este bot. Entre em contato com o proprietário apenas em grupos.' };
    }
}

function writeState(enabled, message) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        fs.writeFileSync(PMBLOCKER_PATH, JSON.stringify(payload, null, 2));
    } catch {}
}

async function pmblockerCommand(sock, chatId, message, args) {
    const argStr = (args || '').trim();
    const [sub, ...rest] = argStr.split(' ');
    const state = readState();

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
        await sock.sendMessage(chatId, { text: '*BLOQUEADOR PV (Apenas proprietário)*\n\n.pmblocker on - Ativar bloqueio automático de PV\n.pmblocker off - Desativar bloqueador PV\n.pmblocker status - Mostrar status atual\n.pmblocker setmsg <texto> - Definir mensagem de aviso' }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'status') {
        await sock.sendMessage(chatId, { text: `Bloqueador PV está atualmente *${state.enabled ? 'ATIVO' : 'INATIVO'}*\nMensagem: ${state.message}` }, { quoted: message });
        return;
    }

    if (sub.toLowerCase() === 'setmsg') {
        const newMsg = rest.join(' ').trim();
        if (!newMsg) {
            await sock.sendMessage(chatId, { text: 'Uso: .pmblocker setmsg <mensagem>' }, { quoted: message });
            return;
        }
        writeState(state.enabled, newMsg);
        await sock.sendMessage(chatId, { text: 'Mensagem do Bloqueador PV atualizada.' }, { quoted: message });
        return;
    }

    const enable = sub.toLowerCase() === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `Bloqueador PV agora está *${enable ? 'ATIVADO' : 'DESATIVADO'}*.` }, { quoted: message });
}

module.exports = { pmblockerCommand, readState };


