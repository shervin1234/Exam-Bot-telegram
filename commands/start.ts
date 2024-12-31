import {Context, Telegraf} from "telegraf";
import {Command, ensureValidUserId} from "../handlers/CommandFactory";

export default new Command("start")
    .setHandler(async (ctx: Context , bot?: Telegraf<Context>): Promise<void> => {
        try {
            await ensureValidUserId(ctx);
            await ctx.reply("test")
        } catch (error) {
            console.error("Error in start command:", error);
            await ctx.reply("❌ An error occurred while processing your request. Please try again later.");
        }
    });