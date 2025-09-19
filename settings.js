require('dotenv').config();

// Global Settings for Knight Bot
module.exports = {
    // Bot Information
    packname: process.env.PACKNAME || 'KNIGHT BOT',
    author: process.env.AUTHOR || 'Professor',
    botname: process.env.BOTNAME || 'Knight Bot',
    ownername: process.env.OWNERNAME || 'Professor',
    
    // Owner Configuration
    ownerNumber: process.env.OWNER_NUMBER || '911234567890',
    
    // Bot Mode
    public: process.env.BOT_MODE === 'private' ? false : true,
    
    // Session Configuration
    sessionName: process.env.SESSION_NAME || 'session',
    
    // Web Configuration
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    
    // Bot Version and Info
    version: '2.1.8',
    description: 'WhatsApp Bot built with Baileys',
    
    // Memory Management
    storeWriteInterval: 10000, // 10 seconds
    memoryLimit: 400, // MB
    
    // Rate Limiting
    rateLimitWindow: 60000, // 1 minute
    rateLimitMax: 20, // max requests per window
    
    // Command Configuration
    prefix: ['.', '!', '#', '$'],
    commandTimeout: 30000, // 30 seconds
    
    // WhatsApp Configuration
    autoRead: process.env.AUTO_READ === 'true',
    autoTyping: process.env.AUTO_TYPING === 'true',
    autoReaction: process.env.AUTO_REACTION === 'true',
    autoStatus: process.env.AUTO_STATUS === 'true',
    
    // Group Features
    antiCall: process.env.ANTI_CALL === 'true',
    antiLink: process.env.ANTI_LINK === 'true',
    antiBadword: process.env.ANTI_BADWORD === 'true',
    
    // Media Configuration
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMediaTypes: ['image', 'video', 'audio', 'document'],
    
    // API Configuration
    useExternalApis: process.env.USE_EXTERNAL_APIS !== 'false',
    
    // Development
    debug: process.env.NODE_ENV === 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    
    // Replit Configuration
    isReplit: process.env.REPLIT === 'true' || process.env.REPL_ID !== undefined,
    replitDomain: process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : null,
    
    // Security
    allowedOrigins: ['localhost', '127.0.0.1', '0.0.0.0'],
    
    // Database (for future use)
    database: {
        enabled: false,
        type: 'json', // json, sqlite, postgres
        path: './data'
    }
};

// Apply environment overrides
if (process.env.REPLIT === 'true' || process.env.REPL_ID) {
    module.exports.isReplit = true;
    module.exports.host = '0.0.0.0';
    module.exports.port = process.env.PORT || 5000;
}

// Set global variables for compatibility
global.packname = module.exports.packname;
global.author = module.exports.author;
global.botname = module.exports.botname;
global.ownername = module.exports.ownername;
global.ownerNumber = module.exports.ownerNumber;
global.phoneNumber = module.exports.ownerNumber;