# Quick Reference: OSRM Routing

## Using the Route System

### Basic Usage (Automatic)
Routes load automatically when the map initializes. No action needed—routes display as a blue line between emergency center and water crisis location.

### Manual Endpoint Override
```typescript
import { setRouteEndpoints } from '@/lib/routing/routeSource';

// Set custom start/end points
setRouteEndpoints(
  { lng: 51.532, lat: 25.316 }, // Start
  { lng: 51.503, lat: 25.278 }   // End
);
```

### Getting Route Data Programmatically
```typescript
import { fetchRoute } from '@/lib/routing/osrm';

const route = await fetchRoute(
  { lng: 51.532, lat: 25.316 },
  { lng: 51.503, lat: 25.278 }
);

console.log(`Distance: ${route.properties.distance}m`);
console.log(`Duration: ${route.properties.duration}s`);
```

### Clearing Routes
```typescript
import { clearRoute } from '@/lib/map/routeLayer';

clearRoute(mapInstance);
```

---

## Integration with Database (Future)

### Step 1: Modify `routeSource.ts`
```typescript
export async function getRouteEndpoints(): Promise<{ start: Coordinate; end: Coordinate }> {
  // Query your database instead of using hardcoded values
  const emergency = await db.emergency_points.select().first();
  const crisis = await db.water_crisis_locations.select().first();
  
  return {
    start: { lng: emergency.longitude, lat: emergency.latitude },
    end: { lng: crisis.longitude, lat: crisis.latitude },
  };
}
```

### Step 2: Reload Routes on Data Change
```typescript
// In LifelineMap.tsx component
useEffect(() => {
  // Reload route when database data changes
  if (crisisLocation) {
    loadRoute();
  }
}, [crisisLocation]);
```

---

## Styling Customization

Edit `lib/map/routeLayer.ts` to change:
- Line color: `'line-color': '#3b82f6'`
- Line width: `'line-width': 4`
- Start marker color: `'circle-color': '#10b981'` 
- End marker color: `'circle-color': '#ef4444'`

---

## Debugging

### Check Console
```
Route loaded: 12.3km, 18min
```

### View Route Data
```typescript
// In browser console
setRouteEndpoints({ lng: 51.5, lat: 25.3 }, { lng: 51.6, lat: 25.4 });
// Route will update immediately
```

### OSRM API Test
```
https://router.project-osrm.org/route/v1/driving/51.532,25.316;51.503,25.278
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Route not showing | Check browser console for errors; verify coordinates are valid |
| "Route source not found" | Ensure `initRouteLayer()` called after map loads |
| Slow route loads | OSRM public API can be slow; consider local instance for production |
| Geolocation always fallback | User denied permission or HTTPS not available |

---

## Architecture Principles

✅ **Stateless routing logic** — `osrm.ts` has no dependencies
✅ **Database-agnostic** — Replace `routeSource.ts` without touching other files
✅ **Reusable layer helpers** — Use `routeLayer.ts` for any GeoJSON source
✅ **Independent of sensors** — Routes render independently of water_readings markers
✅ **Public API** — No authentication or keys required
