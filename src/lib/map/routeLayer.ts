/**
 * MapLibre Route Layer Helpers
 * 
 * Provides utilities to initialize and manage route visualization on MapLibre maps.
 * Handles GeoJSON source creation, layer styling, and dynamic updates.
 */

import maplibregl from 'maplibre-gl';
import { RouteResponse } from '@/lib/routing/osrm';

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';
const ROUTE_START_LAYER_ID = 'route-start';
const ROUTE_END_LAYER_ID = 'route-end';

/**
 * Initialize route layers on the map
 * Creates:
 * - GeoJSON source for route geometries
 * - Line layer for the route path
 * - Point layers for start/end markers
 * 
 * Must be called after map.on('load') event
 */
export function initRouteLayer(map: maplibregl.Map): void {
  if (map.getSource(ROUTE_SOURCE_ID)) {
    console.warn('Route source already initialized');
    return;
  }

  // Create empty GeoJSON source
  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  // Route line layer - clean blue with rounded caps and joins
  map.addLayer(
    {
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': '#3b82f6', // Vibrant blue
        'line-width': 4,
        'line-opacity': 0.8,
      },
    },
    'roads' // Insert before roads layer for better visibility
  );

  // Start point marker layer
  map.addLayer(
    {
      id: ROUTE_START_LAYER_ID,
      type: 'circle',
      source: ROUTE_SOURCE_ID,
      filter: ['==', ['get', 'type'], 'start'],
      paint: {
        'circle-radius': 8,
        'circle-color': '#10b981', // Green
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    },
    'roads'
  );

  // End point marker layer
  map.addLayer(
    {
      id: ROUTE_END_LAYER_ID,
      type: 'circle',
      source: ROUTE_SOURCE_ID,
      filter: ['==', ['get', 'type'], 'end'],
      paint: {
        'circle-radius': 8,
        'circle-color': '#ef4444', // Red
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    },
    'roads'
  );
}

/**
 * Update the route display with new route data
 * 
 * @param map - MapLibre map instance
 * @param route - Route data from OSRM API
 * @param startCoord - Start point [lng, lat]
 * @param endCoord - End point [lng, lat]
 */
export function updateRoute(
  map: maplibregl.Map,
  route: RouteResponse,
  startCoord: [number, number],
  endCoord: [number, number]
): void {
  try {
    const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

    if (!source) {
      console.error('Route source not found. Call initRouteLayer first.');
      return;
    }

    // Validate route geometry with detailed logging
    console.log('Route object:', route);
    console.log('Route geometry:', route?.geometry);
    console.log('Route coordinates:', route?.geometry?.coordinates);
    console.log('Coordinates is array?', Array.isArray(route?.geometry?.coordinates));
    
    if (!route?.geometry) {
      console.error('Route has no geometry:', route);
      return;
    }

    if (!Array.isArray(route.geometry.coordinates)) {
      console.error('Invalid route geometry - coordinates not an array:', route.geometry);
      return;
    }

    if (route.geometry.coordinates.length === 0) {
      console.error('Route has no coordinates');
      return;
    }

    // Create feature collection with route line and endpoints
    const features = [
      // Route line
      route,
      // Start point
      {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: startCoord,
        },
        properties: {
          type: 'start',
        },
      },
      // End point
      {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: endCoord,
        },
        properties: {
          type: 'end',
        },
      },
    ];

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
    };

    console.log('Setting GeoJSON data:', geojson);
    source.setData(geojson);

    // Optionally fit map to route bounds
    fitMapToRoute(map, route);
  } catch (error) {
    console.error('Error updating route:', error);
  }
}

/**
 * Fit map viewport to show the entire route
 */
function fitMapToRoute(map: maplibregl.Map, route: RouteResponse): void {
  if (
    route.geometry.type !== 'LineString' ||
    !route.geometry.coordinates ||
    route.geometry.coordinates.length === 0
  ) {
    return;
  }

  const coordinates = route.geometry.coordinates;
  const bounds = coordinates.reduce(
    (bounds, coord) => {
      return bounds.extend(coord as [number, number]);
    },
    new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
  );

  map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
}

/**
 * Clear the route display
 */
export function clearRoute(map: maplibregl.Map): void {
  const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

  if (source) {
    source.setData({
      type: 'FeatureCollection' as const,
      features: [],
    });
  }
}
