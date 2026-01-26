/**
 * OSRM Routing Service
 * 
 * Uses the public OSRM API (router.project-osrm.org) to calculate routes.
 * Returns GeoJSON Feature with geometry, distance, and duration.
 */

export interface Coordinate {
  lng: number;
  lat: number;
}

export interface RouteResponse {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: {
    distance: number; // meters
    duration: number; // seconds
  };
}

/**
 * Fetch a route from OSRM between two coordinates
 * Uses the public OSRM API at router.project-osrm.org
 * 
 * @param start - Starting coordinate {lng, lat}
 * @param end - Ending coordinate {lng, lat}
 * @returns GeoJSON Feature with route geometry and metadata
 * @throws Error if API call fails or returns invalid response
 */
export async function fetchRoute(
  start: Coordinate,
  end: Coordinate
): Promise<RouteResponse> {
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`;

  const params = new URLSearchParams({
    overview: 'full', // Include full geometry as array
    geometries: 'geojson', // Return as GeoJSON coordinates (array)
    steps: 'false', // Don't include turn-by-turn steps (faster)
    annotations: 'distance,duration', // Include segment metadata
  });

  try {
    console.log('Fetching route from:', url);
    const response = await fetch(`${url}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OSRM API response:', data);

    // OSRM returns multiple routes; we take the first (best) one
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found between the specified coordinates');
    }

    const route = data.routes[0];
    console.log('Selected route:', route);
    console.log('Route geometry type:', route.geometry?.type);
    console.log('Route coordinates type:', typeof route.geometry?.coordinates);
    console.log('Route coordinates:', route.geometry?.coordinates);

    // Validate that we have valid coordinates
    if (!route.geometry || !route.geometry.coordinates) {
      throw new Error('Route geometry is missing coordinates');
    }

    // If coordinates are a string (polyline), we need to handle that
    if (typeof route.geometry.coordinates === 'string') {
      console.warn('Coordinates are encoded as string (polyline), requesting as GeoJSON instead');
      // This shouldn't happen with geometries=geojson, but if it does, throw error
      throw new Error('Received encoded coordinates; ensure geometries=geojson parameter is set');
    }

    if (!Array.isArray(route.geometry.coordinates)) {
      console.error('Coordinates is not an array:', route.geometry.coordinates);
      throw new Error('Route coordinates are not in array format');
    }

    const result: RouteResponse = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: route.geometry.coordinates,
      },
      properties: {
        distance: route.distance, // meters
        duration: route.duration, // seconds
      },
    };
    
    console.log('Returning RouteResponse:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch route from OSRM:', error);
    throw error;
  }
}
