'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { usePowerSync, useQuery } from '@powersync/react';
import { initMapLibre } from '@/lib/map/initMap';
import { initRouteLayer, updateRoute } from '@/lib/map/routeLayer';
import { fetchRoute } from '@/lib/routing/osrm';
import CreateLocationModal from './CreateLocationModal';
import CreateVehicleModal from './CreateVehicleModal';
import CreateDeviceModal from './CreateDeviceModal';

// Initialize map protocols globally once
initMapLibre();

const ROUTE_CACHE_KEY = 'water_mapper_routes_cache_v1';

// --- Constants ---

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

const COMMUNITY_COORDS = [
  [15.6000, 32.5000], [15.4000, 32.6000], [15.7000, 32.4000],
  [19.5000, 37.1000], [19.7000, 37.3000], [19.4000, 37.0000],
  [13.1000, 30.1000], [13.3000, 30.3000], [13.0000, 30.4000],
  [12.1000, 24.9000], [11.9000, 24.8000], [12.2000, 25.0000],
  [15.3500, 36.3000], [15.5500, 36.5000], [15.2500, 36.2000],
  [19.1000, 30.4000], [19.2500, 30.5500], [19.0000, 30.3500],
  [14.3000, 33.4000], [14.5000, 33.6000], [14.2000, 33.7000],
  [13.5000, 25.2000], [13.7000, 25.4000], [13.8000, 25.5000],
  [13.4500, 33.4500], [13.6500, 33.6500], [13.3500, 33.7500],
  [17.7000, 33.8000], [17.9000, 34.0000], [17.6000, 34.1000]
];

// Types
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

interface HoverFeatureProperties {
  label: string;
  demand: number;
  vehicle_id: number;
  type: string;
  id: string;
  color: string;
  stop_sequence: number;
}

interface DBLocation {
  id: string;
  name: string;
  label: string;
  latitude: number;
  longitude: number;
  water_demand_daily: number;
}

interface DBVehicle {
  id: string;
  name: string;
  type: string;
  capacity: number;
  assigned_location_id?: string;
}

interface SearchResult extends Partial<DBLocation> {
  source: 'db' | 'mock';
  lat?: number;
  lon?: number;
}

