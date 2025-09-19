const { chromium } = require('playwright');
// Configuração para Vercel
let chromiumPackage;
let playwrightCore;
try {
    chromiumPackage = require('@sparticuz/chromium');
    playwrightCore = require('playwright-core');
} catch (error) {
    console.log('Usando Playwright padrão (desenvolvimento)');
}
const axios = require('axios');
const https = require('https');

// Cache de imagens para não buscar toda vez - otimizado
let cachedImages = [];
let lastFetch = 0;
const CACHE_DURATION = 1800000; // 30 minutos em milissegundos (reduzido para economizar memória)

// Credenciais do Pinterest (Use variáveis de ambiente!)
const PINTEREST_EMAIL = process.env.PINTEREST_EMAIL || 'brunoruthes92@gmail.com';
const PINTEREST_PASSWORD = process.env.PINTEREST_PASSWORD || 'BRPO@hulk1';

// Imagens de fallback mais confiáveis
const FALLBACK_IMAGES = [
    'https://wallpapers.com/images/hd/anime-couple-4k-1920-x-1080-wallpaper-s9kz8x2c0yyro8k1.jpg',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&crop=faces',
    'https://picsum.photos/800/600?random=1',
    'https://picsum.photos/800/600?random=2',
    'https://picsum.photos/800/600?random=3'
];

// Função melhorada para buscar imagens sem login
async function fetchAnimeShipImages() {
    let browser, context, page;
    try {
        // Verificar cache
        if (cachedImages.length > 0 && (Date.now() - lastFetch) < CACHE_DURATION) {
            console.log('📥 Usando cache de imagens...');
            return cachedImages;
        }

        console.log('🔍 Buscando imagens de anime ships...');

        // Verificar se estamos em ambiente de produção
        const isProduction = process.env.VERCEL || process.env.RENDER || process.env.NODE_ENV === 'production';

        // Configurar browser baseado no ambiente
        if (isProduction && chromiumPackage && playwrightCore) {
            console.log('🌐 Ambiente de produção detectado, usando @sparticuz/chromium...');

            browser = await playwrightCore.chromium.launch({
                args: chromiumPackage.args,
                executablePath: await chromiumPackage.executablePath(),
                headless: true
            });
        } else if (isProduction) {
            console.log('🌐 Ambiente de produção sem @sparticuz/chromium, usando fallback...');
            return FALLBACK_IMAGES;
        } else {
            console.log('💻 Ambiente de desenvolvimento, usando Chromium local...');
            browser = await chromium.launch({
                headless: true,
                executablePath: '/usr/bin/chromium',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--memory-pressure-off',
                    '--max_old_space_size=128',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',
                    '--disable-javascript',
                    '--disable-default-apps'
                ]
            });
        }
        
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            extraHTTPHeaders: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            viewport: { width: 1366, height: 768 }
        });
        
        page = await context.newPage();

        // Tentar múltiplas fontes de imagens
        const searchSources = [
            // Pinterest sem login (público)
            'https://www.pinterest.com/search/pins/?q=anime%20couple%20art',
            // Outras fontes alternativas
            'https://www.deviantart.com/search?q=anime+couple',
            'https://wallhaven.cc/search?q=anime+couple&categories=010&purity=100&sorting=relevance'
        ];

        let imageLinks = [];

        // Tentar Pinterest primeiro (sem login)
        try {
            console.log('🎯 Tentando Pinterest público...');
            await page.goto(searchSources[0], { 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });

            // Aguardar carregar
            await page.waitForTimeout(3000);

            // Scroll para carregar mais imagens (reduzido para economizar memória)
            for (let i = 0; i < 2; i++) {
                await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                await page.waitForTimeout(1000);
            }

            // Extrair links das imagens do Pinterest
            imageLinks = await page.evaluate(() => {
                const images = document.querySelectorAll('img[src*="pinimg.com"]');
                const links = [];
                
                images.forEach(img => {
                    let src = img.src;
                    if (src && src.includes('pinimg.com') && !src.includes('avatar') && !src.includes('profile')) {
                        // Tentar obter a versão original
                        src = src.replace(/\/\d+x\d*\//, '/originals/');
                        src = src.replace(/_\d+x\d*\./, '.');
                        if (!links.includes(src) && links.length < 15) {
                            links.push(src);
                        }
                    }
                });
                
                return links;
            });

            if (imageLinks.length > 5) {
                console.log(`✅ Pinterest: ${imageLinks.length} imagens encontradas`);
            } else {
                throw new Error('Poucas imagens no Pinterest');
            }

        } catch (pinterestError) {
            console.warn('⚠️ Pinterest falhou, usando fontes alternativas...');
            
            // Usar APIs de imagens gratuitas como fallback
            const unsplashQueries = [
                'anime couple',
                'manga couple',
                'cartoon couple',
                'illustrated couple',
                'romantic illustration'
            ];

            for (const query of unsplashQueries) {
                try {
                    const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
                    imageLinks.push(unsplashUrl);
                } catch (e) {
                    console.warn('Unsplash query failed:', e.message);
                }
            }

            // Adicionar mais fontes de fallback
            imageLinks.push(...FALLBACK_IMAGES);
        }

        if (imageLinks.length > 0) {
            // Filtrar e validar URLs
            const validImages = imageLinks.filter(url => {
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            });

            cachedImages = validImages.slice(0, 10); // Limitar a 10 imagens (reduzido para economizar memória)
            lastFetch = Date.now();
            console.log(`✅ Total: ${cachedImages.length} imagens válidas coletadas!`);
            return cachedImages;
        } else {
            throw new Error('Nenhuma imagem válida encontrada');
        }

    } catch (error) {
        console.error('❌ Erro ao buscar imagens:', error.message);
        console.log('🔄 Usando imagens de fallback...');
        return FALLBACK_IMAGES;
    } finally {
        // Forçar limpeza de memória
        try {
            if (page) {
                await page.evaluate(() => {
                    // Limpar cache do navegador
                    if (window.caches) {
                        caches.keys().then(names => {
                            names.forEach(name => caches.delete(name));
                        });
                    }
                });
                await page.close();
            }
            if (context) await context.close();
            if (browser) await browser.close();
        } catch (e) {
            console.warn('⚠️ Erro ao fechar browser:', e.message);
        }

        // Forçar garbage collection se disponível
        if (global.gc) {
            global.gc();
        }
    }
}

