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
export function initRouteLayer(map: maplibregl.Map) {
  // Define a set of colors for different vehicles
  const routeColors = ['#3b82f6', '#16a34a', '#f97316', '#9333ea', '#e11d48'];

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  // Layer for the route lines
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    paint: {
      // Style lines based on the 'vehicle_id' property
      'line-color': [
        'case',
        ['==', ['get', 'vehicle_id'], 0], routeColors[0],
        ['==', ['get', 'vehicle_id'], 1], routeColors[1],
        ['==', ['get', 'vehicle_id'], 2], routeColors[2],
        ['==', ['get', 'vehicle_id'], 3], routeColors[3],
        ['==', ['get', 'vehicle_id'], 4], routeColors[4],
        '#000000' // Default color if vehicle_id is not matched
      ],
      'line-width': 4,
      'line-opacity': 0.8,
    },
  });

  // Layer for start points (depot)
  map.addLayer({
    id: 'route-start',
    type: 'circle',
    source: 'route',
    filter: ['==', ['get', 'type'], 'start'],
    paint: {
      'circle-radius': 8,
      'circle-color': '#16a34a',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });

  // Layer for end points (customer locations)
  map.addLayer({
    id: 'route-end',
    type: 'circle',
    source: 'route',
    filter: ['==', ['get', 'type'], 'end'],
    paint: {
      'circle-radius': 6,
      'circle-color': '#ef4444',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });

  // Layer for destination labels
  map.addLayer({
    id: 'route-labels',
    type: 'symbol',
    source: 'route',
    filter: ['==', '$type', 'Point'],
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 1.2],
      'text-anchor': 'top',
      'text-size': 12,
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': '#333333',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
    },
  });
}

/**
 * Update the route display with new route data
 * 
 * @param map - MapLibre map instance
 * @param route - Route data from OSRM API
 * @param startCoord - Start point [lng, lat]
 * @param endCoord - End point [lng, lat]
 */
// This function now accepts a FeatureCollection to draw multiple routes and points
export function updateRoute(map: maplibregl.Map, features: GeoJSON.FeatureCollection) {
  const source = map.getSource('route') as maplibregl.GeoJSONSource;
  if (source) {
    source.setData(features);

    // Fit map to the bounds of all features
    const bounds = new maplibregl.LngLatBounds();
    features.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
      } else if (feature.geometry.type === 'Point') {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      }
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000,
      });
    }
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
