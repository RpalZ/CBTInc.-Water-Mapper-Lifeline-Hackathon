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
    <header className="sticky top-0 z-10 bg-primary border-b border-color">
      <div className="flex items-center justify-end px-6 py-4">
        <button
          onClick={handleLogout}
          className="px-4 py-2 btn-danger font-medium rounded-md transition-colors btn-focus focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
