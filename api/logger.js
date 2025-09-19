/**
 * Sistema de Logs Avançado - Knight Bot
 * Logger com diferentes níveis e formatação colorida
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };

        this.colors = {
            ERROR: '\x1b[31m', // Vermelho
            WARN: '\x1b[33m',  // Amarelo
            INFO: '\x1b[36m',  // Ciano
            DEBUG: '\x1b[35m', // Magenta
            TRACE: '\x1b[37m', // Branco
            RESET: '\x1b[0m'   // Reset
        };

        this.currentLevel = this.logLevels.INFO;
        this.logFile = null;
        this.enableConsole = true;
        this.enableFile = false;
    }

    setLevel(level) {
        if (typeof level === 'string') {
            level = this.logLevels[level.toUpperCase()];
        }
        this.currentLevel = level;
    }

    setLogFile(filePath) {
        this.logFile = filePath;
        this.enableFile = true;

        // Cria diretório se não existir
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null, error = null) {
        const timestamp = new Date().toISOString();
        const pid = process.pid;

        let logEntry = {
            timestamp,
            level,
            pid,
            message
        };

        if (data) {
            logEntry.data = data;
        }

        if (error) {
            logEntry.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }

        return logEntry;
    }

    shouldLog(level) {
        return this.logLevels[level] <= this.currentLevel;
    }

    writeLog(level, message, data = null, error = null) {
        if (!this.shouldLog(level)) return;

        const logEntry = this.formatMessage(level, message, data, error);

        // Log para console
        if (this.enableConsole) {
            const color = this.colors[level] || this.colors.RESET;
            const coloredLevel = `${color}[${level}]${this.colors.RESET}`;

            let consoleMessage = `${logEntry.timestamp} ${coloredLevel} PID:${logEntry.pid} ${message}`;

            if (data) {
                consoleMessage += ` | Data: ${JSON.stringify(data)}`;
            }

            if (error) {
                consoleMessage += ` | Error: ${error.message}`;
            }

            console.log(consoleMessage);

            if (error && error.stack) {
                console.log(`${color}Stack:${this.colors.RESET} ${error.stack}`);
            }
        }

        // Log para arquivo
        if (this.enableFile && this.logFile) {
            const fileEntry = JSON.stringify(logEntry) + '\n';
            fs.appendFileSync(this.logFile, fileEntry);
        }
    }

    error(message, error = null, data = null) {
        this.writeLog('ERROR', message, data, error);
    }

    warn(message, data = null) {
        this.writeLog('WARN', message, data);
    }

    info(message, data = null) {
        this.writeLog('INFO', message, data);
    }

    debug(message, data = null) {
        this.writeLog('DEBUG', message, data);
    }

    trace(message, data = null) {
        this.writeLog('TRACE', message, data);
    }

    // Métodos específicos para WhatsApp Bot
    whatsapp(action, data = null) {
        this.info(`WhatsApp ${action}`, data);
    }

    api(method, endpoint, data = null) {
        this.info(`API ${method} ${endpoint}`, data);
    }

    pairing(action, sessionId, data = null) {
        this.info(`Pairing ${action}`, { session_id: sessionId, ...data });
    }

    qr(action, qrId, data = null) {
        this.info(`QR ${action}`, { qr_id: qrId, ...data });
    }

    mobile(action, userAgent, data = null) {
        this.info(`Mobile ${action}`, { user_agent: userAgent, ...data });
    }

    // Log de performance
    performance(operation, duration, data = null) {
        this.info(`Performance ${operation}`, { duration_ms: duration, ...data });
    }

    // Log de segurança
    security(event, data = null) {
        this.warn(`Security ${event}`, data);
    }

    // Limpa logs antigos
    cleanOldLogs(maxAgeDays = 7) {
        if (!this.logFile) return;

        try {
            const stats = fs.statSync(this.logFile);
            const ageMs = Date.now() - stats.mtime.getTime();
            const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

            if (ageMs > maxAgeMs) {
                fs.unlinkSync(this.logFile);
                this.info('Old log file cleaned', { age_days: Math.round(ageMs / (24 * 60 * 60 * 1000)) });
            }
        } catch (error) {
            this.error('Error cleaning old logs', error);
        }
    }

    // Obtém estatísticas dos logs
    getStats() {
        if (!this.logFile || !fs.existsSync(this.logFile)) {
            return null;
        }

        try {
            const content = fs.readFileSync(this.logFile, 'utf8');
            const lines = content.trim().split('\n').filter(line => line);

            const stats = {
                total_entries: lines.length,
                file_size_kb: Math.round(fs.statSync(this.logFile).size / 1024),
                levels: {},
                latest_timestamp: null,
                oldest_timestamp: null
            };

            lines.forEach(line => {
                try {
                    const entry = JSON.parse(line);
                    stats.levels[entry.level] = (stats.levels[entry.level] || 0) + 1;

                    if (!stats.oldest_timestamp || entry.timestamp < stats.oldest_timestamp) {
                        stats.oldest_timestamp = entry.timestamp;
                    }
                    if (!stats.latest_timestamp || entry.timestamp > stats.latest_timestamp) {
                        stats.latest_timestamp = entry.timestamp;
                    }
                } catch (e) {
                    // Ignora linhas mal formadas
                }
            });

            return stats;
        } catch (error) {
            this.error('Error getting log stats', error);
            return null;
        }
    }
}

// Instância global do logger
const logger = new Logger();

// Configuração baseada em variáveis de ambiente
if (process.env.LOG_LEVEL) {
    logger.setLevel(process.env.LOG_LEVEL);
}

if (process.env.LOG_FILE) {
    logger.setLogFile(process.env.LOG_FILE);
} else {
    // Log padrão no diretório logs
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, `knight-bot-${new Date().toISOString().split('T')[0]}.log`);
    logger.setLogFile(logFile);
}

// Limpa logs antigos na inicialização
logger.cleanOldLogs();

module.exports = logger;