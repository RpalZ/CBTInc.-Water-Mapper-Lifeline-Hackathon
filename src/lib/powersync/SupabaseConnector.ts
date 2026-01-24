import { PowerSyncDatabase, AbstractPowerSyncDatabase } from '@powersync/web';
import { SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string;

// The PowerSync instance URL from your PowerSync project dashboard
const POWERSYNC_URL = process.env.NEXT_PUBLIC_POWERSYNC_URL as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !POWERSYNC_URL) {
  throw new Error('Missing Supabase or PowerSync environment variables');
}

class SupabaseConnector {
  private powerSync: PowerSyncDatabase;
  private supabase: SupabaseClient;

  constructor(powerSync: PowerSyncDatabase) {
    this.powerSync = powerSync;
    this.supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  async fetchCredentials() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    const session = data.session;
    if (!session) {
      console.error('No active session found');
      return null;
    }

    // Use the Supabase access token directly
    return {
      endpoint: POWERSYNC_URL,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    try {
      // This part remains the same. You still need the RPC function.
      const { error } = await this.supabase.rpc('powersync_write_data', {
        data: transaction.crud
      });

      if (error) {
        throw new Error(JSON.stringify(error));
      }

      await transaction.complete();
    } catch (e) {
      console.error('Error uploading data:', e);
      // Potentially handle retry logic here
    }
  }
}

export default SupabaseConnector;