'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const statCards = [
    { label: t.analytics.totalSites, value: '—' },
    { label: t.analytics.activeProjects, value: '—' },
    { label: t.analytics.dataPoints, value: '—' },
    { label: t.analytics.lastUpdated, value: '—' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-primary mb-2">
          {t.analytics.title}
        </h1>
        <p className="text-secondary">
          {t.analytics.description}
        </p>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-primary border border-color rounded-lg p-12">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-muted mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-primary mb-2">
            {t.analytics.comingSoon}
          </h2>
          <p className="text-secondary max-w-md mx-auto">
            {t.analytics.comingSoonDescription}
          </p>
        </div>
      </div>

      {/* Placeholder Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-primary border border-color rounded-lg p-6"
          >
            <h3 className="text-sm font-medium text-secondary mb-2">
              {stat.label}
            </h3>
            <p className="text-2xl font-semibold text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
