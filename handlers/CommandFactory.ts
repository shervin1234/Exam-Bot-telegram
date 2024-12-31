import { Context, Telegraf, type MiddlewareFn } from "telegraf";
import { PrismaClient } from "@prisma/client";
import { promises as fsPromises } from "fs";
import fs from "fs";
import { Logger } from "../utils/logger";

// Types
type CustomContext = {
    startPayload?: string;
};

type CommandHandler = (
    ctx: Context,
    bot: Telegraf<Context>,
    args: string[]
) => Promise<void>;

type CallbackHandler = (ctx: Context) => Promise<void>;

type GlobalConfig = {
    updateMode: boolean;
    disableAllCommands: boolean;
};

type CommandConfig = {
    enabled: boolean;
    allow_list: Record<string, boolean>;
    block_list: Record<string, boolean>;
    description: string;
    subcommands?: Record<string, CommandConfig>;
};

type CommandsConfig = {
    globalConfig: GlobalConfig;
    commands: Record<string, CommandConfig>;
};

// Utility class for shared features using Mixin
class MixinUtility {
    /**
     * Validates if a command is enabled.
     * @param config - Command configuration object.
     * @returns true if the command is enabled, otherwise false.
     */
    protected validateCommand(config: CommandConfig): boolean {
        return config.enabled;
    }

    /**
     * Sends an error message to the user.
     * @param ctx - Telegram bot context.
     * @param message - Error message to display.
     */
    protected async replyWithError(ctx: Context, message: string): Promise<void> {
        await ctx.reply(`❌ ${message}`);
    }
}

// Command Class
class Command extends MixinUtility {
    private name: string;
    private handler: CommandHandler | null = null;
    private subCommands: Map<string, Command> = new Map();
    private static botInstance: Telegraf<Context> | null = null;
    private static config: CommandsConfig | null = null;

    constructor(name: string) {
        super();
        this.name = name;

        if (!Command.config) {
            Command.initializeConfig();
        }

        this.ensureCommandInConfig();
    }

    /**
     * Sets the bot instance for Command class.
     * @param bot - Telegraf bot instance.
     */
    static setBotInstance(bot: Telegraf<Context>): void {
        Command.botInstance = bot;
    }

    /**
     * Retrieves the bot instance.
     * @returns The Telegraf bot instance.
     * @throws Error if the bot instance is not initialized.
     */
    static getBotInstance(): Telegraf<Context> {
        if (!Command.botInstance) {
            throw new Error("Bot instance is not initialized. Call Command.setBotInstance first.");
        }
        return Command.botInstance;
    }

    /**
     * Initializes the configuration file.
     * @param filePath - Path to the configuration file (default: commands.json).
     */
    static initializeConfig(filePath: string = "commands.json"): void {
        try {
            const fileContent = fs.readFileSync(filePath, "utf8");
            Command.config = JSON.parse(fileContent);
        } catch (error) {
            Logger.error("Failed to load configuration file. Using default configuration.");
            Command.config = {
                globalConfig: {
                    updateMode: false,
                    disableAllCommands: false,
                },
                commands: {},
            };
        }
    }

    /**
     * Generates the default configuration for commands.
     * @returns Default command configuration object.
     */
    static generateDefaultConfig(): CommandsConfig {
        return {
            globalConfig: {
                updateMode: false,
                disableAllCommands: false,
            },
            commands: {},
        };
    }

    /**
     * Saves the current configuration to a file.
     * @param filePath - Path to save the configuration (default: commands.json).
     */
    static async saveConfig(filePath: string = "commands.json"): Promise<void> {
        try {
            await fsPromises.writeFile(filePath, JSON.stringify(Command.config, null, 2));
            Logger.info("Configuration saved successfully.");
        } catch (error) {
            Logger.error(`Failed to save configuration: ${(error as Error).message}`);
        }
    }

