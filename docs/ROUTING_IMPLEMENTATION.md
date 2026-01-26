# OSRM Routing Implementation Summary

## Overview
Implemented OSRM routing integration with MapLibre for the Water Mapper Lifeline project. The system calculates routes between emergency response points and water crisis locations, renders them on the map with clean styling, and is structured for future database integration.

## Architecture

### 1. Routing Service: `lib/routing/osrm.ts`
**Purpose:** Core routing logic using the public OSRM API

**Key Components:**
- `Coordinate` interface: `{ lng: number; lat: number }`
- `RouteResponse` interface: GeoJSON Feature with geometry and route metadata
- `fetchRoute(start, end)`: Calls `router.project-osrm.org/route/v1/driving`

**Features:**
- Returns complete route as GeoJSON LineString
- Includes distance (meters) and duration (seconds) in properties
- Uses `?overview=full` for full geometry resolution
- No dependency on database—pure utility function

**Future Extension:**
- No changes needed here; remains stateless and database-agnostic

---

### 2. Route Source: `lib/routing/routeSource.ts`
**Purpose:** Provides start/end coordinates for routing (abstraction layer for future DB integration)

**Key Components:**
- `getRouteEndpoints()`: Async function returning `{ start, end }` coordinates
- `getUserLocation()`: Browser Geolocation API with 5s timeout
- `setRouteEndpoints(start, end)`: Override endpoints for testing
- `getOverrideEndpoints()`: Check for manually set endpoints

**Current Behavior:**
1. Attempts to get user's GPS location
2. Falls back to hardcoded Doha coordinates:
   - **Start:** Doha Emergency Services (51.532, 25.316)
   - **End:** Lusail water crisis example (51.503, 25.278)

**Future Database Integration:**
Replace `getRouteEndpoints()` with PowerSync queries:
```typescript
// Example future implementation:
const emergencyPoint = await db.select().from('emergency_points').where({ id: selectedId });
const crisisLocation = await db.select().from('water_crisis_locations').where({ id: crisisId });
```

---

### 3. MapLibre Route Layer Helpers: `lib/map/routeLayer.ts`
**Purpose:** Reusable MapLibre layer management for route visualization

**Key Functions:**

#### `initRouteLayer(map)`
Creates empty GeoJSON source and three layers on first load:
- **Route line layer** (`route-line`): Blue line with rounded caps/joins
  - Color: `#3b82f6` (vibrant blue)
  - Width: 4px
  - Opacity: 0.8
- **Start marker** (`route-start`): Green circle (10b981)
- **End marker** (`route-end`): Red circle (ef4444)

#### `updateRoute(map, route, startCoord, endCoord)`
Updates the GeoJSON source with:
- Route geometry (LineString)
- Start point marker (green)
- End point marker (red)
- Automatically fits map bounds with 50px padding

#### `clearRoute(map)`
Clears all route features from the map

**Styling Principles:**
- Clean, minimal design with clear color coding
- Green = start/safe, Red = end/alert
- Rounded joins for professional appearance
- No dependency on external styling—all inline

---

### 4. Component Integration: `LifelineMap.tsx`
**What Changed:**
1. Added route-related imports
2. Added `routeLoading` state
3. Called `initRouteLayer()` after map initialization
4. Added `loadRoute()` async function to:
   - Get route endpoints (with override support)
   - Call OSRM API
   - Render route on map
   - Log route distance/duration to console
5. Trigger initial route load on map `load` event

**Current Behavior:**
- Route automatically loads when map finishes initializing
- Route rendering does NOT block sensor marker display
- Route load failures log to console but don't crash the app
- Sensors still display correctly regardless of route status

---

## Data Flow

```
LifelineMap loads
    ↓
Map initializes
    ↓
initRouteLayer() → Creates empty GeoJSON source and layers
    ↓
map.on('load') → Triggers loadRoute()
    ↓
getRouteEndpoints() → Returns { start, end }
    ↓
fetchRoute(start, end) → Calls OSRM API
    ↓
updateRoute() → Updates map with GeoJSON + markers
    ↓
Route visible on map (independent of sensor markers)
```

---

## Coordinate System
- **Order:** `[longitude, latitude]` throughout (standard GeoJSON/MapLibre)
- **Example:** Doha = `[51.528, 25.319]`

---

## Future Enhancements

### 1. Database Integration
```typescript
// Replace getRouteEndpoints() with:
export async function getRouteEndpoints(): Promise<{ start: Coordinate; end: Coordinate }> {
  const emergency = await db.query('SELECT * FROM emergency_points WHERE active = true LIMIT 1');
  const crisis = await db.query('SELECT * FROM water_crisis_locations WHERE priority = true LIMIT 1');
  
  return {
    start: { lng: emergency.longitude, lat: emergency.latitude },
    end: { lng: crisis.longitude, lat: crisis.latitude },
  };
}
```

### 2. User Selection UI
Wrap `setRouteEndpoints()` in a dropdown/modal to let users choose:
- Which emergency center to start from
- Which water crisis location to navigate to

### 3. Multiple Routes
Modify `fetchRoute()` and `updateRoute()` to display alternatives:
```typescript
const routes = data.routes; // OSRM returns up to 3
// Display all routes with different opacity/color
```

### 4. Real-time Updates
Add effect to reload route when:
- User location changes significantly
- Crisis location selection changes
- Emergency center changes

### 5. Directions Panel
Expand `RouteResponse` to include `steps` and display turn-by-turn directions:
```typescript
const response = await fetchRoute(start, end, { steps: true });
// Parse response.steps and render instruction list
```

### 6. Alternative Routing Services
The implementation is API-agnostic—can swap OSRM for:
- GraphHopper
- Vroom (multi-stop optimization)
- Local OSRM instance

---

## Testing Checklist

- [ ] Map loads and route appears (blue line with green/red markers)
- [ ] Route distance and duration log to console
- [ ] Browser geolocation permission works (and falls back gracefully)
- [ ] Manual endpoint override works via `setRouteEndpoints()`
- [ ] Sensor markers still display correctly
- [ ] No errors in browser console
- [ ] Map fits to route bounds automatically

---

## Files Created
1. `src/lib/routing/osrm.ts` — OSRM API wrapper
2. `src/lib/routing/routeSource.ts` — Route endpoint provider
3. `src/lib/map/routeLayer.ts` — MapLibre layer helpers
4. `src/components/LifelineMap.tsx` — Updated with routing integration

## Files Modified
- `src/components/LifelineMap.tsx` — Added routing initialization and load logic

---

## Dependencies
- `maplibre-gl` (already in project)
- Browser Geolocation API (no package needed)
- Network access to `router.project-osrm.org` (public API, no auth required)
