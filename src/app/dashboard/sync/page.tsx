'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

// Placeholder sync status - will be replaced with PowerSync status later
type SyncStatus = 'online' | 'offline' | 'syncing';

export default function SyncPage() {
  const { t } = useLanguage();
  // Mock status - will be replaced with real PowerSync status
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');

  const statusConfig = {
    online: {
      label: t.sync.online,
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      description: t.sync.onlineDescription,
      connectionStatus: t.sync.connected,
    },
    offline: {
      label: t.sync.offline,
      color: 'bg-gray-400',
      textColor: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/50',
      borderColor: 'border-gray-200 dark:border-gray-800',
      description: t.sync.offlineDescription,
      connectionStatus: t.sync.disconnected,
    },
    syncing: {
      label: t.sync.syncing,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      description: t.sync.syncingDescription,
      connectionStatus: t.sync.synchronizing,
    },
  };

  const currentStatus = statusConfig[syncStatus];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary mb-2">
          {t.sync.title}
        </h1>
        <p className="text-secondary">
          {t.sync.description}
        </p>
      </div>

      {/* Sync Status Panel */}
      <div
        className={`bg-primary border ${currentStatus.borderColor} rounded-lg p-8 mb-8`}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-4 h-4 ${currentStatus.color} rounded-full`}></div>
          <h2 className="text-xl font-semibold text-primary">
            {t.sync.currentStatus} {currentStatus.label}
          </h2>
        </div>

        <p className={`text-sm ${currentStatus.textColor} mb-6`}>
          {currentStatus.description}
        </p>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 ${currentStatus.color} rounded-full ${
              syncStatus === 'syncing' ? 'animate-pulse' : ''
            }`}
          ></div>
          <span className="text-sm text-secondary">
            {currentStatus.connectionStatus}
          </span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-primary border border-color rounded-lg p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          {t.sync.aboutSyncStatus}
        </h2>
        <div className="space-y-3 text-secondary">
          <p>
            {t.sync.aboutSyncDescription1}
          </p>
          <p>
            {t.sync.aboutSyncDescription2}
          </p>
          <p className="text-sm text-muted mt-4">
            {t.sync.aboutSyncNote}
          </p>
        </div>
      </div>

      {/* Placeholder: Status Toggle for Demo (Remove in production) */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
          {t.sync.demoToggleLabel}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSyncStatus('online')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              syncStatus === 'online'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t.sync.online}
          </button>
          <button
            onClick={() => setSyncStatus('offline')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              syncStatus === 'offline'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t.sync.offline}
          </button>
          <button
            onClick={() => setSyncStatus('syncing')}
            className={`px-3 py-1.5 text-sm rounded-md ${
              syncStatus === 'syncing'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t.sync.syncing}
          </button>
        </div>
      </div>
    </div>
  );
}