    /**
     * Ensures the command exists in the configuration file.
     */
    private ensureCommandInConfig(): void {
        if (!Command.config?.commands[this.name]) {
            Command.config!.commands[this.name] = {
                enabled: true,
                allow_list: {},
                block_list: {},
                description: `Command '${this.name}' description.`,
                subcommands: {},
            };
        }
    }

    /**
     * Adds a subcommand to the current command.
     * @param subCommand - Subcommand to add.
     * @returns Current command instance for chaining.
     */
    addSubCommand(subCommand: Command): this {
        this.subCommands.set(subCommand.getName(), subCommand);
        return this;
    }

    /**
     * Sets the command handler function.
     * @param handler - Function to execute the command logic.
     * @returns Current command instance for chaining.
     */
    setHandler(handler: CommandHandler): this {
        this.handler = handler;
        return this;
    }

    /**
     * Retrieves the command name.
     * @returns Command name.
     */
    getName(): string {
        return this.name;
    }

    /**
     * Executes the command logic.
     * @param ctx - Telegram bot context.
     * @param args - Arguments passed to the command.
     */
    async execute(ctx: Context, args: string[] = []): Promise<void> {
        // Retrieve the command configuration
        const commandConfig = Command.config!.commands[this.name];
    
        const messageText = ctx.text || "";
        const commandArgs = messageText.split(" ").slice(1);
        Logger.debug(`ARGS: ${JSON.stringify(commandArgs)}`);
    
        // Check if the command is valid
        if (!this.validateCommand(commandConfig)) {
            await this.replyWithError(ctx, `Command '${this.name}' is disabled.`);
            return;
        }
    
        // If arguments are provided, check for subcommands
        if (args.length > 0) {
            const subCommand = this.subCommands.get(args[0]);
            if (subCommand) {
                await subCommand.execute(ctx, args.slice(1)); // Execute the subcommand if found
                return;
            }
        }
    
        let customcontext: Context & CustomContext = ctx;
        // Generate command handler for the custom context
        const customContext: CustomContext = { startPayload: customcontext.startPayload };
    
        // Execute the command handler if available
        if (this.handler) {
            await this.handler(ctx, Command.getBotInstance(), commandArgs); // Execute the main handler
        } else {
            await this.replyWithError(ctx, `Command '${this.name}' is not implemented.`);
        }
    }
}

// Code to ensure `userid` is always valid in database:
const prisma = new PrismaClient();

/**
 * Ensures `userid` is never null or undefined in the database.
 * @param ctx - Telegram bot context.
 */
async function ensureValidUserId(ctx: Context): Promise<void> {
    const { id, username, first_name, last_name, language_code } = ctx.from!;
    
    try {
        // Check if the user exists
        let user = await prisma.user.findUnique({
            where: { userid: BigInt(id) },
        });

        // If not, create the user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    userid: BigInt(id),
                    username: username || null,
                    firstName: first_name || null,
                    lastName: last_name || null,
                    languageCode: language_code || null,
                },
            });
        }
    } catch (error) {
        console.error("Error in ensureValidUserId:", error);
        throw new Error("Cannot find the user, Please check the user constructor method");
    }
}

const userMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
    if (!ctx.from) {
        return next(); // Ignore if the request doesn't have user info
    }

    const { id, username, first_name, last_name, language_code } = ctx.from;

    try {
        // Check if the user exists
        let user = await prisma.user.findUnique({
            where: { userid: BigInt(id) },
        });

        // If not, create the user
        if (!user) {
            await prisma.user.create({
                data: {
                    userid: BigInt(id),
                    username: username || null,
                    firstName: first_name || null,
                    lastName: last_name || null,
                    languageCode: language_code || null,
                },
            });
            console.log(`User ${id} added to the database.`);
        }
    } catch (error) {
        console.error("Error in userMiddleware:", error);
    }

    return next(); // Continue to the next middleware or command
};

export { Command, ensureValidUserId, userMiddleware };