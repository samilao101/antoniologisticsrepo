import { kv } from '@vercel/kv';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  details?: any;
  endpoint?: string;
}

// Store for SSE clients
type LogCallback = (log: LogEntry) => void;
const logSubscribers = new Set<LogCallback>();

class Logger {
  private maxLogs = 100; // Keep last 100 logs
  private logKey = 'system:logs';

  subscribe(callback: LogCallback) {
    logSubscribers.add(callback);
    return () => logSubscribers.delete(callback);
  }

  private notifySubscribers(entry: LogEntry) {
    logSubscribers.forEach(callback => {
      try {
        callback(entry);
      } catch (error) {
        console.error('Error notifying log subscriber:', error);
      }
    });
  }

  async log(level: LogEntry['level'], message: string, details?: any, endpoint?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      endpoint,
    };

    // Console log for Vercel logs
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');

    // Notify real-time subscribers
    this.notifySubscribers(entry);

    try {
      // Get existing logs
      const logs: LogEntry[] = (await kv.get(this.logKey)) || [];

      // Add new log
      logs.unshift(entry);

      // Keep only last maxLogs entries
      const trimmedLogs = logs.slice(0, this.maxLogs);

      // Save back to KV with 24 hour TTL
      await kv.set(this.logKey, trimmedLogs, { ex: 86400 });
    } catch (error) {
      // If KV fails, at least we have console logs
      console.error('Failed to save log to KV:', error);
    }
  }

  async info(message: string, details?: any, endpoint?: string) {
    await this.log('info', message, details, endpoint);
  }

  async error(message: string, details?: any, endpoint?: string) {
    await this.log('error', message, details, endpoint);
  }

  async warn(message: string, details?: any, endpoint?: string) {
    await this.log('warn', message, details, endpoint);
  }

  async debug(message: string, details?: any, endpoint?: string) {
    await this.log('debug', message, details, endpoint);
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      const logs: LogEntry[] = (await kv.get(this.logKey)) || [];
      return logs;
    } catch (error) {
      console.error('Failed to retrieve logs from KV:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await kv.del(this.logKey);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

export const logger = new Logger();
