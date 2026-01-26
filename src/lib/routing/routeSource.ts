/**
 * Route Source Module
 * 
 * Provides start and end coordinates for routing.
 * Currently uses hardcoded values and user geolocation.
 * 
 * TODO: Replace with database queries (PowerSync / Supabase) when available:
 * - Fetch start coordinate from a selected emergency response point
 * - Fetch end coordinate from a water crisis location (from water_readings table)
 * - Use user preferences or real-time selections
 */

import { Coordinate } from './osrm';

/**
 * Get the route endpoints (start and end coordinates)
 * 
 * FUTURE: This function should be updated to fetch from:
 * - PowerSync: SELECT * FROM emergency_points WHERE id = ?
 * - PowerSync: SELECT * FROM water_crisis_locations WHERE id = ?
 * 
 * For now, returns hardcoded Doha coordinates with option for user location
 */
export async function getRouteEndpoints(): Promise<{
  start: Coordinate;
  end: Coordinate;
}> {
  try {
    // Try to get user's current location
    const userLocation = await getUserLocation();
    if (userLocation) {
      return {
        start: userLocation,
        // End point: Example water crisis location in Doha (Lusail)
        end: { lng: 51.503, lat: 25.278 },
      };
    }
  } catch (error) {
    console.warn('Could not get user location, using defaults:', error);
  }

  // Fallback: Use hardcoded Doha emergency response center and water crisis location
  return {
    // Doha Emergency Services (approximate)
    start: { lng: 51.532, lat: 25.316 },
    // Lusail (water crisis example)
    end: { lng: 51.503, lat: 25.278 },
  };
}

/**
 * Attempt to get user's current geolocation via browser Geolocation API
 * 
 * @returns User coordinate or null if permission denied or unavailable
 */
async function getUserLocation(): Promise<Coordinate | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not available');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      { timeout: 5000, maximumAge: 60000 } // 5s timeout, cache 1 min
    );
  });
}

/**
 * Override route endpoints (useful for testing or user selection)
 * 
 * FUTURE: This could be replaced with a UI component that lets users select
 * start/end points from database records
 */
export function setRouteEndpoints(start: Coordinate, end: Coordinate): void {
  // In a real app, this could store in local state or React context
  (window as any).__routeOverride = { start, end };
}

/**
 * Check if custom endpoints have been set
 */
export function getOverrideEndpoints(): { start: Coordinate; end: Coordinate } | null {
  return (window as any).__routeOverride || null;
}
