import { PowerSyncDatabase, AbstractPowerSyncDatabase } from '@powersync/web';
import { SupabaseClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

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
    const token = data.session?.access_token;
    if (!token) {
      console.error('No access token found');
      return null;
    }

    // Replace with your PowerSync instance URL
    const powerSyncUrl = 'YOUR_POWERSYNC_INSTANCE_URL';
    const response = await fetch(powerSyncUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Error fetching PowerSync credentials:', await response.text());
      return null;
    }

    const { endpoint, token: psToken } = await response.json();
    return {
      endpoint,
      token: psToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60) // Assume token expires in 1 hour
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) {
      return;
    }

    try {
      // Create a single Supabase transaction
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
