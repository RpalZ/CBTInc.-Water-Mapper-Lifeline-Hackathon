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

  // Fleet Statistics State
  const [fleetStats, setFleetStats] = useState<{
    totalDemand: number;
    topDemands: { label: string; demand: number }[];
  } | null>(null);

  // Fetch sensors from local SQLite
  const { data: readings } = useQuery(`
    SELECT device_id, latitude, longitude, pressure_pa, battery_voltage, recorded_at 
    FROM water_readings 
    ORDER BY recorded_at ASC
  `);

  // Update map filters when visibleVehicles changes
  useEffect(() => {
    // ... (existing filter logic)
    if (!mapInstance.current) return;
    const map = mapInstance.current;

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
      console.log('Starting Fleet Route Optimization with 10 Depots & 30 Communities...');

      // 1. Prepare Request Payload for VRP Solver
      // Define 10 Regional Depots across Sudan
      const DEPOTS = [
        { id: "depot_khartoum", lat: 15.5007, lon: 32.5599, label: "Khartoum Depot" },
        { id: "depot_port_sudan", lat: 19.6175, lon: 37.2164, label: "Port Sudan Depot" },
        { id: "depot_el_obeid", lat: 13.1833, lon: 30.2167, label: "El Obeid Depot" },
        { id: "depot_nyala", lat: 12.0500, lon: 24.8833, label: "Nyala Depot" },
        { id: "depot_kassala", lat: 15.4500, lon: 36.4000, label: "Kassala Depot" },
        { id: "depot_dongola", lat: 19.1667, lon: 30.4833, label: "Dongola Depot" },
        { id: "depot_wad_madani", lat: 14.4012, lon: 33.5199, label: "Wad Madani Depot" },
        { id: "depot_al_fashir", lat: 13.6333, lon: 25.3500, label: "Al Fashir Depot" },
        { id: "depot_sennar", lat: 13.5500, lon: 33.5667, label: "Sennar Depot" },
        { id: "depot_atbara", lat: 17.8333, lon: 33.9667, label: "Atbara Depot" }
      ];

      // Define 30 Communities (Customers) spread across these regions
      const COMMUNITY_COORDS = [
        // Khartoum Region
        [15.6000, 32.5000], [15.4000, 32.6000], [15.7000, 32.4000],
        // Port Sudan Region
        [19.5000, 37.1000], [19.7000, 37.3000], [19.4000, 37.0000],
        // El Obeid Region
        [13.1000, 30.1000], [13.3000, 30.3000], [13.0000, 30.4000],
        // Nyala Region
        [12.1000, 24.9000], [11.9000, 24.8000], [12.2000, 25.0000],
        // Kassala Region
        [15.3500, 36.3000], [15.5500, 36.5000], [15.2500, 36.2000],
        // Dongola Region
        [19.1000, 30.4000], [19.2500, 30.5500], [19.0000, 30.3500],
        // Wad Madani Region
        [14.3000, 33.4000], [14.5000, 33.6000], [14.2000, 33.7000],
        // Al Fashir Region
        [13.5000, 25.2000], [13.7000, 25.4000], [13.8000, 25.5000],
        // Sennar Region
        [13.4500, 33.4500], [13.6500, 33.6500], [13.3500, 33.7500],
        // Atbara Region
        [17.7000, 33.8000], [17.9000, 34.0000], [17.6000, 34.1000]
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
          demand: Math.floor(Math.random() * 2000) + 800, // High demand
          optional_visit: true, // Resilience
          drop_penalty: 1000000
        }))
      ];

      // Calculate Insights: Demand Scoreboard
      const communitiesOnly = locations.filter(l => l.id.startsWith('community'));
      const totalDemand = communitiesOnly.reduce((sum, c) => sum + (c.demand || 0), 0);
      const sortedDemands = communitiesOnly
        .map(c => ({
            label: `Community ${c.id.split('_')[1]}`,
            demand: c.demand || 0
        }))
        .sort((a, b) => b.demand - a.demand);

      setFleetStats({
        totalDemand,
        topDemands: sortedDemands
      });

      const num_vehicles = 20; // 20 vehicles
      const num_depots = DEPOTS.length; // 10 depots
      // Distribute vehicles evenly: 2 trucks per depot
      const vehicle_depots = Array.from({ length: num_vehicles }, (_, i) => i % num_depots);

      const routingRequest = {
        locations: locations,
        num_vehicles: num_vehicles,
        depot_index: 0,
        vehicle_depots: vehicle_depots,
        max_distance_meters: 3000000, // 3000km range
        vehicle_capacity: 3000 // 3000L capacity
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
      const routeColors = ['#3b82f6', '#16a34a', '#f97316', '#9333ea', '#e11d48', '#0891b2', '#db2777', '#7c3aed', '#ea580c', '#2563eb'];
      
      // Utility for rate limiting
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // 3a. Explicitly add all Depot Markers
      DEPOTS.forEach(depot => {
          allFeatures.push({
             type: 'Feature',
             geometry: { type: 'Point', coordinates: [depot.lon, depot.lat] },
             properties: {
               vehicle_id: -1,
               type: 'start',
               id: depot.id,
               label: depot.label,
               demand: 0,
               color: '#16a34a' // Depots stay green
             }
          });
      });

      for (const vehicleRoute of solution.routes) {
        const routeLocs = vehicleRoute.locations;
        const vehicleFeatures: GeoJSON.Feature[] = [];
        const vehicleColor = routeColors[vehicleRoute.vehicle_id % routeColors.length];

        // Fetch segments sequentially
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
                color: vehicleColor,
                distance: route.properties.distance,
                duration: route.properties.duration,
                total_route_distance: vehicleRoute.total_distance_meters
              }
            });
            
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
                color: vehicleColor,
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
               color: vehicleColor,
               stop_sequence: index,
               demand: loc.demand
             }
           });
        });
        
        updateRoute(mapInstance.current, {
            type: 'FeatureCollection',
            features: allFeatures
        });
      }
      
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
        zoom: 5, // Zoom out slightly more to see all 10 depots
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
      {/* Vehicle Filter & Stats Control */}
      {(availableVehicles.length > 0 || fleetStats) && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 min-w-[200px] max-h-[80vh] overflow-y-auto">
          
          {/* Critical Insights Section */}
          {fleetStats && (
            <div className="mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span>🚨</span> Demand Scoreboard
              </h3>
              
              <div className="space-y-1 mb-3 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
                 {fleetStats.topDemands.map((comm, idx) => (
                    <div key={comm.label} className="flex justify-between items-center text-xs p-1.5 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-red-500' : 'text-gray-400'}`}>#{idx + 1}</span>
                            <span className="text-gray-700 dark:text-gray-200 truncate max-w-[100px]">{comm.label}</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white tabular-nums">{comm.demand.toLocaleString()} L</span>
                    </div>
                 ))}
              </div>

              <div className="mt-2 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-medium">Total Fleet Load</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {fleetStats.totalDemand.toLocaleString()} L
                </p>
              </div>
            </div>
          )}

          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <span>🚛</span> Fleet Status
          </h3>
          <div className="space-y-2.5">
            {availableVehicles.map(id => (
              <label key={id} className="flex items-center space-x-2.5 cursor-pointer group hover:bg-gray-50 dark:hover:bg-zinc-800 p-1 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={visibleVehicles.includes(id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVisibleVehicles(prev => [...prev, id]);
                    } else {
                      setVisibleVehicles(prev => prev.filter(v => v !== id));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: ['#3b82f6', '#16a34a', '#f97316', '#9333ea', '#e11d48', '#0891b2', '#db2777', '#7c3aed', '#ea580c', '#2563eb'][id % 10] }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Vehicle {id}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-between text-xs text-gray-500">
             <button 
               onClick={() => setVisibleVehicles(availableVehicles)}
               className="hover:text-blue-600 font-medium transition-colors"
             >
               Select All
             </button>
             <button 
               onClick={() => setVisibleVehicles([])}
               className="hover:text-blue-600 font-medium transition-colors"
             >
               Clear
             </button>
          </div>
        </div>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px', minHeight: '800px' }} />
    </div>
  );
}
