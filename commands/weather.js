const axios = require('axios');

module.exports = async function (sock, chatId, message, city) {
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';  // Replace with your OpenWeather API Key
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const weather = response.data;
        const weatherText = `🌤️ *Clima em ${weather.name}* 🌤️\n\n🌡️ *Temperatura:* ${weather.main.temp}°C\n☁️ *Condição:* ${weather.weather[0].description}\n💨 *Sensação térmica:* ${weather.main.feels_like}°C\n💧 *Umidade:* ${weather.main.humidity}%\n\n✨ *Yen-Bot* - Previsão sempre atualizada! 🌸`;
        await sock.sendMessage(chatId, { text: weatherText }, { quoted: message }   );
    } catch (error) {
        console.error('Error fetching weather:', error);
        await sock.sendMessage(chatId, { text: '🌧️ *Não consegui buscar o clima!*\n\n🔄 Possíveis causas:\n• Cidade não encontrada\n• Erro de conexão\n• API temporariamente indisponível\n\n💡 *Dica:* Tente com o nome completo da cidade.\n\n✨ *Yen-Bot* - Meteorologia em dia! 🌸' }, { quoted: message });
    }
};