export default function LifelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const mounted = useRef(false); // Add this ref
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const powersync = usePowerSync();
  const { data: dbLocations } = useQuery('SELECT * FROM location');
  const { data: dbVehicles } = useQuery('SELECT * FROM vehicle');

  // Interaction State
  const [isGenerating, setIsGenerating] = useState(false);
  const [routesLoaded, setRoutesLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    feature: HoverFeatureProperties;
  } | null>(null);

  // Feature States
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [newLocationCoords, setNewLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Vehicle Filtering State
  const [availableVehicles, setAvailableVehicles] = useState<number[]>([]);
  const [visibleVehicles, setVisibleVehicles] = useState<number[]>([]);

  // Fleet Statistics State
  const [fleetStats, setFleetStats] = useState<{
    totalDemand: number;
    topDemands: { label: string; demand: number }[];
  } | null>(null);

  // Update map filters
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;
    const map = mapInstance.current;
    if (!map.isStyleLoaded()) return;

    const filter = ['in', ['get', 'vehicle_id'], ['literal', visibleVehicles]];
    if (map.getLayer('route-line')) map.setFilter('route-line', filter);
  }, [visibleVehicles, mapLoaded]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results: SearchResult[] = [];
    if (dbLocations) {
      const matches = (dbLocations as DBLocation[]).filter(l => 
        l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        l.label?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      results.push(...matches.map(l => ({ ...l, source: 'db' as const })));
    }

    const mockDepots = DEPOTS.filter(d => 
      d.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    results.push(...mockDepots.map(d => ({ ...d, name: d.label, source: 'mock' as const, latitude: d.lat, longitude: d.lon })));

    setSearchResults(results.slice(0, 5));
  }, [searchQuery, dbLocations]);

  const handleCreateLocation = async (data: { name: string; type: 'depot' | 'community'; demand: number }) => {
    if (!newLocationCoords) return;
    try {
      const { lat, lng } = newLocationCoords;
      await powersync.execute(
        `INSERT INTO location (id, name, label, latitude, longitude, water_demand_daily, owner) 
         VALUES (uuid(), ?, ?, ?, ?, ?, ?)`,
        [data.name, data.type, lat, lng, data.demand, 'user-id-placeholder']
      );
      setShowLocationModal(false);
      setIsAddingLocation(false);
      setNewLocationCoords(null);
    } catch (error) {
      console.error("Failed to create location:", error);
      alert("Failed to save location.");
    }
  };

  const handleCreateVehicle = async (data: { name: string; type: 'truck' | 'car'; capacity: number; locationId?: string }) => {
    try {
      await powersync.execute(
        `INSERT INTO vehicle (id, name, type, capacity, assigned_location_id, owner) 
         VALUES (uuid(), ?, ?, ?, ?, ?)`,
        [data.name, data.type, data.capacity, data.locationId || null, 'user-id-placeholder']
      );
      setShowVehicleModal(false);
    } catch (error) {
      console.error("Failed to create vehicle:", error);
      alert("Failed to save vehicle.");
    }
  };

  const handleCreateDevice = async (data: { name: string; vehicleId?: string }) => {
    try {
      await powersync.execute(
        `INSERT INTO device (id, name, vehicle_id, owner, available) 
         VALUES (uuid(), ?, ?, ?, 1)`,
        [data.name, data.vehicleId || null, 'user-id-placeholder']
      );
      setShowDeviceModal(false);
    } catch (error) {
      console.error("Failed to create device:", error);
      alert("Failed to save device.");
    }
  };

  const flyToLocation = (lat: number, lon: number) => {
    mapInstance.current?.flyTo({ center: [lon, lat], zoom: 12 });
    setSearchQuery('');
  };

  const renderInitialPoints = useCallback(() => {
    if (!mapInstance.current || !mapLoaded) return;
    const features: GeoJSON.Feature[] = [];

    DEPOTS.forEach(depot => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [depot.lon, depot.lat] },
        properties: { vehicle_id: -1, type: 'start', id: depot.id, label: depot.label, demand: 0, color: '#16a34a' }
      });
    });

    COMMUNITY_COORDS.forEach((coords, i) => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [coords[1], coords[0]] },
        properties: { vehicle_id: -1, type: 'end', id: `community_${i}`, label: `Community ${i}`, demand: 0, color: '#ef4444' }
      });
    });

    if (dbLocations && dbLocations.length > 0) {
        (dbLocations as DBLocation[]).forEach(loc => {
            const isDepot = loc.label === 'depot';
            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [loc.longitude, loc.latitude] },
                properties: {
                    vehicle_id: -1,
                    type: isDepot ? 'start' : 'end',
                    id: loc.id,
                    label: loc.name || `Location ${loc.id.substring(0,4)}`,
                    demand: loc.water_demand_daily || 0,
                    color: isDepot ? '#10b981' : '#f59e0b',
                    isUserCreated: true
                }
            });
        });
    }

    updateRoute(mapInstance.current, { type: 'FeatureCollection', features }, !routesLoaded);
  }, [dbLocations, mapLoaded, routesLoaded]);

  const processAndRenderRoutes = useCallback((featureCollection: GeoJSON.FeatureCollection, fitToView = false) => {
    if (!mapInstance.current || !mapLoaded) return;
    updateRoute(mapInstance.current, featureCollection, fitToView);

    const vehicles = new Set<number>();
    const communities: { label: string; demand: number }[] = [];
    let totalDemand = 0;

    featureCollection.features.forEach(f => {
      const p = f.properties;
      if (p?.vehicle_id !== undefined && p.vehicle_id !== -1) vehicles.add(p.vehicle_id);
      if (p?.type === 'end') {
        communities.push({ label: p.label, demand: p.demand });
        totalDemand += p.demand || 0;
      }
    });

    const vehicleList = Array.from(vehicles).sort((a, b) => a - b);
    setAvailableVehicles(vehicleList);
    setVisibleVehicles(vehicleList);
    setFleetStats({ totalDemand, topDemands: communities.sort((a, b) => b.demand - a.demand) });
    setRoutesLoaded(true);
  }, [mapLoaded]);

  const handleGenerateRoutes = async (forceRefresh = false) => {
    setIsGenerating(true);
    setMapError(null);
    try {
      const cached = localStorage.getItem(ROUTE_CACHE_KEY);
      if (cached && !forceRefresh) {
        processAndRenderRoutes(JSON.parse(cached), false);
        setIsGenerating(false);
        return;
      }
      
      // 1. Prepare all locations (Hardcoded + DB)
      const locations = [
        ...DEPOTS.map(d => ({ id: d.id, lat: d.lat, lon: d.lon, demand: 0, optional_visit: false })),
        ...COMMUNITY_COORDS.map((coords, i) => ({ id: `community_${i}`, lat: coords[0], lon: coords[1], demand: Math.floor(Math.random() * 2000) + 800, optional_visit: true, drop_penalty: 1000000 }))
      ];

      // Add user-created locations from DB
      if (dbLocations) {
        (dbLocations as DBLocation[]).forEach(loc => {
           // Avoid duplicates if IDs clash
           if (!locations.find(l => l.id === loc.id)) {
               locations.push({
                   id: loc.id,
                   lat: loc.latitude,
                   lon: loc.longitude,
                   demand: loc.label === 'depot' ? 0 : (loc.water_demand_daily || 500),
                   optional_visit: loc.label === 'community',
                   drop_penalty: loc.label === 'community' ? 1000000 : undefined
               });
           }
        });
      }

      // 2. Configure Fleet (Simulation + DB Combined)
      
      // A. Simulation Fleet (Mock)
      const mockFleetSize = 20;
      const mockCapacities = Array.from({ length: mockFleetSize }, (_, i) => {
          // Vary capacities: Heavy (5000L), Medium (3000L), Light (1000L)
          if (i % 3 === 0) return 5000;
          if (i % 3 === 1) return 3000;
          return 1000;
      });
      // Distribute mock vehicles across hardcoded depots
      const mockDepots = Array.from({ length: mockFleetSize }, (_, i) => i % DEPOTS.length);

      // B. DB Fleet (User)
      let dbFleetCapacities: number[] = [];
      let dbFleetDepots: number[] = [];

      if (dbVehicles && dbVehicles.length > 0) {
          const vehicles = dbVehicles as DBVehicle[];
          dbFleetCapacities = vehicles.map(v => v.capacity || 2000);
          
          dbFleetDepots = vehicles.map(v => {
              if (v.assigned_location_id) {
                  const idx = locations.findIndex(l => l.id === v.assigned_location_id);
                  return idx !== -1 ? idx : 0; 
              }
              return 0; // Default to first depot
          });
      }

      // C. Combine Fleets
      const vehicle_capacities = [...mockCapacities, ...dbFleetCapacities];
      const vehicle_depots = [...mockDepots, ...dbFleetDepots];
      const num_vehicles = vehicle_capacities.length;

      const routingRequest = {
        locations: locations,
        num_vehicles: num_vehicles,
        depot_index: 0,
        vehicle_depots: vehicle_depots,
        vehicle_capacities: vehicle_capacities,
        max_distance_meters: 3000000
      };

      const response = await fetch('/api/routing/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routingRequest),
      });

      if (!response.ok) throw new Error(`VRP Solver failed`);
      const solution: SolveResponse = await response.json();
      
      const allFeatures: GeoJSON.Feature[] = [];
      const routeColors = ['#3b82f6', '#16a34a', '#f97316', '#9333ea', '#e11d48', '#0891b2', '#db2777', '#7c3aed', '#ea580c', '#2563eb'];
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Add Start Points (Depots) for visual context
      locations.filter(l => l.demand === 0).forEach(depot => {
          // Try to find label from DEPOTS or DB
          const hardcoded = DEPOTS.find(d => d.id === depot.id);
          const dbLoc = dbLocations ? (dbLocations as DBLocation[]).find(l => l.id === depot.id) : null;
          const label = hardcoded ? hardcoded.label : (dbLoc ? dbLoc.name : 'Depot');
          
          allFeatures.push({ 
              type: 'Feature', 
              geometry: { type: 'Point', coordinates: [depot.lon, depot.lat] }, 
              properties: { vehicle_id: -1, type: 'start', id: depot.id, label: label, demand: 0, color: '#16a34a' } 
          });
      });

      for (const vehicleRoute of solution.routes) {
        const routeLocs = vehicleRoute.locations;
        const vehicleColor = routeColors[vehicleRoute.vehicle_id % routeColors.length];
        
        for (let i = 0; i < routeLocs.length - 1; i++) {
          const start = routeLocs[i];
          const end = routeLocs[i + 1];
          try {
            const route = await fetchRoute({ lng: start.lon, lat: start.lat }, { lng: end.lon, lat: end.lat });
            allFeatures.push({ type: 'Feature', geometry: route.geometry, properties: { vehicle_id: vehicleRoute.vehicle_id, type: 'line', color: vehicleColor, distance: route.properties.distance, duration: route.properties.duration, total_route_distance: vehicleRoute.total_distance_meters } });
            await sleep(250); 
          } catch (_e) {
            allFeatures.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[start.lon, start.lat], [end.lon, end.lat]] }, properties: { vehicle_id: vehicleRoute.vehicle_id, type: 'line', color: vehicleColor, is_fallback: true, total_route_distance: vehicleRoute.total_distance_meters } });
          }
        }
        
        routeLocs.forEach((loc, index) => {
           let label = loc.id;
           // Determine label based on source
           if (loc.id.startsWith('depot_')) {
               label = `${loc.id.replace('depot_', '').charAt(0).toUpperCase()}${loc.id.replace('depot_', '').slice(1)} Depot`;
           } else if (loc.id.startsWith('community_')) {
               label = `Community ${loc.id.split('_')[1]}`;
           } else {
               // Must be DB location
               const dbLoc = dbLocations ? (dbLocations as DBLocation[]).find(l => l.id === loc.id) : null;
               if (dbLoc) label = dbLoc.name;
           }

           const isStart = index === 0 || index === routeLocs.length - 1; // Assuming round trip or depot start/end
           allFeatures.push({ 
               type: 'Feature', 
               geometry: { type: 'Point', coordinates: [loc.lon, loc.lat] }, 
               properties: { 
                   vehicle_id: vehicleRoute.vehicle_id, 
                   type: isStart ? 'start' : 'end', 
                   id: loc.id, 
                   label: label, 
                   color: vehicleColor, 
                   stop_sequence: index, 
                   demand: loc.demand || 0 
               } 
           });
        });
      }
      
      const fc = { type: 'FeatureCollection' as const, features: allFeatures };
      try { localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(fc)); } catch (_e) {}
      processAndRenderRoutes(fc, false);
    } catch (error: unknown) {
      setMapError((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem(ROUTE_CACHE_KEY);
    setRoutesLoaded(false);
    setFleetStats(null);
    setAvailableVehicles([]);
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    mounted.current = true; // Set mounted to true when component mounts

    try {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        center: [32.5599, 15.5007],
        zoom: 5,
        style: {
          version: 8,
          sources: {
            'osm': { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OpenStreetMap Contributors' }
          },
          layers: [
            { id: 'osm-layer', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }
          ]
        }
      });

      const map = mapInstance.current;
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      map.once('load', () => {
        if (!mounted.current) return; // Check if component is still mounted
        initRouteLayer(map);
        setMapLoaded(true);
        
        map.on('mouseenter', 'route-line', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'route-line', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'route-end', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'route-end', () => { map.getCanvas().style.cursor = ''; if (mounted.current) setHoverInfo(null); }); // Check here too

        map.on('mousemove', 'route-end', (e) => {
            if (mounted.current && e.features && e.features.length > 0) { // Check here too
                const feature = e.features[0];
                const props = feature.properties as unknown as HoverFeatureProperties;
                setHoverInfo({ x: e.point.x, y: e.point.y, feature: props });
            }
        });
      });

    } catch (err: unknown) {
        if (mounted.current) setMapError((err as Error).message); // Check here too
    }

    return () => {
      mounted.current = false; // Set mounted to false when component unmounts
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
      if (!mapLoaded) return;
      const cached = localStorage.getItem(ROUTE_CACHE_KEY);
      if (cached && !routesLoaded) {
          try { processAndRenderRoutes(JSON.parse(cached), false); } 
          catch(_e) { renderInitialPoints(); }
      } else if (!routesLoaded) {
          renderInitialPoints();
      }
  }, [mapLoaded, routesLoaded, renderInitialPoints, processAndRenderRoutes]);

  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;
    const map = mapInstance.current;
    const clickHandler = (e: maplibregl.MapMouseEvent) => {
        if (isAddingLocation) {
            setNewLocationCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
            setShowLocationModal(true);
        } else {
            const features = map.queryRenderedFeatures(e.point, { layers: ['route-line'] });
            if (features.length > 0) {
                const props = features[0].properties;
                new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<b>Vehicle ${props?.vehicle_id}</b><br/>Dist: ${(props?.total_route_distance/1000).toFixed(1)}km`).addTo(map);
            }
        }
    };
    map.on('click', clickHandler);
    map.getCanvas().style.cursor = isAddingLocation ? 'crosshair' : '';
    return () => { map.off('click', clickHandler); };
  }, [isAddingLocation, mapLoaded]);

  if (mapError) return <div className="p-4 bg-red-50 text-red-500">Map Error: {mapError}</div>;

  return (
    <div className="flex flex-col h-full w-full gap-4 relative">
      
      <CreateLocationModal isOpen={showLocationModal} onClose={() => { setShowLocationModal(false); setIsAddingLocation(false); }} onSave={handleCreateLocation} coordinates={newLocationCoords} />
      <CreateVehicleModal isOpen={showVehicleModal} onClose={() => setShowVehicleModal(false)} onSave={handleCreateVehicle} locations={(dbLocations || []) as DBLocation[]} />
      <CreateDeviceModal isOpen={showDeviceModal} onClose={() => setShowDeviceModal(false)} onSave={handleCreateDevice} vehicles={(dbVehicles || []) as DBVehicle[]} />

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm gap-4 z-10">
          <div className="relative w-full md:w-1/3">
              <input type="text" placeholder="🔍 Search communities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 overflow-hidden z-50">
                      {searchResults.map((res, idx) => (
                          <button key={idx} onClick={() => flyToLocation(res.latitude || res.lat!, res.longitude || res.lon!)} className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-zinc-800 text-sm border-b border-gray-100 dark:border-zinc-800 last:border-0 flex justify-between items-center">
                              <span className="text-gray-800 dark:text-gray-200">{res.name}</span>
                              <span className="text-xs text-gray-400 uppercase">{res.source === 'db' ? 'User' : 'System'}</span>
                          </button>
                      ))}
                  </div>
              )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
              <button onClick={() => setIsAddingLocation(!isAddingLocation)} className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all ${isAddingLocation ? 'bg-amber-500 text-white shadow-inner' : 'bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700'}`}>
                  {isAddingLocation ? '📍 Pick on Map' : '➕ Location'}
              </button>
              <button onClick={() => setShowVehicleModal(true)} className="px-3 py-1.5 rounded-lg font-medium text-xs bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                  🚚 Vehicle
              </button>
              <button onClick={() => setShowDeviceModal(true)} className="px-3 py-1.5 rounded-lg font-medium text-xs bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                  📟 Device
              </button>

              {!routesLoaded && (
                  <button onClick={() => handleGenerateRoutes(false)} disabled={isGenerating} className={`px-4 py-1.5 rounded-lg font-medium text-xs flex items-center gap-2 transition-all text-white shadow-md ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {isGenerating ? <span>Optimizing...</span> : <span>🚀 Route</span>}
                  </button>
              )}
              
              {routesLoaded && <button onClick={clearCache} className="text-x
              ext-red-500 hover:bg-red-50 px-3 py-1.5 rounded border border-red-200">Reset</button>}
          </div>
      </div>

      <div className="relative flex-grow w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm">
          {hoverInfo && (
            <div className="absolute z-50 pointer-events-none bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-800 text-sm min-w-[150px]" style={{ left: hoverInfo.x + 15, top: hoverInfo.y + 15 }}>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{hoverInfo.feature.label}</h4>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between"><span>Demand:</span><span className="font-mono font-bold text-blue-600">{hoverInfo.feature.demand} L</span></div>
                    {hoverInfo.feature.vehicle_id !== -1 && <div className="flex justify-between border-t border-gray-100 dark:border-zinc-800 pt-1 mt-1"><span>Vehicle:</span><span className="font-mono">#{hoverInfo.feature.vehicle_id}</span></div>}
                </div>
            </div>
          )}

          {/* Stats Overlay */}
          {(routesLoaded || fleetStats) && (
            <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-800 min-w-[200px] max-h-[80vh] overflow-y-auto">
              {fleetStats && (
                <div className="mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1"><span>🚨</span> Demand Scoreboard</h3>
                  <div className="space-y-1 mb-3 max-h-[200px] overflow-y-auto pr-1">
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
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{fleetStats.totalDemand.toLocaleString()} L</p>
                  </div>
                </div>
              )}

              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2"><span>🚛</span> Fleet Status</h3>
              <div className="space-y-2.5">
                {availableVehicles.map(id => (
                  <label key={id} className="flex items-center space-x-2.5 cursor-pointer group hover:bg-gray-50 dark:hover:bg-zinc-800 p-1 rounded transition-colors">
                    <input type="checkbox" checked={visibleVehicles.includes(id)} onChange={(e) => { if (e.target.checked) setVisibleVehicles(prev => [...prev, id]); else setVisibleVehicles(prev => prev.filter(v => v !== id)); }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ['#3b82f6', '#16a34a', '#f97316', '#9333ea', '#e11d48', '#0891b2', '#db2777', '#7c3aed', '#ea580c', '#2563eb'][id % 10] }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">Vehicle {id}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex justify-between text-xs text-gray-500">
                 <button onClick={() => setVisibleVehicles(availableVehicles)} className="hover:text-blue-600 font-medium transition-colors">Select All</button>
                 <button onClick={() => setVisibleVehicles([])} className="hover:text-blue-600 font-medium transition-colors">Clear</button>
              </div>
            </div>
          )}
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}