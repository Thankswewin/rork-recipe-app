import { router } from './create-context';
import { hiProcedure } from './routes/example/hi/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
});

export type AppRouter = typeof appRouter;