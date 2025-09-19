#!/usr/bin/env node

// Render-optimized bot starter
console.log('🌐 Iniciando Knight Bot para Render...\n');

// Check if we're on Render
const isRender = process.env.RENDER || process.env.NODE_ENV === 'production';

if (isRender) {
    console.log('🔧 Configuração Render detectada');
    console.log('🎯 Modo produção ativado');

    // Set environment variables for Render
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';
    process.env.RENDER = 'true';
}

// Start web server
const { setBotInstance, updateQR, server } = require('./render-server');

// Only start full bot if not on free tier (to avoid memory issues)
if (!isRender) {
    console.log('💻 Ambiente local detectado - iniciando bot completo');
    try {
        require('./index');
    } catch (error) {
        console.error('❌ Erro ao iniciar bot completo:', error.message);
        console.log('📱 Continuando apenas com interface web...');
    }
} else {
    console.log('🌐 Ambiente Render - rodando apenas interface web');
    console.log('📱 Para conectar WhatsApp, use a interface web');
}

console.log('\n✅ Knight Bot iniciado com sucesso!');
console.log(`🌐 Interface disponível na porta ${process.env.PORT || 10000}`);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando Knight Bot...');
    if (server) {
        server.close(() => {
            console.log('🌐 Servidor encerrado');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});