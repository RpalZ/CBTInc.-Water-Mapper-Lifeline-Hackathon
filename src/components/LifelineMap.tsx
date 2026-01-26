'use client';
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useQuery } from '@powersync/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { initMapLibre } from '@/lib/map/initMap';
import WaterMarker, { WaterMarkerData } from './MapMarkers/WaterMarker';

// Initialize map protocols globally once
initMapLibre();

export default function LifelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: React.ReactNode }>({});
  const [mapError, setMapError] = useState<string | null>(null);
  const [expandedMarkerId, setExpandedMarkerId] = useState<string | null>(null);
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

  // Get user's current location for testing
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
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
      
      // Add custom location button
      const locationButton = document.createElement('button');
      locationButton.className = 'maplibregl-ctrl-icon';
      locationButton.title = 'Go to your location';
      locationButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94-2c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
        </svg>
      `;
      locationButton.style.cssText = `
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        padding: 8px;
        margin-top: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s;
      `;
      locationButton.onmouseover = () => {
        locationButton.style.backgroundColor = '#f0f0f0';
      };
      locationButton.onmouseout = () => {
        locationButton.style.backgroundColor = '#fff';
      };
      locationButton.onclick = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            mapInstance.current?.flyTo({
              center: [lng, lat],
              zoom: 16,
              duration: 1000,
            });
          });
        }
      };
      
      const locationContainer = document.createElement('div');
      locationContainer.className = 'maplibregl-ctrl maplibregl-ctrl-group';
      locationContainer.appendChild(locationButton);
      mapInstance.current.addControl({ onAdd() { return locationContainer; }, onRemove() {} } as any, 'top-right');
      
      mapInstance.current.on('error', (e) => {
        console.warn('Map error:', e);
        // Don't block the UI, just log. 
        // Common error: Source "doha" not found if pmtiles file is missing.
      });

      // Add test route source and layers after map is ready
      mapInstance.current.on('load', () => {
        // Add GeoJSON source for test route
        if (!mapInstance.current?.getSource('test-route')) {
          mapInstance.current?.addSource('test-route', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Add route line layer
          mapInstance.current?.addLayer({
            id: 'test-route-line',
            type: 'line',
            source: 'test-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#0077b6',
              'line-width': 5
            }
          });

          // Add animated marker circle layer
          mapInstance.current?.addLayer({
            id: 'nav-marker',
            type: 'circle',
            source: 'test-route',
            filter: ['==', '$type', 'Point'],
            paint: {
              'circle-radius': 8,
              'circle-color': '#00d4ff',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
              'circle-opacity': 0.9
            }
          });
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
  }, []);

  // Update test route visualization based on user location
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;

    // Wait for map to be fully loaded before updating route
    const updateRoute = () => {
      // Abu Hamour petrol station coordinates (Doha)
      const abuHamourPetrol = {
        lng: 51.515,
        lat: 25.255
      };

      // Create LineString feature for the route
      const routeFeature = {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [userLocation.lng, userLocation.lat],
            [abuHamourPetrol.lng, abuHamourPetrol.lat]
          ]
        },
        properties: {}
      };

      // Create animated marker point
      const navMarkerFeature = {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [userLocation.lng, userLocation.lat]
        },
        properties: {}
      };

      // Update the GeoJSON source with the route and marker
      const source = mapInstance.current?.getSource('test-route') as any;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [routeFeature, navMarkerFeature]
        });
      }

      // Animate the marker along the route
      const animationDuration = 10000; // 10 seconds
      let startTime = Date.now();
      let animationFrameId: number | NodeJS.Timeout;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        // Linear interpolation between start and Abu Hamour
        const currentLng = userLocation.lng + (abuHamourPetrol.lng - userLocation.lng) * progress;
        const currentLat = userLocation.lat + (abuHamourPetrol.lat - userLocation.lat) * progress;

        // Update marker position
        const updatedSource = mapInstance.current?.getSource('test-route') as any;
        if (updatedSource) {
          updatedSource.setData({
            type: 'FeatureCollection',
            features: [
              routeFeature,
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'Point' as const,
                  coordinates: [currentLng, currentLat]
                },
                properties: {}
              }
            ]
          });
        }

        // Continue animation if not complete
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Reset animation to start after 1 second pause
          animationFrameId = setTimeout(() => {
            startTime = Date.now();
            animationFrameId = requestAnimationFrame(animate);
          }, 1000);
        }
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        cancelAnimationFrame(animationFrameId as number);
        clearTimeout(animationFrameId as any);
      };
    };

    if (mapInstance.current.isStyleLoaded()) {
      updateRoute();
    } else {
      mapInstance.current.once('load', updateRoute);
    }
  }, [userLocation]);

  // Sync markers with WaterMarker component
  useEffect(() => {
    if (!mapInstance.current) return;

    if (userLocation) {
      const testMarkerData: WaterMarkerData = {
        id: 'test-user-location',
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        water_amount: 456,
        location: 'Your Current Location',
        status: 'active',
        last_updated: new Date().toLocaleString(),
        additional_notes: 'Test marker at your location',
        device_id: 'TEST-001',
        pressure_pa: 2500,
        battery_voltage: 4.2,
      };

      markersRef.current['test-user-location'] = (
        <WaterMarker
          key="test-user-location"
          data={testMarkerData}
          map={mapInstance.current!}
          onDetailClick={(data) => {
            setExpandedMarkerId(data.id);
          }}
          isExpanded={expandedMarkerId === 'test-user-location'}
          onClose={() => setExpandedMarkerId(null)}
        />
      );
    }

    if (!readings) return;

    readings.forEach((reading) => {
      if (!reading.latitude || !reading.longitude || !reading.device_id) return;

      const markerData: WaterMarkerData = {
        id: reading.device_id,
        latitude: reading.latitude,
        longitude: reading.longitude,
        water_amount: Math.round((reading.pressure_pa || 0) / 10),
        location: `Site ${reading.device_id.slice(-3)}`,
        status: (reading.pressure_pa || 0) > 2000 ? 'active' : 'alert',
        last_updated: new Date(reading.recorded_at).toLocaleString(),
        additional_notes: `Battery: ${reading.battery_voltage}V`,
        device_id: reading.device_id,
        pressure_pa: reading.pressure_pa,
        battery_voltage: reading.battery_voltage,
      };

      markersRef.current[reading.device_id] = (
        <WaterMarker
          key={reading.device_id}
          data={markerData}
          map={mapInstance.current!}
          onDetailClick={(data) => {
            setExpandedMarkerId(data.id);
          }}
          isExpanded={expandedMarkerId === reading.device_id}
          onClose={() => setExpandedMarkerId(null)}
        />
      );
    });
  }, [readings, expandedMarkerId, userLocation]);

  if (mapError) {
      return <div className="p-4 bg-red-50 text-red-500 rounded">Map Error: {mapError}</div>;
  }

  return (
    <>
      <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px', minHeight: '400px' }} />
      {Object.values(markersRef.current)}
    </>
  );
}
