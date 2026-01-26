'use client';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useQuery } from '@powersync/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { initMapLibre } from '@/lib/map/initMap';

// Initialize map protocols globally once
initMapLibre();

export default function LifelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [mapError, setMapError] = useState<string | null>(null);

  // Fetch sensors from local SQLite
  // We'll use the water_readings table. 
  // In a real app, you might want the LATEST reading per device.
  // For now, we will just fetch all and let the latest one overwrite the marker position/status if duplicates exist for a device,
  // or just show them all. 
  // Optimization: Group by device_id in SQL if possible, or handle in JS.
  // Let's try to get the latest reading for each device using a subquery or simplified approach.
  // PowerSync runs SQLite, so standard SQL works.
  const { data: readings } = useQuery(`
    SELECT device_id, latitude, longitude, pressure_pa, battery_voltage, recorded_at 
    FROM water_readings 
    ORDER BY recorded_at ASC
  `);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return; // Initialize only once

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      console.log('Map configuration:', {
        supabaseUrl,
        exampleSourceUrl: `pmtiles://${supabaseUrl}/storage/v1/object/public/maps/sudan_1.pmtiles`
      });

      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        center: [32.5599, 15.5007], // Khartoum, Sudan
        zoom: 12,
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
            
            // Layer 1
            { id: 'water-1', type: 'fill', source: 'sudan1', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-1', type: 'line', source: 'sudan1', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },
            
            // Layer 2
            { id: 'water-2', type: 'fill', source: 'sudan2', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-2', type: 'line', source: 'sudan2', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },

            // Layer 3
            { id: 'water-3', type: 'fill', source: 'sudan3', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-3', type: 'line', source: 'sudan3', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },

            // Layer 4
            { id: 'water-4', type: 'fill', source: 'sudan4', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-4', type: 'line', source: 'sudan4', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } },

            // Layer 5
            { id: 'water-5', type: 'fill', source: 'sudan5', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads-5', type: 'line', source: 'sudan5', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } }
          ]
        }
      });

      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      mapInstance.current.on('error', (e) => {
        console.warn('Map error:', e);
        // Don't block the UI, just log. 
        // Common error: Source "doha" not found if pmtiles file is missing.
      });

    } catch (err: unknown) {
        console.error("Failed to initialize map:", err);
        const message = err instanceof Error ? err.message : String(err);
        setTimeout(() => setMapError(message), 0);
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  // Sync markers with PowerSync data
  useEffect(() => {
    if (!mapInstance.current || !readings) return;

    readings.forEach(reading => {
      // Basic validation
      if (!reading.latitude || !reading.longitude || !reading.device_id) return;

      const deviceId = reading.device_id;
      
      // Determine color based on pressure (simulated water level logic)
      // Assuming higher pressure = higher water level. 
      // Adjust thresholds as needed.
      const isHigh = (reading.pressure_pa || 0) > 2000; 
      const color = isHigh ? '#0077b6' : '#ff4d4d'; // Blue (safe/wet) vs Red (low/alert) - or vice versa depending on semantics

      if (markers.current[deviceId]) {
        markers.current[deviceId].setLngLat([reading.longitude, reading.latitude]);
        // Update popup content if needed
         const popup = markers.current[deviceId].getPopup();
         popup.setHTML(
            `<b>${deviceId}</b><br/>` +
            `Pressure: ${reading.pressure_pa} Pa<br/>` +
            `Battery: ${reading.battery_voltage} V`
         );
      } else {
        const m = new maplibregl.Marker({ color })
          .setLngLat([reading.longitude, reading.latitude])
          .setPopup(new maplibregl.Popup().setHTML(
            `<b>${deviceId}</b><br/>` +
            `Pressure: ${reading.pressure_pa} Pa<br/>` +
            `Battery: ${reading.battery_voltage} V`
          ))
          .addTo(mapInstance.current!);
        
        markers.current[deviceId] = m;
      }
    });
  }, [readings]);

  if (mapError) {
      return <div className="p-4 bg-red-50 text-red-500 rounded">Map Error: {mapError}</div>;
  }

  return <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px', minHeight: '400px' }} />;
}
