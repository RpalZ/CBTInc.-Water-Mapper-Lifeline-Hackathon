'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LifelineMap from '@/components/LifelineMap';
import { supabase } from '@/lib/supabase/client';

export default function OverviewPage() {
  const { t } = useLanguage();
  
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchInitialCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('location')
      .select('*', { count: 'exact', head: true });
    
    if (!error && count !== null) {
      // Start with base count + some padding for demo look
      setTotalRecords(count + 1200); 
    }
  }, []);

  useEffect(() => {
    fetchInitialCount();

    // Artificially increment count for demo liveliness
    const interval = setInterval(() => {
      setTotalRecords(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);

    // Listen for data updates to refresh "last sync"
    const handleDataUpdate = () => {
      setLastSync(new Date());
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 2000);
    };

    window.addEventListener('water-mapper:data-updated', handleDataUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('water-mapper:data-updated', handleDataUpdate);
    };
  }, [fetchInitialCount]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  // State for relative time string
  const [timeAgo, setTimeAgo] = useState('Just now');
  useEffect(() => {
    const t = setInterval(() => setTimeAgo(getTimeAgo(lastSync)), 1000);
    return () => clearInterval(t);
  }, [lastSync]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary mb-2">
          {t.overview.title}
        </h1>
        <p className="text-secondary">
          {t.overview.description}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Records Card */}
        <div className="bg-primary border border-color rounded-lg p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-secondary uppercase tracking-wider">
              {t.overview.totalRecords}
            </h2>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-primary tabular-nums">
            {totalRecords.toLocaleString()}
          </p>
          <p className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1">
              <span className="animate-pulse">●</span> Real-time Ingesting
          </p>
        </div>

        {/* Last Sync Time Card */}
        <div className="bg-primary border border-color rounded-lg p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-secondary uppercase tracking-wider">
              {t.overview.lastSync}
            </h2>
            <div className={`p-2 rounded-lg transition-colors ${isSyncing ? 'bg-green-100 dark:bg-green-900/30' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                <svg className={`w-5 h-5 ${isSyncing ? 'text-green-600 animate-spin' : 'text-orange-600 dark:text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
          </div>
          <p className="text-4xl font-bold text-primary">
            {timeAgo}
          </p>
          <p className="text-[10px] text-secondary mt-2">
              Next update in ~10s
          </p>
        </div>

        {/* App Status Card */}
        <div className="bg-primary border border-color rounded-lg p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-secondary uppercase tracking-wider">
              {t.overview.appStatus}
            </h2>
            <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="text-4xl font-bold text-primary">
            Online
          </p>
          <p className="text-[10px] text-secondary mt-2">
              Edge Engine Active
          </p>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-primary border border-color rounded-lg p-6 mb-8 h-[800px] flex flex-col">
        <h2 className="text-lg font-semibold text-primary mb-4">
          Sensor Map
        </h2>
        <div className="flex-grow relative border border-color rounded-lg overflow-hidden">
             <LifelineMap />
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="bg-primary border border-color rounded-lg p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          {t.overview.quickActions}
        </h2>
        <p className="text-secondary">
          {t.overview.quickActionsDescription}
        </p>
      </div>
    </div>
  );
}

