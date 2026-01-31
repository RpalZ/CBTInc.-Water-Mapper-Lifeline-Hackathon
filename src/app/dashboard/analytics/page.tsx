'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

// Helper function for color coding
const getDemandColor = (demand: number) => {
  if (demand > 5000) return '#ef4444'; // Red for urgent
  if (demand > 2000) return '#f97316'; // Orange for medium
  return '#22c55e'; // Green for low
};

export default function AnalyticsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<{ community: string; demand: number }[]>([]);
  const [stats, setStats] = useState({
    totalCommunities: 0,
    totalDemand: 0,
    avgDemand: 0,
    highRiskCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
        const { data: locations, error } = await supabase
            .from('location')
            .select('name, label, water_demand_daily')
            .eq('label', 'community')
            .order('water_demand_daily', { ascending: false }); // Show highest demand first

        if (locations && !error) {
            const chartData = locations.map(l => ({
                community: l.name || 'Unknown',
                demand: Math.round(l.water_demand_daily || 0)
            })).filter(d => d.demand > 0);

            setData(chartData);

            // Calculate aggregate stats
            setStats({
                totalCommunities: locations.length,
                totalDemand: chartData.reduce((acc, curr) => acc + curr.demand, 0),
                avgDemand: Math.round(chartData.reduce((acc, curr) => acc + curr.demand, 0) / (chartData.length || 1)),
                highRiskCount: chartData.filter(d => d.demand > 5000).length
            });
        }
    };

    fetchData();
    // Subscribe to realtime updates for live analytics
    const channel = supabase.channel('analytics-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'location' }, fetchData)
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statCards = [
    { label: 'Monitored Communities', value: stats.totalCommunities.toLocaleString() },
    { label: 'Total Daily Demand (L)', value: stats.totalDemand.toLocaleString() },
    { label: 'Avg. Community Demand', value: `${stats.avgDemand.toLocaleString()} L` },
    { label: 'High Risk Areas (>5k L)', value: stats.highRiskCount.toString() },
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
          Live data showing daily water demand per community, color-coded by urgency: 
          <span className="text-red-500 font-semibold ml-1">Red (High &gt;5000L)</span>, 
          <span className="text-orange-500 font-semibold ml-1">Orange (Medium 2000-5000L)</span>, 
          <span className="text-green-500 font-semibold ml-1">Green (Low &lt;2000L)</span>.
        </p>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getDemandColor(entry.demand)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-primary border border-color rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-medium text-secondary mb-2 uppercase tracking-wider">
              {stat.label}
            </h3>
            <p className="text-2xl font-bold text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
