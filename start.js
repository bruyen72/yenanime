/**
 * Knight Bot - Terminal Startup
 * Simple terminal-only startup without web interface
 */

require('./settings');

console.log('🤖 Iniciando Knight Bot (Terminal Only)...');
console.log('📱 Bot WhatsApp - Modo Terminal');
console.log('✅ Dependências do Playwright instaladas');

// Start the bot
require('./index.js');

console.log('🚀 Bot iniciado com sucesso!');