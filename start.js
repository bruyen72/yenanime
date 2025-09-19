/**
 * Knight Bot - Terminal Startup
 * Simple terminal-only startup without web interface
 */

const chalk = require('chalk');
require('./settings');

console.log(chalk.cyan('🤖 Iniciando Knight Bot (Terminal Only)...'));
console.log(chalk.yellow('📱 Bot WhatsApp - Modo Terminal'));
console.log(chalk.green('✅ Dependências do Playwright instaladas'));

// Start the bot
require('./index.js');

console.log(chalk.blue('🚀 Bot iniciado com sucesso!'));