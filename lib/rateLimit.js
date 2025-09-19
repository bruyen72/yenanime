const fs = require('fs');
const path = require('path');

/**
 * WhatsApp Bot Rate Limiting System
 * Prevents bot from being banned due to excessive messages
 */

class RateLimiter {
    constructor() {
        // Rate limiting configurations
        this.limits = {
            // Per user limits
            userMessageLimit: 10,        // Max 10 messages per user per minute
            userCommandLimit: 5,         // Max 5 commands per user per minute
            
            // Per group limits  
            groupMessageLimit: 30,       // Max 30 messages per group per minute
            groupCommandLimit: 15,       // Max 15 commands per group per minute
            
            // Global limits (entire bot)
            globalMessageLimit: 100,     // Max 100 messages per minute globally
            globalCommandLimit: 50,      // Max 50 commands per minute globally
            
            // Time windows
            timeWindow: 60 * 1000,       // 1 minute in milliseconds
            cooldownPeriod: 2 * 1000,    // 2 seconds between messages
        };

        // Storage for tracking usage
        this.userUsage = new Map();      // userId -> { messages: [], commands: [], lastMessage: timestamp }
        this.groupUsage = new Map();     // groupId -> { messages: [], commands: [], lastMessage: timestamp }
        this.globalUsage = {
            messages: [],
            commands: [],
            lastMessage: 0
        };

        // Queue for delayed messages
        this.messageQueue = [];
        this.isProcessingQueue = false;

        // Cleanup old entries every 2 minutes
        setInterval(() => this.cleanup(), 2 * 60 * 1000);
        
        console.log('🛡️ Rate Limiter initialized - Bot protection active');
    }

    /**
     * Check if user/group can send a message
     */
    canSendMessage(userId, groupId = null, isCommand = false) {
        const now = Date.now();
        const type = isCommand ? 'commands' : 'messages';
        
        // Check user limits
        if (!this.checkUserLimit(userId, type, now)) {
            return {
                allowed: false,
                reason: `Limite de ${isCommand ? 'comandos' : 'mensagens'} por usuário atingido`,
                waitTime: this.getWaitTime(userId, type)
            };
        }

        // Check group limits (if in group)
        if (groupId && !this.checkGroupLimit(groupId, type, now)) {
            return {
                allowed: false,
                reason: `Limite de ${isCommand ? 'comandos' : 'mensagens'} do grupo atingido`,
                waitTime: this.getGroupWaitTime(groupId, type)
            };
        }

        // Check global limits
        if (!this.checkGlobalLimit(type, now)) {
            return {
                allowed: false,
                reason: 'Limite global do bot atingido - tente novamente em alguns segundos',
                waitTime: 30000 // 30 seconds
            };
        }

        // Check cooldown period
        if (!this.checkCooldown(userId, now)) {
            return {
                allowed: false,
                reason: 'Aguarde um momento antes de enviar outra mensagem',
                waitTime: 2000 // 2 seconds
            };
        }

        return { allowed: true };
    }

    /**
     * Record a message/command usage
     */
    recordUsage(userId, groupId = null, isCommand = false) {
        const now = Date.now();
        const type = isCommand ? 'commands' : 'messages';

        // Record user usage
        if (!this.userUsage.has(userId)) {
            this.userUsage.set(userId, { messages: [], commands: [], lastMessage: 0 });
        }
        const userData = this.userUsage.get(userId);
        userData[type].push(now);
        userData.lastMessage = now;

        // Record group usage
        if (groupId) {
            if (!this.groupUsage.has(groupId)) {
                this.groupUsage.set(groupId, { messages: [], commands: [], lastMessage: 0 });
            }
            const groupData = this.groupUsage.get(groupId);
            groupData[type].push(now);
            groupData.lastMessage = now;
        }

        // Record global usage
        this.globalUsage[type].push(now);
        this.globalUsage.lastMessage = now;
    }

    /**
     * Add message to queue for delayed sending
     */
    queueMessage(messageFunction, priority = 'normal') {
        const queueItem = {
            execute: messageFunction,
            priority: priority,
            timestamp: Date.now(),
            id: Math.random().toString(36).substring(7)
        };

        // Insert based on priority
        if (priority === 'high') {
            this.messageQueue.unshift(queueItem);
        } else {
            this.messageQueue.push(queueItem);
        }

        // Start processing if not already running
        if (!this.isProcessingQueue) {
            this.processQueue();
        }

        return queueItem.id;
    }

    /**
     * Process message queue with delays
     */
    async processQueue() {
        if (this.messageQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }

        this.isProcessingQueue = true;
        const item = this.messageQueue.shift();

        try {
            // Execute the message function
            await item.execute();
            
            // Wait before processing next message
            await new Promise(resolve => setTimeout(resolve, this.limits.cooldownPeriod));
        } catch (error) {
            console.error('Error processing queued message:', error);
        }

        // Continue processing
        setTimeout(() => this.processQueue(), 100);
    }

