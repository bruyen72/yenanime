async function resetlinkCommand(sock, chatId, senderId) {
    try {
        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const isAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(senderId);

        // Check if bot is admin
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
            .includes(botId);

        if (!isAdmin) {
            await sock.sendMessage(chatId, { text: '❌ *Apenas administradores podem usar este comando!*\n\n🛡️ *Acesso negado*\n⚠️ Solicite permissão a um admin\n\n✨ *Yen-Bot* - Segurança em primeiro lugar! 🌸' });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '❌ *Bot precisa ser admin!*\n\n🤖 *Para resetar o link do grupo:*\n• Me promova a administrador\n• Dê permissões necessárias\n\n💡 *Depois tente novamente*\n\n✨ *Yen-Bot* - Gerenciamento inteligente! 🌸' });
            return;
        }

        // Reset the group link
        const newCode = await sock.groupRevokeInvite(chatId);
        
        // Send the new link
        await sock.sendMessage(chatId, { 
            text: `✅ *Link do grupo resetado com sucesso!*\n\n📌 *Novo link:*\nhttps://chat.whatsapp.com/${newCode}\n\n🎆 *Link antigo foi invalidado*\n✨ *Yen-Bot* - Segurança renovada! 🌸`
        });

    } catch (error) {
        console.error('Error in resetlink command:', error);
        await sock.sendMessage(chatId, { text: '❌ *Falha ao resetar link!*\n\n🔄 *Possíveis causas:*\n• Bot não é administrador\n• Erro de permissão\n• Problema de conexão\n\n💡 *Verifique as configurações e tente novamente*\n\n✨ *Yen-Bot* - Sempre tentando! 🌸' });
    }
}

module.exports = resetlinkCommand; 