// Função melhorada para download de imagem
async function downloadImage(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`📥 Tentativa ${attempt}: Baixando imagem...`);
            
            // Primeiro, tentar com axios
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive'
                },
                timeout: 10000,
                maxRedirects: 5,
                httpsAgent: new https.Agent({  
                    rejectUnauthorized: false
                })
            });

            if (response.data && response.data.byteLength > 1000) {
                console.log('✅ Imagem baixada com sucesso via Axios!');
                return Buffer.from(response.data);
            }
            
        } catch (axiosError) {
            console.warn(`⚠️ Axios falhou (tentativa ${attempt}):`, axiosError.message);
            
            // Fallback: usar Playwright para download
            try {
                const isProduction = process.env.VERCEL || process.env.RENDER || process.env.NODE_ENV === 'production';
                let downloadBrowser;

                if (isProduction && chromiumPackage && playwrightCore) {
                    downloadBrowser = await playwrightCore.chromium.launch({
                        args: chromiumPackage.args,
                        executablePath: await chromiumPackage.executablePath(),
                        headless: true
                    });
                } else {
                    downloadBrowser = await chromium.launch({
                        headless: true,
                        executablePath: '/usr/bin/chromium',
                        args: [
                            '--no-sandbox',
                            '--disable-setuid-sandbox',
                            '--disable-dev-shm-usage',
                            '--disable-gpu',
                            '--single-process'
                        ]
                    });
                }
                const browser = downloadBrowser;
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                });
                const page = await context.newPage();

                const imageResponse = await page.goto(url, {
                    waitUntil: 'networkidle',
                    timeout: 8000
                });

                if (imageResponse && imageResponse.ok()) {
                    const buffer = await imageResponse.body();
                    await page.close();
                    await context.close();
                    await browser.close();

                    if (buffer && buffer.length > 1000) {
                        console.log('✅ Imagem baixada com sucesso via Playwright!');
                        return buffer;
                    }
                }

                await page.close();
                await context.close();
                await browser.close();

                // Forçar limpeza de memória
                if (global.gc) {
                    global.gc();
                }

            } catch (playwrightError) {
                console.warn(`⚠️ Playwright também falhou (tentativa ${attempt}):`, playwrightError.message);
            }
        }
        
        // Aguardar antes da próxima tentativa
        if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    
    throw new Error('Todas as tentativas de download falharam');
}

async function shipCommand(sock, chatId, message, args) {
    // Verificar memória antes de executar
    const memBefore = process.memoryUsage().rss / 1024 / 1024;
    if (memBefore > 350) {
        console.log('🚨 Memória alta antes do ship, forçando limpeza...');
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Timeout de segurança para evitar travamentos
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Ship command timeout')), 45000); // 45 segundos
    });

    try {
        return await Promise.race([
            shipCommandInternal(sock, chatId, message, args),
            timeoutPromise
        ]);
    } catch (error) {
        if (error.message === 'Ship command timeout') {
            console.error('⏰ Ship command timeout - enviando mensagem de erro');
            await sock.sendMessage(chatId, {
                text: '⏰ *Ship Timeout*\n\nO comando demorou muito para responder. Tente novamente em alguns minutos.\n\n💡 *Dica:* Use `.ship @user1 @user2` para ship direto!'
            }).catch(console.error);
        } else {
            throw error;
        }
    }
}

