import { Logger } from './utils/logger';
import dotenv from 'dotenv';
import { Bot } from './bot';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

let retryAttempts = 0;
const MAX_RETRIES = 10;
const RETRY_DELAY = 60000; // 60 seconds cooldown after 10 failed attempts

// Function to connect to Prisma
async function connectToPrisma() {
    while (retryAttempts < MAX_RETRIES) {
        try {
            await prisma.$connect(); // Attempt to connect to Prisma
            Logger.info('Successfully connected to Prisma.');
            return true; // Exit the loop if the connection is successful
        } catch (error) {
            retryAttempts++;
            Logger.error(`Failed to connect to Prisma (Attempt ${retryAttempts}/${MAX_RETRIES}): ${error}`);
            if (retryAttempts < MAX_RETRIES) {
                Logger.info(`Retrying in 10 seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 seconds delay before retrying
            } else {
                Logger.error('Max retry attempts reached. Waiting for 60 seconds before trying again...');
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY)); // Cooldown of 60 seconds after 10 failed attempts
                retryAttempts = 0; // Reset attempts after cooldown
            }
        }
    }
}



// Disconnect Prisma client when process exits
const disconnectPrisma = async () => {
    await prisma.$disconnect();
    Logger.info('Disconnected from Prisma.');
};

// Handle uncaught exceptions and unhandled promise rejections
process.on('unhandledRejection', (e: any) => {
    Logger.error(e);
});
process.on('uncaughtException', (error: any) => {
    Logger.error(error);
});


// Main entry point of the application
async function main() {

   try {
        // Attempt to connect to Prisma first
        const connected = await connectToPrisma();

        if (connected) {
          // Once Prisma is connected, start the bot
          const bot = new Bot();
          bot.start();
          Logger.info('Bot started successfully.');
          Logger.garbageCollector(); // Run garbage collector at start
        } else {
          Logger.error('Failed to start the bot due to Prisma connection failure.');
        }
      } catch (error) {
        Logger.error('Failed to start the application: ' + error);
      }  
}

// Call the main function to start the app
main();

// Disconnect Prisma when process exits
process.on('exit', () => disconnectPrisma());
