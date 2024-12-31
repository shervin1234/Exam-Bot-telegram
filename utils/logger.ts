import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { message } from 'telegraf/filters';

// Directory for storing log files
const LOG_DIR = path.join(__dirname, '../../logs');

// Environment variable to check if DEBUG mode is enabled
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

// Create log directory if it doesn't exist
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

export class Logger {
    private static getColor(level: string): (message: string) => string {
        switch (level) {
            case 'info':
                return chalk.green;
            case 'warn':
                return chalk.yellow;
            case 'error':
                return chalk.red;
            case 'debug':
                return chalk.blue;
            default:
                return chalk.white;
        }
    }

    private static log(level: string, ...args: any[]) {
        // Generate a timestamp for the log entry
        const timestamp = new Date().toISOString();
    
        // Format log message
        const message = args
            .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
            .join(' ');
    
        // Construct the final log message with colorized output
        const logMessage = `${chalk.white("[")}${chalk.gray(timestamp)}${chalk.white("]")} ` +
            `${chalk.cyan("::")} ${chalk.white("[")}${this.getColor(level)(level.toUpperCase())}${chalk.white("]")} ` +
            `${chalk.cyan("::>")} ${message}`;
    
        // Print log to console (colorized)
        if (DEBUG_MODE || level !== 'debug') {
            console.log(logMessage);
        }
    
        // Write log to the appropriate file
        const logFilePath = path.join(LOG_DIR, `${level}.log`);
        fs.appendFileSync(logFilePath, logMessage + '\n', { encoding: 'utf-8' });
    }
    
    public static info(...args: any[]) {
        this.log('info', ...args);
    }

    public static warn(...args: any[]) {
        this.log('warn', ...args);
    }

    public static error(...args: any[]) {
        this.log('error', ...args);
    }

    public static debug(...args: any[]) {
        if (DEBUG_MODE) {
            this.log('debug', ...args);
        }
    }

    public static garbageCollector(retentionDays: number = 7) {
        const expirationTime = retentionDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        const now = Date.now();

        try {
            fs.readdirSync(LOG_DIR).forEach(file => {
                const filePath = path.join(LOG_DIR, file);
                const stats = fs.statSync(filePath);

                if (now - stats.mtimeMs > expirationTime) {
                    fs.unlinkSync(filePath);
                    this.info(`Deleted old log file: ${file}`);
                }
            });
        } catch (error) {
            this.error('Error in garbage collector:', error);
        }
    }
}
