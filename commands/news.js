const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';  // Replace with your NewsAPI key
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 5); // Get top 5 articles
        let newsMessage = '📰 *Últimas Notícias* 📰\n\n🌍 *Top 5 manchetes internacionais:*\n\n';
        articles.forEach((article, index) => {
            newsMessage += `📝 *${index + 1}.* ${article.title}\n💬 ${article.description || 'Sem descrição disponível'}\n\n`;
        });
        newsMessage += '✨ *Yen-Bot* - Mantendo você informado! 🌸';
        await sock.sendMessage(chatId, { text: newsMessage });
    } catch (error) {
        console.error('Error fetching news:', error);
        await sock.sendMessage(chatId, { text: '🌧️ *Erro ao buscar notícias!*\n\n🔄 *Possíveis causas:*\n• API de notícias indisponível\n• Problema de conexão\n• Limite de requisições atingido\n\n💡 *Tente novamente em alguns minutos*\n\n✨ *Yen-Bot* - Sempre tentando! 🌸' });
    }
};
