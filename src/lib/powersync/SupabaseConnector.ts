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
      // Silently return null if no session (expected when auth is disabled)
      return null;
    }
    const session = data.session;
    if (!session) {
      // Silently return null if no session (expected when auth is disabled)
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
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No active session for sync upload');
      }

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ batch: transaction.crud }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync API error: ${response.status} ${errorText}`);
      }

      await transaction.complete();
    } catch (e) {
      console.error('Error uploading data:', e);
      // Transaction is NOT completed, so it will retry later
    }
  }
}

export default SupabaseConnector;