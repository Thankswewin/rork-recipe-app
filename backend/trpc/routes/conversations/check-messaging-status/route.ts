import { protectedProcedure } from '../../../create-context';
import { supabase } from '@/lib/supabase';

export const checkMessagingStatusProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    try {
      // Test if messaging tables exist and are accessible
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Messaging tables do not exist. Please run the database setup script.');
        }
        if (error.code === '42P17') {
          throw new Error('Database policies have infinite recursion. Please run the database fix script.');
        }
        throw new Error(`Database error: ${error.message}`);
      }

      return { success: true, message: 'Messaging system is working correctly' };
    } catch (error: any) {
      console.error('Error checking messaging system:', error);
      throw new Error(`Messaging system check failed: ${error.message || 'Unknown error'}`);
    }
  });