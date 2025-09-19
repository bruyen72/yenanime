const settings = require('../settings');

async function ownerCommand(sock, chatId, message) {
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner}
TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}
END:VCARD
`;

    await sock.sendMessage(chatId, {
        text: "✨ *Informações do Criador*\n\n👨‍💻 *Desenvolvedor:* Yen\n📱 *Contato:* Vou enviar o contato abaixo\n🌸 *Bot:* Yen-Bot v2.1.8\n\n💫 *Obrigado por usar o Yen-Bot!* 🌟"
    }, { quoted: message });

    await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
    }, { quoted: message });
}

module.exports = ownerCommand;
