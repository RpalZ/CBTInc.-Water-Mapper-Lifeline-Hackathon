# Database Migration Guide for Routing

When you're ready to add database persistence for routes, follow this guide.

## Phase 1: Database Schema

### Suggested Supabase Tables

```sql
-- Emergency response points (fire stations, hospitals, etc.)
CREATE TABLE emergency_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'fire_station', 'hospital', 'water_service', etc.
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Water crisis/flooding locations
CREATE TABLE water_crisis_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL REFERENCES water_readings(device_id),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  priority BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Cached routes (optional, for performance)
CREATE TABLE cached_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_point_id UUID REFERENCES emergency_points(id),
  end_point_id UUID REFERENCES water_crisis_locations(id),
  distance_meters FLOAT NOT NULL,
  duration_seconds FLOAT NOT NULL,
  route_geojson JSONB NOT NULL, -- Full OSRM response
  created_at TIMESTAMP DEFAULT now(),
  ttl INTERVAL DEFAULT '1 hour'
);

-- Create index for faster lookups
CREATE INDEX idx_crisis_priority ON water_crisis_locations(priority);
CREATE INDEX idx_emergency_active ON emergency_points(active);
```

---

## Phase 2: Update Route Source

Replace `src/lib/routing/routeSource.ts` getRouteEndpoints():

```typescript
import { createClient } from '@supabase/supabase-js';
import { Coordinate } from './osrm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getRouteEndpoints(): Promise<{
  start: Coordinate;
  end: Coordinate;
}> {
  try {
    // Get active emergency center
    const { data: emergency, error: emergencyError } = await supabase
      .from('emergency_points')
      .select('id, latitude, longitude')
      .eq('active', true)
      .eq('type', 'water_service') // Prioritize water department
      .limit(1)
      .single();

    if (emergencyError) throw emergencyError;

    // Get highest priority crisis location
    const { data: crisis, error: crisisError } = await supabase
      .from('water_crisis_locations')
      .select('id, latitude, longitude')
      .eq('priority', true)
      .order('severity', { ascending: false })
      .limit(1)
      .single();

    if (crisisError) throw crisisError;

    return {
      start: { lng: emergency.longitude, lat: emergency.latitude },
      end: { lng: crisis.longitude, lat: crisis.latitude },
    };
  } catch (error) {
    console.warn('Failed to fetch endpoints from database:', error);
    // Fallback to hardcoded values
    return getHardcodedEndpoints();
  }
}

function getHardcodedEndpoints() {
  return {
    start: { lng: 51.532, lat: 25.316 },
    end: { lng: 51.503, lat: 25.278 },
  };
}
```

---

## Phase 3: Add Route Caching (Optional)

For better performance, cache routes before calling expensive OSRM API:

```typescript
import { fetchRoute } from './osrm';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getCachedRoute(
  startPointId: string,
  endPointId: string
) {
  // Check cache first
  const { data, error } = await supabase
    .from('cached_routes')
    .select('route_geojson')
    .eq('start_point_id', startPointId)
    .eq('end_point_id', endPointId)
    .gt('created_at', 'now() - 1 hour')
    .limit(1)
    .single();

  if (data) {
    return data.route_geojson;
  }

  // Not in cache, fetch fresh
  const { start, end } = await getRouteEndpoints();
  const route = await fetchRoute(start, end);

  // Store in cache
  await supabase.from('cached_routes').insert({
    start_point_id: startPointId,
    end_point_id: endPointId,
    distance_meters: route.properties.distance,
    duration_seconds: route.properties.duration,
    route_geojson: route,
  });

  return route;
}
```

---

## Phase 4: Update LifelineMap Component

Add automatic route reload when crisis priorities change:

```typescript
// Add to LifelineMap.tsx
const { data: crisisLocations } = useQuery(`
  SELECT id, priority FROM water_crisis_locations WHERE priority = true
`);

useEffect(() => {
  // Reload route if crisis priorities change
  if (mapInstance.current && crisisLocations?.length > 0) {
    loadRoute();
  }
}, [crisisLocations?.map(c => c.id).join(',')]);
```

---

## Phase 5: Add UI for Endpoint Selection

Create a component to let users manually select emergency centers and crisis locations:

```typescript
// components/RouteSelector.tsx
import { setRouteEndpoints } from '@/lib/routing/routeSource';
import { useQuery } from '@powersync/react';

export function RouteSelector() {
  const { data: emergency } = useQuery('SELECT * FROM emergency_points WHERE active = true');
  const { data: crisis } = useQuery('SELECT * FROM water_crisis_locations');

  return (
    <div className="p-4 space-y-3">
      <select onChange={(e) => {
        const ep = emergency.find(e => e.id === e.target.value);
        setRouteEndpoints({ lng: ep.longitude, lat: ep.latitude }, /* end */);
      }}>
        {emergency?.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      <select onChange={(e) => {
        const cr = crisis.find(c => c.id === e.target.value);
        // Update end point
      }}>
        {crisis?.map(c => <option key={c.id} value={c.id}>{c.description}</option>)}
      </select>
    </div>
  );
}
```

---

## Rollout Checklist

- [ ] Create database tables in Supabase
- [ ] Update `routeSource.ts` with database queries
- [ ] Test with development data
- [ ] Add route selector UI (optional)
- [ ] Implement caching if needed
- [ ] Set up real-time sync for crisis updates
- [ ] Test fallback to hardcoded values on DB error
- [ ] Update tests and documentation

---

## Rollback Plan

If issues occur, the system automatically falls back to hardcoded coordinates. No code changes needed—just fix the database query.
