/**
 * Knight Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    const memUsage = process.memoryUsage().rss / 1024 / 1024;
    if (global.gc) {
        global.gc();
        const memAfter = process.memoryUsage().rss / 1024 / 1024;
        console.log(`🧹 Garbage collection: ${memUsage.toFixed(2)}MB → ${memAfter.toFixed(2)}MB`);
    } else {
        console.log(`📊 Current memory usage: ${memUsage.toFixed(2)}MB`);
    }
}, 60_000) // every 1 minute

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;

    if (used > 400) {
        console.log('⚠️ RAM too high (>400MB), restarting bot...');
        // Tentar limpeza de emergência antes de reiniciar
        if (global.gc) {
            console.log('🚨 Tentando limpeza de emergência...');
            global.gc();
            const afterCleanup = process.memoryUsage().rss / 1024 / 1024;
            if (afterCleanup < 350) {
                console.log(`✅ Limpeza bem-sucedida: ${used.toFixed(2)}MB → ${afterCleanup.toFixed(2)}MB`);
                return; // Evitar reinicialização se a limpeza funcionou
            }
        }
        process.exit(1); // Panel will auto-restart
    } else if (used > 300) {
        console.log(`⚠️ RAM moderadamente alta: ${used.toFixed(2)}MB - Forçando limpeza preventiva`);
        if (global.gc) global.gc();
    }
}, 30_000) // check every 30 seconds

let phoneNumber = "" // Remove número fixo
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "KNIGHT BOT"
global.themeemoji = "•"
const pairingCode = true // Sempre usar pairing code
const useMobile = false // Nunca usar modo mobile

// Always create readline interface for interactive input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => {
    return new Promise((resolve) => rl.question(text, resolve))
}


async function startXeonBotInc() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Forçar desabilitação do QR code
        mobile: false, // Garantir que não use modo mobile
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false, // Reduzir para evitar problemas de conexão
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 60000, // 60 segundos timeout
    })

    store.bind(XeonBotInc.ev)

    // Bot iniciado em modo terminal

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear();
            }

            // Limpeza adicional de memória para mensagens pesadas
            const messageSize = JSON.stringify(mek).length;
            if (messageSize > 10000) { // Mensagens grandes (>10KB)
                console.log(`📦 Mensagem grande detectada: ${messageSize} bytes`);
                if (global.gc) {
                    setTimeout(() => global.gc(), 1000);
                }
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true);
            } catch (err) {
                console.error("Error in handleMessages:", err);

                // Verificar se o erro é relacionado à memória
                if (err.message && (err.message.includes('memory') || err.message.includes('ENOMEM'))) {
                    console.log('🚨 Erro de memória detectado, forçando limpeza...');
                    if (global.gc) {
                        global.gc();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    try {
                        await XeonBotInc.sendMessage(mek.key.remoteJid, {
                            text: '❌ Ocorreu um erro ao processar sua mensagem. Tente novamente em alguns segundos.'
                        });
                    } catch (sendErr) {
                        console.error('Erro ao enviar mensagem de erro:', sendErr.message);
                    }
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err);

            // Tratamento especial para erros críticos
            if (err.message && err.message.includes('FATAL')) {
                console.log('🚨 Erro fatal detectado, reiniciando em 5 segundos...');
                setTimeout(() => process.exit(1), 5000);
            }

            // Forçar limpeza em caso de erro
            if (global.gc) {
                setTimeout(() => global.gc(), 2000);
            }
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        // Always ask for phone number in terminal
        console.log(chalk.cyan('\n📱 ================================='))
        console.log(chalk.cyan('🤖 KNIGHT BOT - PAIRING CODE'))
        console.log(chalk.cyan('📱 ================================='))
        let phoneNumber = await question(chalk.green('Digite seu número do WhatsApp (sem + e sem espaços)\nExemplo: 5511999998888\nSeu número: '))

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
        console.log(chalk.cyan(`[DEBUG] Número limpo: ${phoneNumber}`))

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        const phoneValidation = pn('+' + phoneNumber);
        console.log(chalk.cyan(`[DEBUG] Validação do número: ${phoneValidation.isValid()}`))
        console.log(chalk.cyan(`[DEBUG] Número formatado: ${phoneValidation.getNumber('international')}`))
        console.log(chalk.cyan(`[DEBUG] País: ${phoneValidation.getRegionCode()}`))

        if (!phoneValidation.isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        // Armazenar número para uso posterior
        global.pairingPhoneNumber = phoneNumber
        console.log(chalk.yellow('[DEBUG] Número armazenado para pairing code'))
        console.log(chalk.cyan(`[DEBUG] Socket criado, aguardando eventos...`))
        console.log(chalk.cyan(`[DEBUG] Auth state: ${JSON.stringify({registered: XeonBotInc.authState?.creds?.registered, me: !!XeonBotInc.authState?.creds?.me})}`))

        // Debug dos eventos do WebSocket
        if (XeonBotInc.ws) {
            console.log(chalk.cyan(`[DEBUG] WebSocket configurado`))
            XeonBotInc.ws.on('open', () => console.log(chalk.green('[DEBUG] WebSocket OPEN event')))
            XeonBotInc.ws.on('close', () => console.log(chalk.red('[DEBUG] WebSocket CLOSE event')))
            XeonBotInc.ws.on('error', (err) => console.log(chalk.red('[DEBUG] WebSocket ERROR:', err.message)))
        }

        // Timeout de segurança melhorado
        global.initialTimeout = setTimeout(async () => {
            if (global.pairingPhoneNumber && !XeonBotInc.authState.creds.registered) {
                console.log(chalk.yellow('[DEBUG] ⏰ Timeout inicial - tentando forçar pairing code...'))
                try {
                    let code = await XeonBotInc.requestPairingCode(global.pairingPhoneNumber)
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
                    console.error('[DEBUG] Erro no timeout inicial:', error.message)
                    console.log(chalk.red('❌ Falha ao obter código. Reinicie o bot.'))
                }
            }
        }, 8000) // Reduzido para 8 segundos
    }

    // Debug: verificar se o event listener está sendo registrado
    console.log(chalk.blue('[DEBUG] Registrando event listener para connection.update'))

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        console.log(chalk.magenta(`[DEBUG] *** CONNECTION UPDATE EVENT *** : ${connection}`))
        
        // Only log connection and lastDisconnect, ignore QR
        const logData = { connection, lastDisconnect: lastDisconnect ? 'present' : 'none' }
        console.log(chalk.magenta(`[DEBUG] Event data:`, JSON.stringify(logData, null, 2)))

        // QR code functionality completely disabled - only pairing codes allowed

        // Solicitar pairing code apenas uma vez quando conectando
        if (connection === 'connecting' && pairingCode && global.pairingPhoneNumber && !XeonBotInc.authState.creds.registered) {
            console.log(chalk.yellow('[DEBUG] Estado connecting detectado, solicitando pairing code...'))

            // Limpar timeout anterior se existir
            if (global.pairingTimeout) {
                clearTimeout(global.pairingTimeout)
            }

            global.pairingTimeout = setTimeout(async () => {
                try {
                    console.log(chalk.green('[DEBUG] Solicitando código de emparelhamento...'))
                    let code = await XeonBotInc.requestPairingCode(global.pairingPhoneNumber)
                    console.log(chalk.cyan(`[DEBUG] Código recebido: ${code}`))

                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.black(chalk.bgGreen(`\n✅ SEU CÓDIGO DE EMPARELHAMENTO: `)), chalk.black(chalk.bgWhite(` ${code} `)))
                    console.log(chalk.yellow(`\n📱 CONECTE SEU CELULAR AGORA:`))
                    console.log(chalk.cyan(`1. Abra o WhatsApp no seu celular`))
                    console.log(chalk.cyan(`2. Vá em Configurações (⚙️) → Aparelhos conectados`))
                    console.log(chalk.cyan(`3. Toque em "Conectar um aparelho"`))
                    console.log(chalk.cyan(`4. Digite o código: ${code}`))
                    console.log(chalk.green(`\n⏳ Aguardando conexão do celular...\n`))

                    global.pairingPhoneNumber = null // Limpar após uso
                } catch (error) {
                    console.error('[DEBUG] Erro ao solicitar código:', error)
                    console.log(chalk.red('❌ Falha ao obter código. Reinicie o bot e tente novamente.'))
                }
            }, 2000) // Delay reduzido
        }

        if (connection == "open") {
            // Limpar todos os timeouts de pairing quando conectar
            if (global.initialTimeout) {
                clearTimeout(global.initialTimeout);
                global.initialTimeout = null;
            }
            if (global.pairingTimeout) {
                clearTimeout(global.pairingTimeout);
                global.pairingTimeout = null;
            }

            console.log(chalk.magenta(` `))
            console.log(chalk.green(`🎉 CONEXÃO ESTABELECIDA COM SUCESSO! 🎉`))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
            await XeonBotInc.sendMessage(botNumber, {
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
                startXeonBotInc()
            } else {
                startXeonBotInc()
            }
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('creds.update', saveCreds)

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
}


// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);

    // Tentar limpeza de emergência
    if (global.gc) {
        try {
            global.gc();
            console.log('🧹 Limpeza de emergência executada');
        } catch (gcErr) {
            console.error('Erro na limpeza de emergência:', gcErr.message);
        }
    }

    // Dar tempo para limpeza antes de sair
    setTimeout(() => {
        console.log('🔄 Reiniciando devido a erro crítico...');
        process.exit(1);
    }, 3000);
})

process.on('unhandledRejection', (err) => {
    console.error('⚠️ Unhandled Rejection:', err);

    // Não sair imediatamente para rejeições, apenas logar e limpar
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