import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { getConversationsProcedure } from "./routes/conversations/get-conversations/route";
import { createConversationProcedure } from "./routes/conversations/create-conversation/route";
import { setupMessagingProcedure } from "./routes/conversations/setup-messaging/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  conversations: createTRPCRouter({
    getConversations: getConversationsProcedure,
    createConversation: createConversationProcedure,
    setupMessaging: setupMessagingProcedure,
  }),
});

export type AppRouter = typeof appRouter;