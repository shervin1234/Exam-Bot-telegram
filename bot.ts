import {Telegraf, Context, Markup} from "telegraf";
import {Logger} from "./utils/logger";
import {Command} from "./handlers/CommandFactory";
import * as fs from "fs";
import * as path from "path";
import {roleMiddleware, setRoleMiddleware} from "./utils/roleMiddleware";
import {PrismaClient} from "@prisma/client";

export class Bot {
    private bot: Telegraf<Context>;
    private adminIds: string[];
    private Commands: Command[] = [];

    constructor() {
        const token = process.env.TELEGRAM_TOKEN;

        if (!token) {
            throw new Error("Bot token is missing in environment variables");
        }

        this.bot = new Telegraf(token);
        
        Command.setBotInstance(this.bot);
        Command.initializeConfig();
        this.adminIds = (process.env.ADMIN_IDS || "").split(",");

        Logger.info("Bot is initializing...");
        this.loadCommands(path.join(__dirname, "commands"), this.Commands);
    }

    public start() {
        Logger.info("Bot is now running...");

        this.bot.use(setRoleMiddleware);


        this.bot.on("callback_query", (ctx) => {
            Logger.debug(
                `User ${ctx.from?.id} clicked a button with data: ${JSON.stringify(
                    ctx.callbackQuery?.from,
                    null,
                    2
                )}`
            );
        });

        this.bot.launch();
        Logger.info("Bot has been launched successfully!");
    }

    private loadCommands(directory: string, commandsArray: Command[]) {
        if (!fs.existsSync(directory)) {
            Logger.warn(`Directory not found: ${directory}`);
            return;
        }

        const files = fs.readdirSync(directory);
        files.forEach((file) => {
            const commandPath = path.join(directory, file);

            if (fs.lstatSync(commandPath).isFile() && file.endsWith(".ts")) {
                try {
                    const commandModule = require(commandPath).default;
                    if (commandModule.getName && commandModule.execute) {
                        this.bot.command(commandModule.getName(), async (ctx) => {
                            await commandModule.execute(ctx);
                        });
                    }
                    if (commandModule && typeof commandModule.getName === "function") {
                        commandsArray.push(commandModule);

                        // Count the subcommands
                        const subCommandCount = commandModule["subs"]?.length || 0;

                        Logger.info(
                            `Loaded command: ${commandModule.getName()}, Loaded Subcommand Count: ${subCommandCount}`
                        );
                    } else {
                        Logger.error(
                            `Failed to load command from ${file}: missing getName function.`
                        );
                    }
                } catch (error) {
                    Logger.error(`Failed to load command from ${file}: ${error}`);
                }
            }
        });
    }


    private handleError(ctx: Context, error: any) {
        Logger.error(`Unhandled error: ${error.message}`);
        ctx.reply("❌ An unexpected error occurred. Please try again later.");
    }
}
