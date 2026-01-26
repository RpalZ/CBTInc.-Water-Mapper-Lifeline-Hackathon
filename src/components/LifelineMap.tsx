'use client';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useQuery } from '@powersync/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { initMapLibre } from '@/lib/map/initMap';
import { initRouteLayer, updateRoute } from '@/lib/map/routeLayer';
import { fetchRoute } from '@/lib/routing/osrm';

// Initialize map protocols globally once
initMapLibre();

// Types for VRP Solver Response
interface RouteLocation {
  id: string;
  lat: number;
  lon: number;
  demand?: number;
}

interface VehicleRoute {
  vehicle_id: number;
  locations: RouteLocation[];
  total_distance_meters: number;
}

interface SolveResponse {
  routes: VehicleRoute[];
  status: string;
  dropped_node_ids?: string[];
}

export default function LifelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Vehicle Filtering State
  const [availableVehicles, setAvailableVehicles] = useState<number[]>([]);
  const [visibleVehicles, setVisibleVehicles] = useState<number[]>([]);

  // Fetch sensors from local SQLite
  const { data: readings } = useQuery(`
    SELECT device_id, latitude, longitude, pressure_pa, battery_voltage, recorded_at 
    FROM water_readings 
    ORDER BY recorded_at ASC
  `);

  // Update map filters when visibleVehicles changes
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    // Wait until layers are loaded before filtering
    if (!map.isStyleLoaded()) return;

    const filter = ['in', ['get', 'vehicle_id'], ['literal', visibleVehicles]];

    if (map.getLayer('route-line')) map.setFilter('route-line', filter);
    if (map.getLayer('route-end')) map.setFilter('route-end', ['all', ['==', ['get', 'type'], 'end'], filter]);
    if (map.getLayer('route-start')) map.setFilter('route-start', ['all', ['==', ['get', 'type'], 'start'], filter]);
    if (map.getLayer('route-labels')) map.setFilter('route-labels', filter);

  }, [visibleVehicles]);

  // Orchestrator: Call VRP Solver -> Get OSRM Geometry -> Update Map
  const loadFleetRoutes = async () => {
    if (!mapInstance.current) return;

    try {
      console.log('Starting Fleet Route Optimization with 20 Sudan Communities...');

      // 1. Prepare Request Payload for VRP Solver
      // Define 4 Regional Depots
      const DEPOTS = [
        { id: "depot_khartoum", lat: 15.5007, lon: 32.5599, label: "Khartoum Depot" },
        { id: "depot_port_sudan", lat: 19.6175, lon: 37.2164, label: "Port Sudan Depot" },
        { id: "depot_el_obeid", lat: 13.1833, lon: 30.2167, label: "El Obeid Depot" },
        { id: "depot_nyala", lat: 12.0500, lon: 24.8833, label: "Nyala Depot" }
      ];

      // Define Communities (Customers)
      const COMMUNITY_COORDS = [
        [15.6133, 32.5322], [14.4015, 33.5198], 
        [13.1747, 30.2097], [12.8628, 32.9838], [14.0000, 31.0000],
        [15.0000, 35.0000], [13.5000, 34.0000], [12.5000, 30.5000],
        [15.8000, 33.2000], [14.2000, 32.1000], [13.9000, 35.5000],
        [14.8000, 34.5000], [15.2000, 31.8000], [12.9000, 33.9000],
        [13.2000, 31.2000], [14.5000, 33.1000], [15.4000, 32.8000],
        [13.7000, 30.8000], [15.1000, 33.6000], [14.1000, 32.5000]
      ];

      // Merge into a single locations array (Depots MUST come first)
      const locations = [
        ...DEPOTS.map(d => ({
          id: d.id,
          lat: d.lat,
          lon: d.lon,
          demand: 0,
          optional_visit: false
        })),
        ...COMMUNITY_COORDS.map((coords, i) => ({
          id: `community_${i}`,
          lat: coords[0],
          lon: coords[1],
          demand: Math.floor(Math.random() * 300) + 600, // High demand: 600-900L per community
          optional_visit: Math.random() < 0.2,
          drop_penalty: 15000
        }))
      ];

      const num_vehicles = 10; // Scaled up fleet
      const num_depots = DEPOTS.length;
      // Distribute vehicles evenly among depots: [0, 1, 2, 3, 0, 1, ...]
      const vehicle_depots = Array.from({ length: num_vehicles }, (_, i) => i % num_depots);

      const routingRequest = {
        locations: locations,
        num_vehicles: num_vehicles,
        depot_index: 0,
        vehicle_depots: vehicle_depots,
        max_distance_meters: 2000000,
        vehicle_capacity: 2500
      };

      // 2. Call VRP Solver API
      const response = await fetch('/api/routing/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routingRequest),
      });

      if (!response.ok) {
        throw new Error(`VRP Solver failed: ${response.statusText}`);
      }
      
      const solution: SolveResponse = await response.json();
      console.log('Sudan Fleet Solution Received:', solution);

      // Initialize filter state
      const vehicleIds = solution.routes.map(r => r.vehicle_id);
      setAvailableVehicles(vehicleIds);
      setVisibleVehicles(vehicleIds);

      // 3. Process Routes: Fetch OSRM geometry for each segment
      const allFeatures: GeoJSON.Feature[] = [];

      // 3a. Explicitly add all Depot Markers so they are always visible
      DEPOTS.forEach(depot => {
          allFeatures.push({
             type: 'Feature',
             geometry: { type: 'Point', coordinates: [depot.lon, depot.lat] },
             properties: {
               vehicle_id: -1, // -1 indicates infrastructure (depot), not a specific route
               type: 'start',
               id: depot.id,
               label: depot.label,
               demand: 0
             }
          });
      });

      // Utility for rate limiting
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const vehicleRoute of solution.routes) {
        const routeLocs = vehicleRoute.locations;
        const vehicleFeatures: GeoJSON.Feature[] = [];

        // Fetch segments sequentially to avoid rate limits
        for (let i = 0; i < routeLocs.length - 1; i++) {
          const start = routeLocs[i];
          const end = routeLocs[i + 1];
          
          try {
            const route = await fetchRoute(
              { lng: start.lon, lat: start.lat },
              { lng: end.lon, lat: end.lat }
            );
            
            vehicleFeatures.push({
              type: 'Feature',
              geometry: route.geometry,
              properties: {
                vehicle_id: vehicleRoute.vehicle_id,
                type: 'line',
                distance: route.properties.distance,
                duration: route.properties.duration,
                total_route_distance: vehicleRoute.total_distance_meters
              }
            });
            
            // Wait 250ms between requests to respect OSRM rate limits
            await sleep(250); 
            
          } catch (e) {
            console.warn(`OSRM fallback for ${start.id}->${end.id}`, e);
            vehicleFeatures.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [[start.lon, start.lat], [end.lon, end.lat]]
              },
              properties: {
                vehicle_id: vehicleRoute.vehicle_id,
                type: 'line',
                is_fallback: true,
                total_route_distance: vehicleRoute.total_distance_meters
              }
            });
          }
        }
        
        allFeatures.push(...vehicleFeatures);

        // Add markers for stops
        routeLocs.forEach((loc, index) => {
           const isDepot = loc.id.startsWith('depot');
           let label = loc.id;
           
           if (isDepot) {
               // Format "depot_port_sudan" -> "Port Sudan Depot"
               const name = loc.id.replace('depot_', '').split('_')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(' ');
               label = `${name} Depot`;
           } else {
               label = `Community ${loc.id.split('_')[1]}`;
           }

           allFeatures.push({
             type: 'Feature',
             geometry: { type: 'Point', coordinates: [loc.lon, loc.lat] },
             properties: {
               vehicle_id: vehicleRoute.vehicle_id,
               type: isDepot ? 'start' : 'end',
               id: loc.id,
               label: label,
               stop_sequence: index,
               demand: loc.demand
             }
           });
        });
        
        // Progress update: update map after each vehicle is processed so user sees progress
        updateRoute(mapInstance.current, {
            type: 'FeatureCollection',
            features: allFeatures
        });
      }
      
      // Final update not needed as we update incrementally above, but good for safety
      updateRoute(mapInstance.current, {
        type: 'FeatureCollection',
        features: allFeatures
      });

    } catch (error) {
      console.error('Failed to load Sudan fleet routes:', error);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    try {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        center: [32.5599, 15.5007],
        zoom: 6,
        style: {
          version: 8,
          sources: {
            'sudan1': { type: 'vector', url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/sudan_1.pmtiles`, attribution: '© OpenStreetMap' },
            'sudan2': { type: 'vector', url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/sudan_2.pmtiles`, attribution: '© OpenStreetMap' },
            'sudan3': { type: 'vector', url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/sudan_3.pmtiles`, attribution: '© OpenStreetMap' },
            'sudan4': { type: 'vector', url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/sudan_4.pmtiles`, attribution: '© OpenStreetMap' },
            'sudan5': { type: 'vector', url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/sudan_5.pmtiles`, attribution: '© OpenStreetMap' },
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap Contributors',
            }
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#f0f2f5' } },
            { id: 'osm-layer', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 },
            { id: 'water-1', type: 'fill', source: 'sudan1', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-1', type: 'line', source: 'sudan1', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },
            { id: 'water-2', type: 'fill', source: 'sudan2', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-2', type: 'line', source: 'sudan2', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },
            { id: 'water-3', type: 'fill', source: 'sudan3', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-3', type: 'line', source: 'sudan3', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },
            { id: 'water-4', type: 'fill', source: 'sudan4', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-4', type: 'line', source: 'sudan4', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },
            { id: 'water-5', type: 'fill', source: 'sudan5', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-5', type: 'line', source: 'sudan5', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } }
          ]
        }
      });

      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      mapInstance.current.once('load', async () => {
        const map = mapInstance.current!;
        initRouteLayer(map);
        
        const interactiveLayers = ['route-line', 'route-start', 'route-end'];
        interactiveLayers.forEach(layer => {
          map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
        });

        map.on('click', 'route-line', (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<b>Vehicle ${props?.vehicle_id}</b><br/>Dist: ${(props?.total_route_distance/1000).toFixed(1)}km`).addTo(map);
        });

        map.on('click', 'route-end', (e) => {
          if (!e.features?.[0]) return;
          const props = e.features[0].properties;
          new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<b>${props?.label}</b><br/>Demand: ${props?.demand}L`).addTo(map);
        });

        await loadFleetRoutes();
      });

    } catch (err: any) {
        console.error("Failed to initialize map:", err);
        setMapError(err.message);
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  if (mapError) return <div className="p-4 bg-red-50 text-red-500">Map Error: {mapError}</div>;

  return (
    <div className="relative h-full w-full">
      {availableVehicles.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 min-w-[160px]">
          <h3 className="text-sm font-semibold mb-3">🚛 Fleet Status</h3>
          <div className="space-y-2">
            {availableVehicles.map(id => (
              <label key={id} className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={visibleVehicles.includes(id)} onChange={(e) => {
                  setVisibleVehicles(prev => e.target.checked ? [...prev, id] : prev.filter(v => v !== id));
                }} className="rounded text-blue-600" />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3b82f6', '#16a34a', '#f97316', '#9333ea', '#e11d48'][id % 5] }} />
                <span className="text-sm">Vehicle {id}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px', minHeight: '600px' }} />
    </div>
  );
}