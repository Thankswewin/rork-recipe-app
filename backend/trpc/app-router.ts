import { router } from './create-context';
import hiProcedure from './routes/example/hi/route';
import { kyutaiTTSProcedure, kyutaiHealthProcedure } from './routes/kyutai/tts/route';

export const appRouter = router({
  example: router({
    hi: hiProcedure,
  }),
  kyutai: router({
    tts: kyutaiTTSProcedure,
    health: kyutaiHealthProcedure,
  }),
});

export type AppRouter = typeof appRouter;