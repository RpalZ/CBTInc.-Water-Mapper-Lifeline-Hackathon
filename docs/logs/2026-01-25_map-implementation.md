# Map Implementation - 2026-01-25

## Changes
- **Dependencies:** Installed `maplibre-gl`, `pmtiles`.
- **Map Initialization:** Created `src/lib/map/initMap.ts` to register PMTiles protocol and RTL text plugin.
- **Component:** Created `src/components/LifelineMap.tsx`.
  - Uses `water_readings` table.
  - Visualizes pressure as color (Red/Blue).
  - Handles missing map source gracefully (logs error, allows markers to render).
- **Dashboard:** Updated `src/app/dashboard/overview/page.tsx` to include the `LifelineMap`.
- **Offline:** Updated `src/app/sw.ts` to cache `.pmtiles` files with `rangeRequests: true`.

## Next Steps for User
1.  **Generate Map:** Go to [protomaps.com/extracts](https://protomaps.com/extracts), download Doha extract.
2.  **Upload:** Upload to Supabase Storage bucket `maps` with name `doha.pmtiles`.
3.  **Permissions:** Ensure the `maps` bucket is public.
