'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Demand chart data
const DEMAND_CHART_DATA = [
  { community: 'Khartoum North', demand: 7500 },
  { community: 'Port Sudan East', demand: 9200 },
  { community: 'El Obeid Central', demand: 4800 },
  { community: 'Nyala West', demand: 6100 },
  { community: 'Kassala South', demand: 8300 },
  { community: 'Dongola Village', demand: 2900 },
  { community: 'Wad Madani Hub', demand: 5400 },
  { community: 'Al Fashir Outskirts', demand: 9700 },
  { community: 'Sennar District', demand: 1200 },
  { community: 'Atbara Riverside', demand: 6800 },
  { community: 'Damazin Plains', demand: 4100 },
  { community: 'Kosti Lakeside', demand: 8500 },
  { community: 'Gedaref Farms', demand: 3300 },
  { community: 'Kadugli Hills', demand: 7600 },
  { community: 'Geneina Oasis', demand: 1900 },
  { community: 'Khartoum South', demand: 5700 },
  { community: 'Port Sudan West', demand: 8800 },
  { community: 'El Obeid Suburbs', demand: 2500 },
  { community: 'Nyala Central', demand: 7200 },
  { community: 'Kassala Markets', demand: 4600 },
  { community: 'Dongola Desert', demand: 9300 },
  { community: 'Wad Madani Fields', demand: 1400 },
  { community: 'Al Fashir Nomads', demand: 6500 },
  { community: 'Sennar Rivers', demand: 3800 },
  { community: 'Atbara Mines', demand: 7900 },
  { community: 'Damazin Forests', demand: 2100 },
  { community: 'Kosti Docks', demand: 5600 },
  { community: 'Gedaref Borders', demand: 8400 },
];

// Helper function for color coding
const getDemandColor = (demand: number) => {
  if (demand > 5000) return '#ef4444'; // Red for urgent
  if (demand > 2000) return '#f97316'; // Orange for medium
  return '#22c55e'; // Green for low
};

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const statCards = [
    { label: 'Number of Communities', value: '39' },
    { label: 'Online Modules', value: '12' },
    { label: 'Working Trucks', value: '8' },
    { label: 'Last Updated', value: '3 hours' },
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

      {/* Demand Chart Section */}
      <div className="bg-primary border border-color rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-primary mb-4">
          📊 Community Demand Analysis
        </h2>
        <p className="text-secondary mb-6">
          Bar chart showing daily water demand per community, color-coded by urgency: 
          <span className="text-red-500 font-semibold">Red (High &gt;5000L)</span>, 
          <span className="text-orange-500 font-semibold">Orange (Medium 2000-5000L)</span>, 
          <span className="text-green-500 font-semibold">Green (Low &lt;2000L)</span>.
        </p>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={DEMAND_CHART_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="community" 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              fontSize={12} 
              stroke="#6b7280" 
            />
            <YAxis 
              label={{ value: 'Demand (Liters)', angle: -90, position: 'insideLeft' }} 
              fontSize={12} 
              stroke="#6b7280" 
            />
            <Tooltip 
              formatter={(value) => [`${value} L`, 'Demand']} 
              labelStyle={{ color: '#374151' }} 
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db' }} 
            />
            <Bar dataKey="demand" radius={[4, 4, 0, 0]}>
              {DEMAND_CHART_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getDemandColor(entry.demand)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
