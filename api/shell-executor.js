/**
 * Shell Command Executor - Knight Bot
 * Sistema para executar comandos shell/cmd com segurança
 */

const cmd = require('node-cmd');
const { exec, spawn } = require('child_process');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class ShellExecutor {
    constructor() {
        this.allowedCommands = [
            // Comandos básicos do sistema
            'ls', 'dir', 'pwd', 'cd', 'mkdir', 'rmdir',
            'cat', 'type', 'echo', 'whoami', 'date',

            // Comandos de rede
            'ping', 'curl', 'wget', 'telnet', 'netstat',

            // Comandos Git
            'git', 'npm', 'node', 'yarn',

            // Comandos de monitoramento
            'ps', 'top', 'htop', 'free', 'df', 'du',
            'tasklist', 'taskkill', 'systeminfo',

            // Comandos personalizados
            'knight-status', 'knight-restart', 'knight-logs'
        ];

        this.blockedCommands = [
            'rm', 'del', 'format', 'fdisk', 'mkfs',
            'dd', 'shutdown', 'reboot', 'halt',
            'passwd', 'su', 'sudo', 'chmod', 'chown',
            'iptables', 'firewall', 'netsh'
        ];

        this.workingDirectory = process.cwd();
        this.commandHistory = [];
        this.maxHistorySize = 100;
    }

    isCommandAllowed(command) {
        const baseCommand = command.split(' ')[0].toLowerCase();

        // Verifica se está na lista de bloqueados
        if (this.blockedCommands.includes(baseCommand)) {
            return false;
        }

        // Verifica se está na lista de permitidos
        return this.allowedCommands.includes(baseCommand) || baseCommand.startsWith('knight-');
    }

    sanitizeCommand(command) {
        // Remove caracteres perigosos
        const dangerous = ['&', '|', ';', '`', '$', '(', ')', '{', '}', '<', '>', '"', "'"];
        let sanitized = command;

        dangerous.forEach(char => {
            sanitized = sanitized.replace(new RegExp('\\' + char, 'g'), '');
        });

        return sanitized.trim();
    }

    addToHistory(command, result, error = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            command: command,
            result: result,
            error: error,
            working_directory: this.workingDirectory
        };

        this.commandHistory.unshift(entry);

        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory = this.commandHistory.slice(0, this.maxHistorySize);
        }

        logger.info('Shell command executed', entry);
    }

    async executeCommand(command, options = {}) {
        try {
            const sanitizedCommand = this.sanitizeCommand(command);

            if (!this.isCommandAllowed(sanitizedCommand)) {
                throw new Error(`Comando não permitido: ${sanitizedCommand.split(' ')[0]}`);
            }

            logger.info('Executing shell command', { command: sanitizedCommand });

            // Verifica se é comando personalizado
            if (sanitizedCommand.startsWith('knight-')) {
                return await this.executeKnightCommand(sanitizedCommand);
            }

            // Executa comando normal
            return new Promise((resolve, reject) => {
                const timeout = options.timeout || 30000; // 30 segundos padrão

                const child = exec(sanitizedCommand, {
                    cwd: this.workingDirectory,
                    timeout: timeout,
                    maxBuffer: 1024 * 1024 // 1MB buffer máximo
                }, (error, stdout, stderr) => {
                    if (error) {
                        this.addToHistory(sanitizedCommand, null, error.message);
                        reject(new Error(`Erro na execução: ${error.message}`));
                        return;
                    }

                    const result = {
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        command: sanitizedCommand,
                        working_directory: this.workingDirectory,
                        timestamp: new Date().toISOString()
                    };

                    this.addToHistory(sanitizedCommand, result);
                    resolve(result);
                });

                // Timeout manual
                setTimeout(() => {
                    child.kill('SIGTERM');
                    reject(new Error('Comando excedeu tempo limite'));
                }, timeout);
            });

        } catch (error) {
            logger.error('Shell command execution failed', error, { command });
            throw error;
        }
    }

    async executeKnightCommand(command) {
        const [baseCommand, ...args] = command.split(' ');

        switch (baseCommand) {
            case 'knight-status':
                return await this.getKnightStatus();

            case 'knight-restart':
                return await this.restartKnight();

            case 'knight-logs':
                return await this.getKnightLogs(args[0] || 'all');

            case 'knight-health':
                return await this.getSystemHealth();

            case 'knight-clean':
                return await this.cleanSystem();

            default:
                throw new Error(`Comando Knight não reconhecido: ${baseCommand}`);
        }
    }

    async getKnightStatus() {
        const status = {
            service: 'Knight Bot',
            status: 'operational',
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
            node_version: process.version,
            platform: process.platform,
            working_directory: this.workingDirectory,
            command_history_size: this.commandHistory.length,
            timestamp: new Date().toISOString()
        };

        return {
            stdout: JSON.stringify(status, null, 2),
            stderr: '',
            command: 'knight-status',
            working_directory: this.workingDirectory,
            timestamp: new Date().toISOString()
        };
    }

    async restartKnight() {
        logger.warn('Knight restart requested via shell command');

        // Simula restart (em produção seria process.exit(0) com supervisão)
        setTimeout(() => {
            logger.info('Knight restarting...');
        }, 1000);

        return {
            stdout: 'Knight Bot restart iniciado...',
            stderr: '',
            command: 'knight-restart',
            working_directory: this.workingDirectory,
            timestamp: new Date().toISOString()
        };
    }

    async getKnightLogs(level = 'all') {
        try {
            const logFile = path.join(process.cwd(), 'logs', `knight-bot-${new Date().toISOString().split('T')[0]}.log`);

            if (!fs.existsSync(logFile)) {
                return {
                    stdout: 'Arquivo de log não encontrado',
                    stderr: '',
                    command: `knight-logs ${level}`,
                    working_directory: this.workingDirectory,
                    timestamp: new Date().toISOString()
                };
            }

            const logs = fs.readFileSync(logFile, 'utf8');
            const lines = logs.split('\n').filter(line => line.trim());

            let filteredLogs = lines;
            if (level !== 'all') {
                filteredLogs = lines.filter(line => line.includes(`"level":"${level.toUpperCase()}"`));
            }

            const lastLines = filteredLogs.slice(-50); // Últimas 50 linhas

            return {
                stdout: lastLines.join('\n'),
                stderr: '',
                command: `knight-logs ${level}`,
                working_directory: this.workingDirectory,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                stdout: '',
                stderr: `Erro ao ler logs: ${error.message}`,
                command: `knight-logs ${level}`,
                working_directory: this.workingDirectory,
                timestamp: new Date().toISOString()
            };
        }
    }

    async getSystemHealth() {
        const health = {
            cpu_usage: process.cpuUsage(),
            memory_usage: process.memoryUsage(),
            uptime_seconds: process.uptime(),
            platform: process.platform,
            arch: process.arch,
            node_version: process.version,
            load_average: process.platform === 'linux' ? require('os').loadavg() : 'N/A (Windows)',
            free_memory: require('os').freemem(),
            total_memory: require('os').totalmem(),
            disk_usage: await this.getDiskUsage()
        };

        return {
            stdout: JSON.stringify(health, null, 2),
            stderr: '',
            command: 'knight-health',
            working_directory: this.workingDirectory,
            timestamp: new Date().toISOString()
        };
    }

    async getDiskUsage() {
        try {
            const stats = fs.statSync(this.workingDirectory);
            return {
                working_directory: this.workingDirectory,
                accessible: true
            };
        } catch (error) {
            return {
                working_directory: this.workingDirectory,
                accessible: false,
                error: error.message
            };
        }
    }

    async cleanSystem() {
        let cleaned = [];

        try {
            // Limpa logs antigos
            const logsDir = path.join(process.cwd(), 'logs');
            if (fs.existsSync(logsDir)) {
                const files = fs.readdirSync(logsDir);
                const oldFiles = files.filter(file => {
                    const filePath = path.join(logsDir, file);
                    const stats = fs.statSync(filePath);
                    const age = Date.now() - stats.mtime.getTime();
                    return age > 7 * 24 * 60 * 60 * 1000; // 7 dias
                });

                oldFiles.forEach(file => {
                    fs.unlinkSync(path.join(logsDir, file));
                    cleaned.push(`log: ${file}`);
                });
            }

            // Limpa histórico de comandos
            if (this.commandHistory.length > 50) {
                this.commandHistory = this.commandHistory.slice(0, 50);
                cleaned.push('command history');
            }

            return {
                stdout: `Sistema limpo: ${cleaned.join(', ') || 'nenhuma limpeza necessária'}`,
                stderr: '',
                command: 'knight-clean',
                working_directory: this.workingDirectory,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                stdout: '',
                stderr: `Erro na limpeza: ${error.message}`,
                command: 'knight-clean',
                working_directory: this.workingDirectory,
                timestamp: new Date().toISOString()
            };
        }
    }

    getCommandHistory(limit = 20) {
        return this.commandHistory.slice(0, limit);
    }

    changeDirectory(newPath) {
        try {
            if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
                this.workingDirectory = path.resolve(newPath);
                logger.info('Working directory changed', { new_path: this.workingDirectory });
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Failed to change directory', error, { path: newPath });
            return false;
        }
    }
}

// Instância singleton
let shellInstance = null;

function getShellExecutor() {
    if (!shellInstance) {
        shellInstance = new ShellExecutor();
    }
    return shellInstance;
}

module.exports = {
    ShellExecutor,
    getShellExecutor
};