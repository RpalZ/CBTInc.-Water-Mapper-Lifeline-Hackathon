'use client';

import { PowerSyncDatabase, PowerSyncContext } from '@powersync/react';
import { AppSchema } from './schema';
import { PropsWithChildren } from 'react';
import dynamic from 'next/dynamic';

const PowerSyncProvider = ({ children }: PropsWithChildren) => {
  const powerSync = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbName: 'powersync.db'
    }
  });

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