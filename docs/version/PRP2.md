This **Product Requirements & Plan (PRP)** is designed specifically for your **Lifeline** project. It integrates your local-first **PowerSync** data, **Serwist** PWA offline capabilities, and **MapLibre** for a zero-cost, high-performance map in Doha.

You can copy this into a `MAP_IMPLEMENTATION.md` file in your project.

---

```markdown
# PRP: Lifeline Local-First Map Implementation

## 1. Overview
The goal is to provide a high-performance, offline-capable map for the Lifeline PWA. It will visualize water level sensors across Doha using GPU-accelerated vector tiles and local SQLite data.

## 2. Technical Stack
- **Engine:** MapLibre GL JS (Open-source Mapbox fork).
- **Data Format:** Protomaps (PMTiles) for serverless, single-file map hosting.
- **Data Source:** PowerSync (Local SQLite) for real-time sensor markers.
- **Offline:** Serwist (Service Worker) for caching the `.pmtiles` map file.

## 3. Implementation Steps

### Step 1: Dependencies
```bash
npm install maplibre-gl pmtiles @types/maplibre-gl

```

### Step 2: Assets & Hosting

1. Generate a Doha extract at [protomaps.com/extracts](https://protomaps.com/extracts).
2. Upload the `doha.pmtiles` file to your Supabase Storage bucket (`maps/doha.pmtiles`).
3. Set the bucket to **Public** so MapLibre can fetch range-requests.

### Step 3: Global Map Setup (Arabic Support)

In your root layout or a specialized `MapProvider.tsx`, initialize the PMTiles protocol and the RTL (Right-to-Left) plugin for Arabic labels.

```typescript
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

export const initMapLibre = () => {
  if (typeof window !== 'undefined') {
    // Register PMTiles
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    // Enable Arabic/RTL support
    maplibregl.setRTLTextPlugin(
      '[https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js](https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js)',
      null,
      true // Lazy load
    );
  }
};

```

### Step 4: The Reactive Map Component

This component hooks into PowerSync's `useQuery` to render markers that update instantly when the database changes.

```tsx
'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useQuery } from '@powersync/react';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function LifelineMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});

  // Fetch sensors from local SQLite
  const { data: sensors } = useQuery("SELECT id, name, lat, lng, water_level FROM sensors");

  useEffect(() => {
    if (!mapContainer.current) return;

    mapInstance.current = new maplibregl.Map({
      container: mapContainer.current,
      center: [51.528, 25.319], // Doha West Bay
      zoom: 12,
      style: {
        version: 8,
        sources: {
          'doha': {
            type: 'vector',
            url: `pmtiles://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/maps/doha.pmtiles`,
            attribution: '© OpenStreetMap'
          }
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': '#f0f2f5' } },
          { id: 'water', type: 'fill', source: 'doha', 'source-layer': 'water', paint: { 'fill-color': '#90e0ef' } },
          { id: 'roads', type: 'line', source: 'doha', 'source-layer': 'roads', paint: { 'line-color': '#ffffff' } }
        ]
      }
    });

    return () => mapInstance.current?.remove();
  }, []);

  // Sync markers with PowerSync data
  useEffect(() => {
    if (!mapInstance.current || !sensors) return;

    sensors.forEach(sensor => {
      // Update or Create markers
      if (markers.current[sensor.id]) {
        markers.current[sensor.id].setLngLat([sensor.lng, sensor.lat]);
      } else {
        const m = new maplibregl.Marker({
          color: sensor.water_level < 20 ? '#ff4d4d' : '#0077b6'
        })
          .setLngLat([sensor.lng, sensor.lat])
          .setPopup(new maplibregl.Popup().setHTML(`<b>${sensor.name}</b>: ${sensor.water_level}%`))
          .addTo(mapInstance.current!);
        
        markers.current[sensor.id] = m;
      }
    });
  }, [sensors]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />;
}

```

## 4. Maintenance & Scaling

* **Offline Caching:** Update your `serwist` config to include the `.pmtiles` URL in the `additionalPrecacheEntries` to ensure the map loads without internet.
* **Tile Updates:** Simply download a new extract from Protomaps every few months and replace the file in Supabase Storage. No code changes required.

```

---

### What's next?
Would you like me to help you configure the **Serwist** `sw.ts` file so it specifically caches that large `.pmtiles` file for a truly offline experience?

```