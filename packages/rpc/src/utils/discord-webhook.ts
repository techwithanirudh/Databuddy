import { Logger } from '@databuddy/logger';

// A simple wrapper around the logger for Discord webhooks
class DiscordLogger {
    private logger: Logger;

    constructor() {
        this.logger = new Logger({
            service: 'rpc-api',
            level: 'info',
        });
    }

    private send(method: 'success' | 'warning' | 'info' | 'error', title: string, message: string, data?: Record<string, any>) {
        // In a real scenario, this would format and send to a Discord webhook URL
        // For now, we'll just log it to the console with the intended webhook structure.
        this.logger[method](`[Discord Webhook] ${title}: ${message}`, data);
    }

    success(title: string, message: string, data?: Record<string, any>) {
        this.send('success', title, message, data);
    }

    info(title: string, message: string, data?: Record<string, any>) {
        this.send('info', title, message, data);
    }

    warning(title: string, message: string, data?: Record<string, any>) {
        this.send('warning', title, message, data);
    }

    error(title: string, message: string, data?: Record<string, any>) {
        this.send('error', title, message, data);
    }
}

export const discordLogger = new DiscordLogger();
