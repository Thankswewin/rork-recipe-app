import { initTRPC } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { supabase } from '@/lib/supabase';

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get('authorization');
  
  let user = null;
  if (authHeader) {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!error && authUser) {
        user = authUser;
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  return {
    user,
  };
};

const t = initTRPC.context<typeof createContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});