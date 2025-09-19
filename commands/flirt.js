const fetch = require('node-fetch');

async function flirtCommand(sock, chatId, message) {
    try {
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const flirtMessage = json.result;

        // Send the flirt message
        await sock.sendMessage(chatId, { text: flirtMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in flirt command:', error);
        // Fallback flirt messages in Portuguese
        const flirtMessages = [
            "💖 Você tem Wi-Fi? Porque estou sentindo uma conexão! 📶",
            "🌟 Você deve ser um ladrão, porque roubou meu coração! 💘",
            "☀️ Você é o sol do meu dia e a lua das minhas noites! 🌙",
            "🎯 Se você fosse uma estrela, seria a mais brilhante! ⭐",
            "💝 Você tem um mapa? Porque me perdi nos seus olhos! 🗺️",
            "🌹 Você é como uma rosa: linda, mas pode me fazer suspirar! 😮‍💨",
            "⚡ Você tem superpoderes? Porque fez meu coração acelerar! 💓",
            "🍯 Você é mais doce que mel e mais rara que diamante! 💎",
            "🎵 Você é a música mais bonita que já ouvi! 🎶",
            "🌈 Você trouxe cores para o meu mundo cinzento! 🎨"
        ];
        const randomFlirt = flirtMessages[Math.floor(Math.random() * flirtMessages.length)];
        await sock.sendMessage(chatId, { text: randomFlirt }, { quoted: message });
    }
}

module.exports = { flirtCommand }; 