async function shipCommandInternal(sock, chatId, message, args) {
    try {
        let user1, user2;
        
        // Verificar menções
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const validMentions = mentions.filter(jid => jid && jid.endsWith('@s.whatsapp.net'));

        if (validMentions.length >= 2) {
            user1 = validMentions[0];
            user2 = validMentions[1];
        } else if (validMentions.length === 1) {
            user1 = message.key.participant || message.key.remoteJid;
            user2 = validMentions[0];
            if (user1 === user2) {
                return await sock.sendMessage(chatId, { 
                    text: '💔 *Oops!* Não pode shippar consigo mesmo! 😅\n\n💡 Marque outra pessoa ou deixe o bot escolher alguém do grupo!' 
                });
            }
        } else {
            // Ship aleatório no grupo
            try {
                const groupData = await sock.groupMetadata(chatId);
                const participants = groupData.participants
                    .map(p => p.id)
                    .filter(id => id.endsWith('@s.whatsapp.net'));
                
                if (participants.length < 2) {
                    return await sock.sendMessage(chatId, { 
                        text: '💔 *Grupo muito pequeno!*\n\nPreciso de pelo menos 2 pessoas para fazer um ship! 👥' 
                    });
                }
                
                user1 = participants[Math.floor(Math.random() * participants.length)];
                do {
                    user2 = participants[Math.floor(Math.random() * participants.length)];
                } while (user2 === user1);
                
            } catch (groupError) {
                return await sock.sendMessage(chatId, { 
                    text: '❌ *Erro:* Não foi possível acessar os dados do grupo!\n\nTente marcar duas pessoas: `.ship @user1 @user2`' 
                });
            }
        }

        // Buscar imagens
        console.log('🎨 Buscando imagem de anime ship...');
        const animeShipImages = await fetchAnimeShipImages();
        
        // Calcular compatibilidade
        const compatibility = Math.floor(Math.random() * 101);
        
        let status, emoji, description;
        if (compatibility >= 90) {
            status = 'ALMA GÊMEA! 💖✨';
            emoji = '🔥💕';
            description = 'Vocês nasceram um para o outro!';
        } else if (compatibility >= 70) {
            status = 'MUITO COMPATÍVEIS! 😍';
            emoji = '💕✨';
            description = 'Que química incrível!';
        } else if (compatibility >= 50) {
            status = 'BOA COMBINAÇÃO! 😌';
            emoji = '💛🌸';
            description = 'Podem dar muito certo juntos!';
        } else if (compatibility >= 30) {
            status = 'VALE TENTAR... 🤔';
            emoji = '😅💙';
            description = 'Quem sabe com um pouco de esforço...';
        } else {
            status = 'MELHOR COMO AMIGOS! 😬';
            emoji = '💔🤷‍♀️';
            description = 'A amizade é mais forte que o amor!';
        }

        // Selecionar imagem aleatória
        const randomImgUrl = animeShipImages[Math.floor(Math.random() * animeShipImages.length)];
        
        // Baixar imagem
        let imageBuffer;
        try {
            imageBuffer = await downloadImage(randomImgUrl);
        } catch (downloadError) {
            console.error('❌ Erro no download da imagem:', downloadError.message);
            
            // Enviar apenas texto se falhar o download da imagem
            const shipTextOnly = `💘 *ANIME SHIP* 💘

${emoji} @${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}

📊 *${compatibility}%* - ${status}
💭 ${description}

🎨 *Imagem indisponível no momento* 📷❌`;

            return await sock.sendMessage(chatId, {
                text: shipTextOnly,
                mentions: [user1, user2]
            });
        }

        // Texto do ship
        const shipText = `💘 *ANIME SHIP* 💘

${emoji} @${user1.split('@')[0]} ❤️ @${user2.split('@')[0]}

📊 *${compatibility}%* - ${status}
💭 ${description}

✨ *Powered by Anime Magic!* 🎯`;

        // Enviar com imagem
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: shipText,
            mentions: [user1, user2]
        });

        console.log('✅ Ship enviado com sucesso!');

        // Verificar memória após execução
        const memAfter = process.memoryUsage().rss / 1024 / 1024;
        console.log(`📊 Memória após ship: ${memAfter.toFixed(2)}MB`);

        // Forçar limpeza se necessário
        if (memAfter > 300 && global.gc) {
            global.gc();
            console.log('🧹 Limpeza de memória forçada após ship');
        }

    } catch (error) {
        console.error('❌ Erro geral no comando ship:', error.message);
        
        await sock.sendMessage(chatId, {
            text: `❌ *Erro no Ship System*

💔 Algo deu errado, mas não desista do amor!

💡 *Como usar:*
• \`.ship\` - Ship aleatório no grupo
• \`.ship @user\` - Ship entre você e o usuário  
• \`.ship @user1 @user2\` - Ship específico

🔧 *Se o erro persistir, tente novamente em alguns minutos.*`
        });
    }
}

module.exports = shipCommand;