'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LifelineMap from '@/components/LifelineMap';

export default function OverviewPage() {
  const { t } = useLanguage();
  
  // Mock data - placeholder values
  const mockData = {
    totalRecords: 1247,
    lastSyncTime: '2 minutes ago',
    appStatus: 'Online',
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      // --- Mock data for the routing request (similar to what mock_data_generator.py would produce) ---
      const mockRoutingRequest = {
        locations: [
          { "id": "depot", "lat": 15.5007, "lon": 32.5596, "demand": 0, "optional_visit": false },
          { "id": "customer_1", "lat": 15.5257, "lon": 32.5846, "demand": 250, "optional_visit": false },
          { "id": "customer_2", "lat": 15.4757, "lon": 32.5346, "demand": 150, "optional_visit": true, "drop_penalty": 15000 },
          { "id": "customer_3", "lat": 15.5107, "lon": 32.5000, "demand": 200, "optional_visit": false },
          { "id": "customer_4", "lat": 15.4800, "lon": 32.5700, "demand": 100, "optional_visit": true, "drop_penalty": 10000 }
        ],
        num_vehicles: 2,
        depot_index: 0,
        max_distance_meters: 60000 // 60km max route for each vehicle
      };

      try {
        const response = await fetch('/api/routing/solve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockRoutingRequest),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching routes:', errorData);
          return;
        }

        const data = await response.json();
        console.log('Optimized Routes from OR-Tools:', data);

      } catch (error) {
        console.error('Failed to fetch routes:', error);
      }
    };

    fetchRoutes();
  }, []); // Run once on component mount

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
        <div className="bg-primary border border-color rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-secondary">
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
          <p className="text-3xl font-semibold text-primary">
            {mockData.totalRecords.toLocaleString()}
          </p>
        </div>

        {/* Last Sync Time Card */}
        <div className="bg-primary border border-color rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-secondary">
              {t.overview.lastSync}
            </h2>
            <svg
              className="w-5 h-5 text-muted"
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
          <p className="text-3xl font-semibold text-primary">
            {mockData.lastSyncTime}
          </p>
        </div>

        {/* App Status Card */}
        <div className="bg-primary border border-color rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-secondary">
              {t.overview.appStatus}
            </h2>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <p className="text-3xl font-semibold text-primary">
            {mockData.appStatus}
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

