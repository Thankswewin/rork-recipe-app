import { router } from './create-context';
import hiProcedure from './routes/example/hi/route';
import { kyutaiTTSProcedure } from './routes/kyutai/tts/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  kyutai: router({
    tts: kyutaiTTSProcedure,
  }),
});

export type AppRouter = typeof appRouter;