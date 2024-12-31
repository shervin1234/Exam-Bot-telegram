import {Telegraf, Context} from "telegraf";
import {Command} from "../handlers/CommandFactory";

export default new Command("test")
    .setHandler(async (ctx: Context, bot?: Telegraf<Context>, args?: string[]) => {
        await ctx.reply(`test command executed! ${args}`);
    });
