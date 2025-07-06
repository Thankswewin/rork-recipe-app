import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getConversationsProcedure } from "./routes/conversations/get-conversations/route";
import { createConversationProcedure } from "./routes/conversations/create-conversation/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  conversations: createTRPCRouter({
    getConversations: getConversationsProcedure,
    createConversation: createConversationProcedure,
  }),
});

export type AppRouter = typeof appRouter;