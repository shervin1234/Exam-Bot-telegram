import type { MiddlewareFn } from "telegraf";
import type { Context } from "telegraf";
import { accessControl } from "./accessControl";

interface MyContext extends Context {
  state: {
    role?: "admin" | "member" | "all";
  };
}

export const setRoleMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  const userId = ctx.from?.id;

  const roleMap: { [key: number]: "admin" | "member" } = {
    5366412848: "admin",
    987654321: "member",
  };

  ctx.state.role = roleMap[userId!] || "all";
  return next();
};

export const roleMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  const role: "admin" | "member" | "all" = ctx.state.role || "all";

  if (!ctx.text) {
    return next();
  }

  const commandName = ctx.text.split(" ")[0].substring(1);

  if (!accessControl.hasAccess(role, commandName)) {
    await ctx.reply("❌ You do not have permission to use this command.");
    return;
  }

  return next();
};
