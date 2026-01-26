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
  const userLocationMarker = useRef<maplibregl.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported in your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        let errorMsg = 'Unable to get location';
        if (error.code === 1) {
          errorMsg = 'Location permission denied. Enable it in browser settings.';
        } else if (error.code === 2) {
          errorMsg = 'Location unavailable.';
        } else if (error.code === 3) {
          errorMsg = 'Location request timed out.';
        }
        setLocationError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return; // Initialize only once

    try {
      mapInstance.current = new maplibregl.Map({
        container: mapContainer.current,
        center: [51.528, 25.319], // Doha West Bay
        zoom: 12,
        style: {
          version: 8,
          sources: {
            'doha': {
              type: 'vector',
              // NOTE: This URL expects the file to be present in Supabase storage.
              // If missing, the map background will be blank, but markers will still appear.
              url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/doha.pmtiles`,
              attribution: '© OpenStreetMap'
            },
            // Fallback source (OSM Raster) so the user sees SOMETHING if they haven't uploaded the PMTiles yet.
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; OpenStreetMap Contributors',
            }
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#f0f2f5' } },
            // Fallback raster layer
            { id: 'osm-layer', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 },
            // Vector layers (will sit on top if data exists)
            { id: 'water', type: 'fill', source: 'doha', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
            { id: 'roads', type: 'line', source: 'doha', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } }
          ]
        }
      });

      mapInstance.current.addControl(new maplibregl.NavigationControl(), 'top-right');
      
      mapInstance.current.on('error', (e) => {
        console.warn('Map error:', e);
        // Don't block the UI, just log. 
        // Common error: Source "doha" not found if pmtiles file is missing.
      });

      // Wait for map to fully load before adding user location marker
      mapInstance.current.once('load', () => {
        if (userLocation) {
          addUserLocationMarker(userLocation.lat, userLocation.lng);
        }
      });

    } catch (err: any) {
        console.error("Failed to initialize map:", err);
        setMapError(err.message);
    }

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [userLocation]);

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

  // Add user location marker to map
  const addUserLocationMarker = (latitude: number, longitude: number) => {
    if (!mapInstance.current) return;

    // Create user location marker with water droplet icon
    const userMarker = document.createElement('div');
    userMarker.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer;">
        <!-- Outer glow circle -->
        <circle cx="20" cy="20" r="19" fill="rgba(59, 130, 246, 0.15)" />
        <!-- Water droplet -->
        <path d="M20 8 C20 8, 14 16, 14 22 C14 27.5, 16.9 32, 20 32 C23.1 32, 26 27.5, 26 22 C26 16, 20 8, 20 8 Z" fill="#0ea5e9" stroke="#0369a1" stroke-width="1.5"/>
        <!-- White highlight on droplet -->
        <ellipse cx="19" cy="18" rx="2.5" ry="3.5" fill="white" opacity="0.6"/>
      </svg>
    `;

    if (userLocationMarker.current) {
      userLocationMarker.current.remove();
    }

    userLocationMarker.current = new maplibregl.Marker({ element: userMarker, anchor: 'center' })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup().setHTML(
        `<b>Your Location</b><br/>` +
        `Latitude: ${latitude.toFixed(6)}<br/>` +
        `Longitude: ${longitude.toFixed(6)}`
      ))
      .addTo(mapInstance.current);

    // Center map on user location
    mapInstance.current.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      duration: 1000
    });
  };

  if (mapError) {
      return <div className="p-4 bg-red-50 text-red-500 rounded">Map Error: {mapError}</div>;
  }

  return (
    <div>
      {locationError && (
        <div className="mb-3 p-3 bg-yellow-50 text-yellow-700 rounded text-sm">
          ⚠️ {locationError}
        </div>
      )}
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px', minHeight: '400px' }} />
    </div>
  );
}
