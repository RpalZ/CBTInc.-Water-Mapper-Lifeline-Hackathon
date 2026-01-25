'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard/overview', label: t.sidebar.overview },
    { href: '/dashboard/analytics', label: t.sidebar.analytics },
    { href: '/dashboard/sync', label: t.sidebar.syncStatus },
  ];

  return (
    <aside className="w-64 bg-primary border-r border-color flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-color">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-primary">
            {t.sidebar.title}
          </h1>
          <LanguageSelector />
        </div>
        <p className="text-sm text-secondary">
          {t.sidebar.subtitle}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-4 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'btn-primary text-white'
                      : 'text-secondary hover-bg'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer with theme toggle */}
      <div className="p-4 border-t border-color">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
