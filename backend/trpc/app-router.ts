import { router } from './create-context';
import { hiProcedure } from './routes/example/hi/route';
import { createConversationProcedure } from './routes/conversations/create-conversation/route';
import { getConversationsProcedure } from './routes/conversations/get-conversations/route';
import { checkMessagingStatusProcedure } from './routes/conversations/check-messaging-status/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  conversations: router({
    createConversation: createConversationProcedure,
    getConversations: getConversationsProcedure,
    checkMessagingStatus: checkMessagingStatusProcedure,
  }),
});

export type AppRouter = typeof appRouter;