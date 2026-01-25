'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function OverviewPage() {
  const { t } = useLanguage();
  
  // Mock data - placeholder values
  const mockData = {
    totalRecords: 1247,
    lastSyncTime: '2 minutes ago',
    appStatus: 'Online',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
          {t.overview.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.overview.description}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Records Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.overview.totalRecords}
            </h2>
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {mockData.totalRecords.toLocaleString()}
          </p>
        </div>

        {/* Last Sync Time Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.overview.lastSync}
            </h2>
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {mockData.lastSyncTime}
          </p>
        </div>

        {/* App Status Card */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t.overview.appStatus}
            </h2>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-gray-50">
            {mockData.appStatus}
          </p>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
          {t.overview.quickActions}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t.overview.quickActionsDescription}
        </p>
      </div>
    </div>
  );
}
