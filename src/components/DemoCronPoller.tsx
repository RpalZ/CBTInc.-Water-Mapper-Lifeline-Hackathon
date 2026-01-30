'use client';

import { useEffect, useRef } from 'react';

const CRON_INTERVAL_MS = 120 * 1000; // 10 seconds for fast demo

export function DemoCronPoller() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Define the polling function
    const triggerCron = async () => {
      try {
        console.log('[DemoCronPoller] Triggering cron job...');
        const res = await fetch('/api/cron', {
          method: 'POST',
        });
        
        if (res.ok) {
            const data = await res.json();
            console.log('[DemoCronPoller] Cron job success:', data);
            // Dispatch event so LifelineMap knows to refresh immediately
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('water-mapper:data-updated'));
            }
        } else {
            console.error('[DemoCronPoller] Cron job failed:', res.statusText);
        }
      } catch (error) {
        console.error('[DemoCronPoller] Cron job error:', error);
      }
    };

    // Run immediately on mount (optional, maybe wait for interval? 
    // User said "start per 1 minute", usually implies interval. 
    // Let's run it once on mount too so they see it works immediately.)
    triggerCron();

    // Set up the interval
    intervalRef.current = setInterval(() => {
        console.log('[DemoCronPoller] ⏱️ Interval tick');
        triggerCron();
    }, CRON_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return null; // This component renders nothing
}
