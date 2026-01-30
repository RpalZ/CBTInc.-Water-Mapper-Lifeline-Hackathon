'use client';

import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { DemoCronPoller } from '@/components/DemoCronPoller';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <DemoCronPoller />
      <div className="flex h-screen bg-secondary">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
