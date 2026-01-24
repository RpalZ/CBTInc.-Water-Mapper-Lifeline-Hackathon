'use client';

import { PowerSyncDatabase } from '@powersync/web';
import { PowerSyncContext } from '@powersync/react';
import { AppSchema } from './schema';
import { PropsWithChildren, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SupabaseConnector from './SupabaseConnector';

const powerSync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'powersync.db'
  }
});

const PowerSyncProvider = ({ children }: PropsWithChildren) => {
  const [_, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const connector = new SupabaseConnector(powerSync);
      await powerSync.connect(connector);
      setReady(true);
    };

    init();
  }, []);

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