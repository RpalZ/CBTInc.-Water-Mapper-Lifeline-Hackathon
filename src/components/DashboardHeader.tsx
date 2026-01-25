'use client';

import { useRouter } from 'next/navigation';

export function DashboardHeader() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear any stored data if needed
    // For now, just redirect to login
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-end px-6 py-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
