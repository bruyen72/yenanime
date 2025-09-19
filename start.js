#!/usr/bin/env node

const PORT = process.env.PORT || 10000;

// Startup script for Knight Bot with Web Interface
console.log('🚀 Iniciando Knight Bot com Interface Web...\n');

// Start web server first
const { setBotInstance, updateQR, server } = require('./server');

// Import and start the main bot
const startBot = require('./index');

console.log('✅ Knight Bot com Interface Web iniciado com sucesso!');
console.log(`🌐 Interface disponível em: http://localhost:${PORT}`);
console.log('📱 Use a interface para conectar seu WhatsApp\n');

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando Knight Bot...');
    if (server) {
        server.close(() => {
            console.log('🌐 Servidor web encerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando Knight Bot...');
    if (server) {
        server.close(() => {
            console.log('🌐 Servidor web encerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});