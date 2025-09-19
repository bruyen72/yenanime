/**
 * Knight Bot - Terminal Only Version
 * WhatsApp Bot que roda apenas no terminal, sem interface web
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { rmSync, existsSync } = require('fs')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization
setInterval(() => {
    const memUsage = process.memoryUsage().rss / 1024 / 1024;
    if (global.gc) {
        global.gc();
        const memAfter = process.memoryUsage().rss / 1024 / 1024;
        console.log(`🧹 Garbage collection: ${memUsage.toFixed(2)}MB → ${memAfter.toFixed(2)}MB`);
    } else {
        console.log(`📊 Current memory usage: ${memUsage.toFixed(2)}MB`);
    }
}, 60_000)

// Memory monitoring
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...');
        if (global.gc) {
            console.log('🚨 Tentando limpeza de emergência...');
            global.gc();
            const afterCleanup = process.memoryUsage().rss / 1024 / 1024;
            if (afterCleanup < 350) {
                console.log(`✅ Limpeza bem-sucedida: ${used.toFixed(2)}MB → ${afterCleanup.toFixed(2)}MB`);
                return;
            }
        }
        process.exit(1);
    } else if (used > 300) {
        console.log(`⚠️ RAM moderadamente alta: ${used.toFixed(2)}MB - Forçando limpeza preventiva`);
        if (global.gc) global.gc();
    }
}, 30_000)

let phoneNumber = "911234567890"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "KNIGHT BOT"
global.themeemoji = "•"
const pairingCode = true
const useMobile = process.argv.includes("--mobile")

// Terminal readline interface
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startKnightBot() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const KnightBot = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        mobile: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 60000,
    })

    store.bind(KnightBot.ev)

    // Message handling
    KnightBot.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(KnightBot, chatUpdate);
                return;
            }
            if (!KnightBot.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            if (KnightBot?.msgRetryCounterCache) {
                KnightBot.msgRetryCounterCache.clear();
            }

            const messageSize = JSON.stringify(mek).length;
            if (messageSize > 10000) {
                console.log(`📦 Mensagem grande detectada: ${messageSize} bytes`);
                if (global.gc) {
                    setTimeout(() => global.gc(), 1000);
                }
            }

            try {
                await handleMessages(KnightBot, chatUpdate, true);
            } catch (err) {
                console.error("Error in handleMessages:", err);

                if (err.message && (err.message.includes('memory') || err.message.includes('ENOMEM'))) {
                    console.log('🚨 Erro de memória detectado, forçando limpeza...');
                    if (global.gc) {
                        global.gc();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                if (mek.key && mek.key.remoteJid) {
                    try {
                        await KnightBot.sendMessage(mek.key.remoteJid, {
                            text: '❌ Ocorreu um erro ao processar sua mensagem. Tente novamente em alguns segundos.'
                        });
                    } catch (sendErr) {
                        console.error('Erro ao enviar mensagem de erro:', sendErr.message);
                    }
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err);

            if (err.message && err.message.includes('FATAL')) {
                console.log('🚨 Erro fatal detectado, reiniciando em 5 segundos...');
                setTimeout(() => process.exit(1), 5000);
            }

            if (global.gc) {
                setTimeout(() => global.gc(), 2000);
            }
        }
    })

    // Bot functions
    KnightBot.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    KnightBot.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = KnightBot.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    KnightBot.public = true

    // Handle pairing code - Terminal Mode
    if (pairingCode && !KnightBot.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`📱 Digite seu número do WhatsApp (sem + ou espaços): `)))
        }

        // Clean the phone number
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        console.log(chalk.cyan(`[DEBUG] Número limpo: ${phoneNumber}`))

        const pn = require('awesome-phonenumber');
        const phoneValidation = pn('+' + phoneNumber);
        console.log(chalk.cyan(`[DEBUG] Validação: ${phoneValidation.isValid()}`))

        if (!phoneValidation.isValid()) {
            console.log(chalk.red('❌ Número inválido! Use formato: 5565984660212 (sem + ou espaços)'));
            process.exit(1);
        }

        global.pairingPhoneNumber = phoneNumber
        console.log(chalk.yellow('[DEBUG] Número armazenado para pairing code'))

        // Timeout para gerar código
        global.initialTimeout = setTimeout(async () => {
            if (global.pairingPhoneNumber && !KnightBot.authState.creds.registered) {
                console.log(chalk.yellow('[DEBUG] ⏰ Gerando pairing code...'))
                try {
                    let code = await KnightBot.requestPairingCode(global.pairingPhoneNumber)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.black(chalk.bgGreen(`\n✅ SEU CÓDIGO DE EMPARELHAMENTO: `)), chalk.black(chalk.bgWhite(` ${code} `)))
                    console.log(chalk.yellow(`\n📱 CONECTE SEU CELULAR AGORA:`))
                    console.log(chalk.cyan(`1. Abra o WhatsApp no seu celular`))
                    console.log(chalk.cyan(`2. Vá em Configurações (⚙️) → Aparelhos conectados`))
                    console.log(chalk.cyan(`3. Toque em "Conectar um aparelho"`))
                    console.log(chalk.cyan(`4. Digite o código: ${code}`))
                    console.log(chalk.green(`\n⏳ Aguardando conexão do celular...\n`))
                    global.pairingPhoneNumber = null
                } catch (error) {
                    console.error('[DEBUG] Erro ao gerar código:', error.message)
                    console.log(chalk.red('❌ Falha ao obter código. Reinicie o bot.'))
                }
            }
        }, 8000)
    }

    // Connection handling
    KnightBot.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s
        console.log(chalk.magenta(`[DEBUG] *** CONNECTION UPDATE *** : ${connection}`))

        if (connection === 'connecting' && pairingCode && global.pairingPhoneNumber && !KnightBot.authState.creds.registered) {
            console.log(chalk.yellow('[DEBUG] Estado connecting detectado, solicitando pairing code...'))

            if (global.pairingTimeout) {
                clearTimeout(global.pairingTimeout)
            }

            global.pairingTimeout = setTimeout(async () => {
                try {
                    console.log(chalk.green('[DEBUG] Solicitando código de emparelhamento...'))
                    let code = await KnightBot.requestPairingCode(global.pairingPhoneNumber)
                    console.log(chalk.cyan(`[DEBUG] Código recebido: ${code}`))

                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.black(chalk.bgGreen(`\n✅ SEU CÓDIGO DE EMPARELHAMENTO: `)), chalk.black(chalk.bgWhite(` ${code} `)))
                    console.log(chalk.yellow(`\n📱 CONECTE SEU CELULAR AGORA:`))
                    console.log(chalk.cyan(`1. Abra o WhatsApp no seu celular`))
                    console.log(chalk.cyan(`2. Vá em Configurações (⚙️) → Aparelhos conectados`))
                    console.log(chalk.cyan(`3. Toque em "Conectar um aparelho"`))
                    console.log(chalk.cyan(`4. Digite o código: ${code}`))
                    console.log(chalk.green(`\n⏳ Aguardando conexão do celular...\n`))

                    global.pairingPhoneNumber = null
                } catch (error) {
                    console.error('[DEBUG] Erro ao solicitar código:', error)
                    console.log(chalk.red('❌ Falha ao obter código. Reinicie o bot e tente novamente.'))
                }
            }, 2000)
        }

        if (connection == "open") {
            if (global.initialTimeout) {
                clearTimeout(global.initialTimeout);
                global.initialTimeout = null;
            }
            if (global.pairingTimeout) {
                clearTimeout(global.pairingTimeout);
                global.pairingTimeout = null;
            }

            console.log(chalk.green(`🎉 CONEXÃO ESTABELECIDA COM SUCESSO! 🎉`))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(KnightBot.user, null, 2)))

            const botNumber = KnightBot.user.id.split(':')[0] + '@s.whatsapp.net';
            await KnightBot.sendMessage(botNumber, {
                text: `🤖 Bot Connected Successfully! ✅\n\nBot Version: 2.1.8\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n\n🎯 Ship command otimizado e funcionando!`
            });

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'KNIGHT BOT'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: MR UNIQUE HACKER`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: 910000000000,917023951514`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: MR UNIQUE HACKER`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.blue(`Bot Version: ${settings.version}`))
            console.log(chalk.cyan(`< ================================================== >`))
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('Session logged out. Please re-authenticate.'))
                startKnightBot()
            } else {
                startKnightBot()
            }
        }
    })

    KnightBot.ev.on('creds.update', saveCreds)

    KnightBot.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(KnightBot, update);
    });

    KnightBot.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(KnightBot, m);
        }
    });

    KnightBot.ev.on('status.update', async (status) => {
        await handleStatus(KnightBot, status);
    });

    KnightBot.ev.on('messages.reaction', async (status) => {
        await handleStatus(KnightBot, status);
    });

    return KnightBot
}

// Start the bot
console.log(chalk.blue('🚀 Iniciando Knight Bot - Modo Terminal'));
console.log(chalk.green('📟 Bot funcionará apenas no terminal'));
console.log(chalk.yellow('⚠️  Sem interface web - Apenas linha de comando'));
console.log(chalk.cyan('════════════════════════════════════════════════════\n'));

startKnightBot().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})

// Error handlers
process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);
    if (global.gc) {
        try {
            global.gc();
            console.log('🧹 Limpeza de emergência executada');
        } catch (gcErr) {
            console.error('Erro na limpeza de emergência:', gcErr.message);
        }
    }
    setTimeout(() => {
        console.log('🔄 Reiniciando devido a erro crítico...');
        process.exit(1);
    }, 3000);
})

process.on('unhandledRejection', (err) => {
    console.error('⚠️ Unhandled Rejection:', err);
    if (global.gc) {
        setTimeout(() => {
            try {
                global.gc();
                console.log('🧹 Limpeza após rejeição executada');
            } catch (gcErr) {
                console.error('Erro na limpeza após rejeição:', gcErr.message);
            }
        }, 1000);
    }
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})