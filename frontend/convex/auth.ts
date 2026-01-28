import { mutation } from "./_generated/server";

export const login = mutation({
  handler: async (_ctx, _args: {}) => {
    // Ваша логика авторизации
    return { userId: "user-" + Math.random().toString(36).substring(2) };
  },
});