    /**
     * Check user-specific limits
     */
    checkUserLimit(userId, type, now) {
        const userData = this.userUsage.get(userId);
        if (!userData) return true;

        const limit = type === 'commands' ? this.limits.userCommandLimit : this.limits.userMessageLimit;
        const recentUsage = userData[type].filter(timestamp => now - timestamp < this.limits.timeWindow);
        
        return recentUsage.length < limit;
    }

    /**
     * Check group-specific limits
     */
    checkGroupLimit(groupId, type, now) {
        const groupData = this.groupUsage.get(groupId);
        if (!groupData) return true;

        const limit = type === 'commands' ? this.limits.groupCommandLimit : this.limits.groupMessageLimit;
        const recentUsage = groupData[type].filter(timestamp => now - timestamp < this.limits.timeWindow);
        
        return recentUsage.length < limit;
    }

    /**
     * Check global limits
     */
    checkGlobalLimit(type, now) {
        const limit = type === 'commands' ? this.limits.globalCommandLimit : this.limits.globalMessageLimit;
        const recentUsage = this.globalUsage[type].filter(timestamp => now - timestamp < this.limits.timeWindow);
        
        return recentUsage.length < limit;
    }

    /**
     * Check cooldown between messages
     */
    checkCooldown(userId, now) {
        const userData = this.userUsage.get(userId);
        if (!userData) return true;

        return now - userData.lastMessage >= this.limits.cooldownPeriod;
    }

    /**
     * Get wait time for user
     */
    getWaitTime(userId, type) {
        const userData = this.userUsage.get(userId);
        if (!userData || userData[type].length === 0) return 0;

        const oldestUsage = Math.min(...userData[type]);
        return Math.max(0, this.limits.timeWindow - (Date.now() - oldestUsage));
    }

    /**
     * Get wait time for group
     */
    getGroupWaitTime(groupId, type) {
        const groupData = this.groupUsage.get(groupId);
        if (!groupData || groupData[type].length === 0) return 0;

        const oldestUsage = Math.min(...groupData[type]);
        return Math.max(0, this.limits.timeWindow - (Date.now() - oldestUsage));
    }

    /**
     * Clean up old entries to prevent memory leaks
     */
    cleanup() {
        const now = Date.now();
        const cutoff = now - this.limits.timeWindow * 2; // Keep 2x time window for safety

        // Clean user usage
        for (const [userId, userData] of this.userUsage.entries()) {
            userData.messages = userData.messages.filter(timestamp => timestamp > cutoff);
            userData.commands = userData.commands.filter(timestamp => timestamp > cutoff);
            
            // Remove empty entries
            if (userData.messages.length === 0 && userData.commands.length === 0 && now - userData.lastMessage > this.limits.timeWindow) {
                this.userUsage.delete(userId);
            }
        }

        // Clean group usage
        for (const [groupId, groupData] of this.groupUsage.entries()) {
            groupData.messages = groupData.messages.filter(timestamp => timestamp > cutoff);
            groupData.commands = groupData.commands.filter(timestamp => timestamp > cutoff);
            
            // Remove empty entries
            if (groupData.messages.length === 0 && groupData.commands.length === 0 && now - groupData.lastMessage > this.limits.timeWindow) {
                this.groupUsage.delete(groupId);
            }
        }

        // Clean global usage
        this.globalUsage.messages = this.globalUsage.messages.filter(timestamp => timestamp > cutoff);
        this.globalUsage.commands = this.globalUsage.commands.filter(timestamp => timestamp > cutoff);

        console.log(`🧹 Rate limiter cleanup: ${this.userUsage.size} users, ${this.groupUsage.size} groups tracked`);
    }

    /**
     * Get current usage statistics
     */
    getStats() {
        const now = Date.now();
        return {
            activeUsers: this.userUsage.size,
            activeGroups: this.groupUsage.size,
            queuedMessages: this.messageQueue.length,
            globalMessages: this.globalUsage.messages.filter(t => now - t < this.limits.timeWindow).length,
            globalCommands: this.globalUsage.commands.filter(t => now - t < this.limits.timeWindow).length,
            isProcessingQueue: this.isProcessingQueue
        };
    }

    /**
     * Create a rate-limited version of a function
     */
    createLimitedFunction(originalFunction, userId, groupId = null, isCommand = false, priority = 'normal') {
        return async (...args) => {
            const check = this.canSendMessage(userId, groupId, isCommand);
            
            if (!check.allowed) {
                // Instead of rejecting, queue the message with a warning
                console.log(`⚠️ Rate limited: ${check.reason} - Queuing message`);
                
                return this.queueMessage(async () => {
                    this.recordUsage(userId, groupId, isCommand);
                    return await originalFunction(...args);
                }, priority);
            }

            // Record usage and execute immediately
            this.recordUsage(userId, groupId, isCommand);
            return await originalFunction(...args);
        };
    }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;