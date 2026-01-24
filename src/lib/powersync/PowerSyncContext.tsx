'use client';

import { PowerSyncDatabase } from '@powersync/web';
import { PowerSyncContext } from '@powersync/react';
import { AppSchema } from './schema';
import { PropsWithChildren, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SupabaseConnector from './SupabaseConnector';

const PowerSyncProvider = ({ children }: PropsWithChildren) => {
  const [powerSync, setPowerSync] = useState<PowerSyncDatabase | null>(null);

  useEffect(() => {
    const init = async () => {
      const db = new PowerSyncDatabase({
        schema: AppSchema,
        database: {
          dbFilename: 'powersync.db'
        }
      });
      const connector = new SupabaseConnector(db);
      await db.connect(connector);
      setPowerSync(db);
    };

    init();
  }, []);

  if (!powerSync) {
    return <div>Loading...</div>;
  }

  return (
    <PowerSyncContext.Provider value={powerSync}>
      {children}
    </PowerSyncContext.Provider>
  );
};

export const PowerSyncProviderWithHydration = dynamic(
  () => Promise.resolve(PowerSyncProvider),
  {
    ssr: false,
    loading: () => <div>Loading...</div>
  }
);